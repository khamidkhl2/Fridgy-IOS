/**
 * Micronutrient taxonomy — the single source of truth for which micros we track,
 * how they're displayed, their sex-aware daily targets, and which 3 to surface
 * for a given user (personalized by training type + diet).
 *
 * Lives in its own module so both the food data layer (food.ts) and the USDA
 * client (usda.ts) can import it without a circular dependency. The Supabase
 * edge functions (Deno) can't import from here, so the USDA nutrient-number map
 * is duplicated in `usda-search`.
 */

export type MicroKey =
  | 'iron'
  | 'magnesium'
  | 'zinc'
  | 'calcium'
  | 'potassium'
  | 'sodium'
  | 'vitaminC'
  | 'vitaminD'
  | 'vitaminB12'
  | 'fiber';

/** Canonical order — also the global tie-break priority for `pickMicros`. */
export const MICRO_KEYS: MicroKey[] = [
  'iron',
  'magnesium',
  'potassium',
  'calcium',
  'zinc',
  'sodium',
  'vitaminC',
  'vitaminD',
  'vitaminB12',
  'fiber',
];

/** A sparse map of micro → absolute amount (whatever subset a source reports). */
export type MicroMap = Partial<Record<MicroKey, number>>;

export type MicroUnit = 'g' | 'mg' | 'mcg';

/** One-line "why it matters" shown in the micro detail card. */
export const MICRO_INFO: Record<MicroKey, string> = {
  iron: 'Carries oxygen in your blood — low iron means fatigue and weaker endurance.',
  magnesium: 'Powers muscle contraction, energy production and recovery; helps prevent cramps.',
  zinc: 'Supports muscle repair, immune defense and hormone production after training.',
  calcium: 'Builds strong bones and is essential for every muscle contraction.',
  potassium: 'A key electrolyte for fluid balance, nerve signals and avoiding cramps.',
  sodium: 'Replaces what you sweat out — but too much over the day strains your heart.',
  vitaminC: 'An antioxidant that aids recovery, immunity, and helps you absorb iron.',
  vitaminD: 'Supports bone strength, muscle function and immunity — easy to run low on.',
  vitaminB12: 'Helps make red blood cells and turn food into energy; key on plant-based diets.',
  fiber: 'Feeds gut health, steadies blood sugar, and keeps you full.',
};

/** Display metadata. `goal` micros you aim to hit; `limit` ones to stay under. */
export const MICRO_META: Record<MicroKey, { label: string; emoji: string; unit: MicroUnit; kind: 'goal' | 'limit' }> = {
  iron: { label: 'Iron', emoji: '🩸', unit: 'mg', kind: 'goal' },
  magnesium: { label: 'Magnesium', emoji: '🧲', unit: 'mg', kind: 'goal' },
  zinc: { label: 'Zinc', emoji: '🛡️', unit: 'mg', kind: 'goal' },
  calcium: { label: 'Calcium', emoji: '🦴', unit: 'mg', kind: 'goal' },
  potassium: { label: 'Potassium', emoji: '🍌', unit: 'mg', kind: 'goal' },
  sodium: { label: 'Sodium', emoji: '🧂', unit: 'mg', kind: 'limit' },
  vitaminC: { label: 'Vitamin C', emoji: '🍊', unit: 'mg', kind: 'goal' },
  vitaminD: { label: 'Vitamin D', emoji: '☀️', unit: 'mcg', kind: 'goal' },
  vitaminB12: { label: 'Vitamin B12', emoji: '⚡', unit: 'mcg', kind: 'goal' },
  fiber: { label: 'Fiber', emoji: '🌾', unit: 'g', kind: 'goal' },
};

/**
 * Sex-aware recommended daily amount. Female values for the female RDAs where
 * they differ materially (iron, magnesium, zinc, vitamin C, potassium); shared
 * otherwise. Sodium is an upper limit. Falls back to the higher (male) value
 * when sex is unknown so a goal isn't understated.
 */
export function microTarget(key: MicroKey, gender?: string | null): number {
  const female = gender === 'Female';
  switch (key) {
    case 'iron':
      return female ? 18 : 8; // mg — premenopausal women need more
    case 'magnesium':
      return female ? 310 : 400; // mg
    case 'zinc':
      return female ? 8 : 11; // mg
    case 'calcium':
      return 1000; // mg
    case 'potassium':
      return female ? 2600 : 3400; // mg (adequate intake)
    case 'sodium':
      return 2300; // mg — upper limit
    case 'vitaminC':
      return female ? 75 : 90; // mg
    case 'vitaminD':
      return 15; // mcg (600 IU)
    case 'vitaminB12':
      return 2.4; // mcg
    case 'fiber':
      return female ? 25 : 30; // g
  }
}

// ── personalization ──────────────────────────────────────────────────────────

/**
 * Research-based top-3 priority micros per training type (sports-nutrition
 * consensus). Weighted 3/2/1 by position; summed across the user's picks.
 */
const TRAINING_PRIORITY: Record<string, [MicroKey, MicroKey, MicroKey]> = {
  Weightlifting: ['magnesium', 'zinc', 'vitaminD'],
  Calisthenics: ['magnesium', 'zinc', 'calcium'],
  CrossFit: ['magnesium', 'iron', 'sodium'],
  'Boxing / MMA': ['iron', 'magnesium', 'sodium'],
  Climbing: ['magnesium', 'calcium', 'vitaminD'],
  Running: ['iron', 'potassium', 'sodium'],
  Cycling: ['iron', 'potassium', 'sodium'],
  Swimming: ['iron', 'vitaminD', 'calcium'],
  Rowing: ['iron', 'potassium', 'magnesium'],
  HIIT: ['potassium', 'sodium', 'magnesium'],
  'Team sports': ['iron', 'potassium', 'sodium'],
  Tennis: ['potassium', 'sodium', 'magnesium'],
  'Dance / Zumba': ['potassium', 'iron', 'calcium'],
  Yoga: ['magnesium', 'calcium', 'vitaminD'],
  Pilates: ['magnesium', 'calcium', 'fiber'],
  Walking: ['fiber', 'potassium', 'vitaminC'],
};

/** General-health trio when the user doesn't train (or picks nothing known). */
const DEFAULT_TRIO: MicroKey[] = ['fiber', 'vitaminC', 'calcium'];

function isPlantBased(dietaryStyles?: string[] | null): boolean {
  return (dietaryStyles ?? []).some((d) => {
    const s = d.toLowerCase();
    return s.includes('vegan') || s.includes('vegetarian') || s.includes('pescatarian');
  });
}

/**
 * The 3 micros to surface on the dashboard, personalized to the user's training
 * combination (and diet). Scores each micro by summed training-priority weight,
 * breaks ties by `MICRO_KEYS` order, and returns the top 3.
 */
export function pickMicros(trainingTypes?: string[] | null, dietaryStyles?: string[] | null): MicroKey[] {
  const types = (trainingTypes ?? []).filter((t) => TRAINING_PRIORITY[t]);
  if (types.length === 0) return DEFAULT_TRIO;

  const score: Partial<Record<MicroKey, number>> = {};
  for (const t of types) {
    TRAINING_PRIORITY[t].forEach((key, i) => {
      score[key] = (score[key] ?? 0) + (3 - i); // 3 / 2 / 1
    });
  }
  // Plant-based diets carry higher iron + B12 deficiency risk — nudge them up.
  if (isPlantBased(dietaryStyles)) {
    score.iron = (score.iron ?? 0) + 2;
    score.vitaminB12 = (score.vitaminB12 ?? 0) + 2;
  }

  return [...MICRO_KEYS]
    .sort((a, b) => (score[b] ?? 0) - (score[a] ?? 0) || MICRO_KEYS.indexOf(a) - MICRO_KEYS.indexOf(b))
    .slice(0, 3);
}
