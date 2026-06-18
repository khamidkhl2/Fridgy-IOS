/**
 * Rough shelf-life estimation for fridge items.
 *
 * Items arrive with a freeform `category` (from the AI scan) or no category at
 * all (manual add). We can't know the true expiry, so we assign a sensible
 * default number of days per category when an item is added; the user can later
 * adjust the date in the fridge UI. These estimates only drive expiry reminders
 * — they're a starting point, not a guarantee.
 */

/** Default shelf-life (days from when the item was added) by normalized category. */
const SHELF_LIFE_DAYS: Record<string, number> = {
  seafood: 2,
  fish: 2,
  meat: 3,
  poultry: 3,
  leftovers: 3,
  bakery: 4,
  bread: 4,
  herbs: 4,
  produce: 5,
  vegetables: 5,
  vegetable: 5,
  fruit: 5,
  fruits: 5,
  dairy: 7,
  cheese: 10,
  eggs: 21,
  drinks: 14,
  beverages: 14,
  frozen: 90,
  pantry: 30,
  condiments: 30,
  condiment: 30,
  snacks: 30,
};

/** Fallback when the category is missing or unrecognized. */
const DEFAULT_SHELF_LIFE_DAYS = 7;

/** Map a freeform category onto a known bucket (case/whitespace-insensitive). */
function shelfLifeDays(category?: string | null): number {
  if (!category) return DEFAULT_SHELF_LIFE_DAYS;
  const key = category.trim().toLowerCase();
  return SHELF_LIFE_DAYS[key] ?? DEFAULT_SHELF_LIFE_DAYS;
}

/**
 * Estimated expiry as an ISO timestamp, `shelfLifeDays` after `from`. Suitable
 * for `fridge_items.expires_at`.
 */
export function estimateExpiry(category?: string | null, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + shelfLifeDays(category));
  return d.toISOString();
}

/**
 * Whole days from now until `expiresAt` (local calendar days, rounded).
 * Negative when already expired, 0 when it expires today.
 */
export function daysUntil(expiresAt: string, now: Date = new Date()): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const exp = new Date(expiresAt);
  const startOfExp = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfExp.getTime() - startOfToday.getTime()) / MS_PER_DAY);
}
