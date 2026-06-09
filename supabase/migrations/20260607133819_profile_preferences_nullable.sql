-- Make preference columns nullable so NULL = "never synced from a device yet".
-- That lets the app upload the device's local prefs on first sync instead of
-- overwriting them with the migration defaults.
alter table public.profiles alter column theme_index drop not null;
alter table public.profiles alter column theme_index drop default;
alter table public.profiles alter column theme_mode  drop not null;
alter table public.profiles alter column theme_mode  drop default;
alter table public.profiles alter column water_unit  drop not null;
alter table public.profiles alter column water_unit  drop default;

-- Existing rows only hold the migration defaults (no one has synced prefs yet) →
-- reset to NULL so first run treats local as the source of truth.
update public.profiles set theme_index = null, theme_mode = null, water_unit = null;
