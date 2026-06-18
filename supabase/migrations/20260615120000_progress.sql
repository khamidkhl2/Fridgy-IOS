-- Progress: a goal weight on the profile + a body-weight history log.

alter table public.profiles
  add column if not exists goal_weight_kg numeric(5,2);

-- weight_logs — periodic body-weight check-ins (one per day). The latest is the
-- current weight; the series drives the trend chart and goal progress.
create table public.weight_logs (
  id          uuid         primary key default gen_random_uuid(),
  user_id     uuid         not null references auth.users (id) on delete cascade,
  logged_on   date         not null default current_date,
  weight_kg   numeric(5,2) not null,
  created_at  timestamptz  not null default now(),
  unique (user_id, logged_on)
);

create index weight_logs_user_day_idx on public.weight_logs (user_id, logged_on);

alter table public.weight_logs enable row level security;

create policy "Weight logs are selectable by owner"
  on public.weight_logs for select using (auth.uid() = user_id);
create policy "Weight logs are insertable by owner"
  on public.weight_logs for insert with check (auth.uid() = user_id);
create policy "Weight logs are updatable by owner"
  on public.weight_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Weight logs are deletable by owner"
  on public.weight_logs for delete using (auth.uid() = user_id);
