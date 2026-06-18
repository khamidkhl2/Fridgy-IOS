-- Micronutrients on food_logs (nullable; populated from USDA data when available,
-- null for AI-scanned meals until that path estimates them). Summed per day for
-- the Kitchen micronutrient card.
alter table public.food_logs
  add column if not exists fiber_g      numeric(7,2),
  add column if not exists sugar_g      numeric(7,2),
  add column if not exists sodium_mg    numeric(8,2),
  add column if not exists potassium_mg numeric(8,2);
