-- AI usage metering for per-user daily rate limits on the OpenAI-backed Edge
-- Functions (scan-fridge, generate-recipes). Without this, any signed-in user
-- can call those functions in a loop and drain the project's OpenAI balance.
--
-- One row per user / function / UTC-day holds a running call count. The
-- increment_ai_usage() RPC below atomically bumps the count and reports whether
-- the call is within budget, so the check is race-free under concurrency.

create table if not exists public.ai_usage (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  fn         text        not null,
  day        date        not null,
  count      integer     not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, fn, day)
);

alter table public.ai_usage enable row level security;

-- Users may read their own usage (e.g. to show "N scans left today"). Writes go
-- only through the SECURITY DEFINER function below or the service role, so a
-- client can never reset or tamper with its own counters.
drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
  for select using ((select auth.uid()) = user_id);

-- Atomically count one call of p_fn against p_user's daily budget and report
-- whether it is allowed. Returns the post-increment count and the limit.
-- SECURITY DEFINER so it can write ai_usage regardless of RLS; the Edge Function
-- passes a user id it resolved from a verified JWT, never one from the client.
create or replace function public.increment_ai_usage(
  p_user  uuid,
  p_fn    text,
  p_limit integer
)
returns table (allowed boolean, used integer, lim integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.ai_usage (user_id, fn, day, count, updated_at)
  values (p_user, p_fn, (now() at time zone 'utc')::date, 1, now())
  on conflict (user_id, fn, day)
  do update set count = ai_usage.count + 1, updated_at = now()
  returning ai_usage.count into v_count;

  return query select (v_count <= p_limit), v_count, p_limit;
end;
$$;

-- Only the service role (used by the Edge Functions) may call this. Clients have
-- no business invoking it directly.
revoke all on function public.increment_ai_usage(uuid, text, integer) from public;
revoke all on function public.increment_ai_usage(uuid, text, integer) from anon;
revoke all on function public.increment_ai_usage(uuid, text, integer) from authenticated;
grant execute on function public.increment_ai_usage(uuid, text, integer) to service_role;
