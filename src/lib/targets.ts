/**
 * Nutrition targets engine (pure — no I/O, no imports).
 *
 * Mifflin–St Jeor BMR → TDEE (× activity multiplier) → goal-adjusted daily
 * calories, then a macro split: protein from bodyweight, fat at a fixed % of
 * calories, carbs filling the remainder.
 */

export type Targets = {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
};

// Standard activity factors (PAL) for Mifflin–St Jeor. The chosen activity
// level already accounts for exercise frequency, so training type does NOT add
// calories on top (that double-counts) — it raises the protein target instead.
const ACTIVITY_MULTIPLIER: Record<string, number> = {
  Sedentary: 1.2, // little/no exercise
  'Lightly active': 1.375, // light exercise 1–3 days/wk
  'Moderately active': 1.55, // moderate exercise 3–5 days/wk
  'Very active': 1.725, // hard exercise 6–7 days/wk
};

/** Daily calories as a fraction of maintenance (TDEE), per goal. */
const GOAL_FACTOR: Record<string, number> = {
  'Lose weight': 0.8, // ~20% deficit
  'Build muscle': 1.1, // ~10% lean-gain surplus
  'Maintain weight': 1.0,
  'Eat healthier': 1.0,
};

const FAT_CALORIE_FRACTION = 0.275;
const MIN_CALORIES = 1200;

/** Whole years between an ISO 'YYYY-MM-DD' date and `now`. Null if unparseable. */
export function ageFromISO(iso: string | null | undefined, now = new Date()): number | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

// Training types grouped by how they shift energy + macro needs.
const STRENGTH_TRAINING = new Set([
  'Weightlifting', 'CrossFit', 'Calisthenics', 'Boxing / MMA', 'Climbing',
]);
const ENDURANCE_TRAINING = new Set([
  'Running', 'Cycling', 'Swimming', 'Rowing', 'HIIT', 'Team sports', 'Tennis', 'Dance / Zumba',
]);
const LIGHT_TRAINING = new Set(['Yoga', 'Pilates', 'Walking']);

export function trainingProfile(types: string[]) {
  return {
    strength: types.some((t) => STRENGTH_TRAINING.has(t)),
    endurance: types.some((t) => ENDURANCE_TRAINING.has(t)),
    light: types.some((t) => LIGHT_TRAINING.has(t)),
  };
}

export type TargetInput = {
  gender: string | null;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  activityLevel: string | null;
  goal: string | null;
  /** Onboarding training types (e.g. 'Weightlifting', 'Running'). */
  trainingTypes?: string[] | null;
  /** Onboarding dietary styles (e.g. 'Keto / Low-carb', 'Vegan'). */
  dietaryStyles?: string[] | null;
};

/**
 * Full target breakdown for transparency: BMR (Mifflin–St Jeor) → maintenance
 * (× activity PAL) → goal-adjusted calories (never below BMR), protein from
 * bodyweight + training type, carb/fat split by diet. Null if core
 * anthropometrics (weight, height, age) are missing.
 */
export type TargetBreakdown = Targets & {
  bmr: number;
  /** TDEE — calories to maintain weight. */
  maintenance: number;
  proteinPerKg: number;
  /** Goal multiplier applied to maintenance (e.g. 0.8 = 20% deficit). */
  goalFactor: number;
};

export function computeBreakdown(input: TargetInput): TargetBreakdown | null {
  const { gender, weightKg, heightCm, age, activityLevel, goal } = input;
  if (!weightKg || !heightCm || age == null) return null;

  const training = trainingProfile(input.trainingTypes ?? []);
  const diet = (input.dietaryStyles ?? []).map((d) => d.toLowerCase());
  const isKeto = diet.some((d) => d.includes('keto') || d.includes('low-carb'));
  const isLowCarbish = diet.some((d) => d.includes('paleo') || d.includes('whole30'));
  const isPlantBased = diet.some((d) => d.includes('vegan') || d.includes('vegetarian'));
  const isMediterranean = diet.some((d) => d.includes('mediterranean'));

  // BMR (Mifflin–St Jeor; sex term +5/−161/−78) → maintenance (× PAL) →
  // goal-adjusted calories, floored at BMR (never recommend eating below BMR).
  const sexTerm = gender === 'Male' ? 5 : gender === 'Female' ? -161 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexTerm;
  const pal = (activityLevel && ACTIVITY_MULTIPLIER[activityLevel]) || 1.2;
  const maintenance = bmr * pal;
  const goalFactor = goal ? GOAL_FACTOR[goal] ?? 1 : 1;
  const calories = Math.round(Math.max(MIN_CALORIES, bmr, maintenance * goalFactor) / 10) * 10;

  // Protein (g/kg): training type sets the baseline; goal + plant-based raise it.
  let perKg = training.strength ? 2.0 : 1.6;
  if (goal === 'Lose weight') perKg = Math.max(perKg, 2.0); // preserve lean mass in a deficit
  if (goal === 'Build muscle') perKg = Math.max(perKg, 1.8);
  if (isPlantBased) perKg = Math.max(perKg, 1.8);
  perKg = Math.min(perKg, 2.2);
  const protein = Math.round(weightKg * perKg);

  // Carb/fat split by diet (endurance leans toward carbs).
  let carbs: number;
  let fat: number;
  if (isKeto) {
    carbs = 40; // ketogenic cap
    fat = Math.max(0, Math.round((calories - protein * 4 - carbs * 4) / 9));
  } else {
    let fatFraction = FAT_CALORIE_FRACTION; // 0.275 default
    if (isLowCarbish) fatFraction = 0.35;
    else if (isMediterranean) fatFraction = 0.33;
    else if (training.endurance) fatFraction = 0.22; // leave more room for carbs
    fat = Math.round((calories * fatFraction) / 9);
    carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  }

  return {
    calories,
    protein,
    carbs,
    fat,
    bmr: Math.round(bmr),
    maintenance: Math.round(maintenance),
    proteinPerKg: perKg,
    goalFactor,
  };
}

/** Calorie + macro targets (the subset of the breakdown the app logs against). */
export function computeTargets(input: TargetInput): Targets | null {
  const b = computeBreakdown(input);
  if (!b) return null;
  return { calories: b.calories, protein: b.protein, carbs: b.carbs, fat: b.fat };
}
