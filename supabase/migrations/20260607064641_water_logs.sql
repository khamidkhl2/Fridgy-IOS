-- Water intake logging. Each row is one drink added; daily total = sum per day.
create table public.water_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  logged_on   date        not null default current_date,
  amount_ml   integer     not null,
  created_at  timestamptz not null default now()
);

create index water_logs_user_day_idx on public.water_logs (user_id, logged_on);

alter table public.water_logs enable row level security;

create policy "Water logs are selectable by owner"
  on public.water_logs for select using (auth.uid() = user_id);
create policy "Water logs are insertable by owner"
  on public.water_logs for insert with check (auth.uid() = user_id);
create policy "Water logs are deletable by owner"
  on public.water_logs for delete using (auth.uid() = user_id);
