-- Fridgy — Phase 1: database foundation
-- Tables: profiles, fridge_items, food_logs, recipes, saved_recipes
-- Every table is owned by a user and locked down with Row-Level Security so a
-- signed-in client can only ever touch its own rows.

-- ───────────────────────────────────────────────────────────────────────────
-- Shared helper: keep an updated_at column fresh on UPDATE.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- profiles — 1:1 with auth.users. Holds the onboarding answers (moved off
-- user_metadata in Phase 2) plus the computed nutrition targets (Phase 3).
-- Canonical units are metric (cm / kg); `unit` records the user's display
-- preference so the app can convert back for the UI.
-- ───────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,

  -- identity / onboarding answers
  name                 text,
  goal                 text,          -- 'Lose weight' | 'Build muscle' | 'Maintain weight' | 'Eat healthier'
  dietary_styles       text[]      not null default '{}',
  custom_dietary_style text,
  allergies            text[]      not null default '{}',
  custom_allergy       text,
  gender               text,          -- 'Male' | 'Female' | 'Prefer not to say'
  birth_date           date,
  height_cm            numeric(5,2),  -- canonical metric
  weight_kg            numeric(5,2),  -- canonical metric
  unit                 text        not null default 'imperial'
                         check (unit in ('imperial', 'metric')),
  activity_level       text,          -- 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active'
  training_types       text[]      not null default '{}',
  custom_training_type text,

  -- computed targets (Phase 3 fills these in; nullable until then)
  calorie_target       integer,
  protein_target_g     integer,
  carb_target_g        integer,
  fat_target_g         integer,

  onboarded            boolean     not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────────────
-- fridge_items — ingredients the user has on hand (from scan or manual add).
-- ───────────────────────────────────────────────────────────────────────────
create table public.fridge_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  name        text        not null,
  quantity    text,                       -- freeform for now, e.g. "2" or "200g"
  category    text,
  source      text        not null default 'manual'
                check (source in ('manual', 'scan')),
  added_at    timestamptz not null default now(),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index fridge_items_user_id_idx on public.fridge_items (user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- food_logs — individual foods logged toward a given day's totals.
-- `logged_on` is the calendar day the entry counts for (in the user's local
-- day); the dashboard sums these for remaining calories/macros.
-- ───────────────────────────────────────────────────────────────────────────
create table public.food_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid          not null references auth.users (id) on delete cascade,
  logged_on   date          not null default current_date,
  meal_type   text          not null
                check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name        text          not null,
  calories    integer       not null default 0,
  protein_g   numeric(6,1)  not null default 0,
  carbs_g     numeric(6,1)  not null default 0,
  fat_g       numeric(6,1)  not null default 0,
  quantity    numeric(6,2)  not null default 1,
  source      text          not null default 'manual'
                check (source in ('manual', 'scan', 'recipe')),
  created_at  timestamptz   not null default now()
);

create index food_logs_user_day_idx on public.food_logs (user_id, logged_on);

-- ───────────────────────────────────────────────────────────────────────────
-- recipes — generated/saved recipes. user_id is the owner (AI-generated for a
-- specific user in Phase 6); ingredients/steps are JSON for flexibility.
-- ───────────────────────────────────────────────────────────────────────────
create table public.recipes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  title        text        not null,
  description  text,
  meal_type    text,                       -- 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  minutes      integer,
  calories     integer,
  protein_g    numeric(6,1),
  carbs_g      numeric(6,1),
  fat_g        numeric(6,1),
  ingredients  jsonb       not null default '[]',  -- [{ name, quantity, have }]
  steps        jsonb       not null default '[]',  -- ["step one", ...]
  uses_count   integer     not null default 0,     -- how many fridge items it uses
  created_at   timestamptz not null default now()
);

create index recipes_user_id_idx on public.recipes (user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- saved_recipes — favorites join.
-- ───────────────────────────────────────────────────────────────────────────
create table public.saved_recipes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  recipe_id  uuid        not null references public.recipes (id) on delete cascade,
  saved_at   timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create index saved_recipes_user_id_idx on public.saved_recipes (user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- Auto-create a profile row when a new auth user signs up.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────────────────────────────────────────────
-- Row-Level Security. Enable on every table, then scope each policy to the
-- authenticated owner. profiles is keyed by id (= auth.uid()); the rest by
-- user_id.
-- ───────────────────────────────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.fridge_items   enable row level security;
alter table public.food_logs      enable row level security;
alter table public.recipes        enable row level security;
alter table public.saved_recipes  enable row level security;

-- profiles
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

-- fridge_items
create policy "Fridge items are selectable by owner"
  on public.fridge_items for select using (auth.uid() = user_id);
create policy "Fridge items are insertable by owner"
  on public.fridge_items for insert with check (auth.uid() = user_id);
create policy "Fridge items are updatable by owner"
  on public.fridge_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Fridge items are deletable by owner"
  on public.fridge_items for delete using (auth.uid() = user_id);

-- food_logs
create policy "Food logs are selectable by owner"
  on public.food_logs for select using (auth.uid() = user_id);
create policy "Food logs are insertable by owner"
  on public.food_logs for insert with check (auth.uid() = user_id);
create policy "Food logs are updatable by owner"
  on public.food_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Food logs are deletable by owner"
  on public.food_logs for delete using (auth.uid() = user_id);

-- recipes
create policy "Recipes are selectable by owner"
  on public.recipes for select using (auth.uid() = user_id);
create policy "Recipes are insertable by owner"
  on public.recipes for insert with check (auth.uid() = user_id);
create policy "Recipes are updatable by owner"
  on public.recipes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Recipes are deletable by owner"
  on public.recipes for delete using (auth.uid() = user_id);

-- saved_recipes
create policy "Saved recipes are selectable by owner"
  on public.saved_recipes for select using (auth.uid() = user_id);
create policy "Saved recipes are insertable by owner"
  on public.saved_recipes for insert with check (auth.uid() = user_id);
create policy "Saved recipes are deletable by owner"
  on public.saved_recipes for delete using (auth.uid() = user_id);
