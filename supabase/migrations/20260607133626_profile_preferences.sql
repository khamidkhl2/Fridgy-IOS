-- Device-synced UI preferences on the profile so they follow the account.
alter table public.profiles
  add column if not exists theme_index integer not null default 0,
  add column if not exists theme_mode  text    not null default 'system',
  add column if not exists water_unit  text    not null default 'glasses';
