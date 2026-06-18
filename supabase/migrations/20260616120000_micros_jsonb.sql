-- Replace the per-nutrient micro columns with a single flexible jsonb map, so
-- the tracked micronutrient set can grow (iron, magnesium, zinc, calcium,
-- vitamins…) without schema churn. `micros` holds a sparse { microKey: amount }
-- object for the logged portion; the app sums it per day (food.ts sumMicros).
--
-- The four prior columns from 20260615130000_food_micros.sql may not be deployed
-- yet, so drop them with `if exists`.
alter table public.food_logs
  add column if not exists micros jsonb not null default '{}'::jsonb,
  drop column if exists fiber_g,
  drop column if exists sugar_g,
  drop column if exists sodium_mg,
  drop column if exists potassium_mg;
