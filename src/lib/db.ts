/**
 * Typed data layer for the `profiles` table.
 *
 * The onboarding flow collects answers in the UI's own shape (display units,
 * a month-name birthdate). This module maps that shape to/from the database
 * row, which stores canonical metric units and an ISO birth date. Every read
 * swallows errors and returns null so the app degrades to its local cache when
 * the table is unreachable (offline, or before the migration is applied).
 */
import type { Tables } from './database.types';
import type { OnboardingData } from './onboarding';
import { supabase } from './supabase';
import { ageFromISO, computeBreakdown, computeTargets, type TargetBreakdown, type Targets } from './targets';

/**
 * A row of `public.profiles` (generated from the live schema). The DB stores
 * `unit` as plain text; we refine it to the two values the app actually writes.
 */
export type ProfileRow = Omit<Tables<'profiles'>, 'unit'> & {
  unit: 'imperial' | 'metric';
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const LBS_TO_KG = 0.45359237;
const IN_TO_CM = 2.54;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Onboarding birthDate ({ month name, day, year }) → ISO 'YYYY-MM-DD', or null. */
function birthDateToISO(b: OnboardingData['birthDate'] | undefined): string | null {
  if (!b || typeof b.year !== 'number' || typeof b.day !== 'number') return null;
  const monthIndex = MONTHS.indexOf(b.month);
  if (monthIndex < 0) return null;
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(b.day).padStart(2, '0');
  return `${b.year}-${mm}-${dd}`;
}

/** Height/weight as entered (display unit) → canonical metric (cm, kg). */
function toMetric(data: OnboardingData): { height_cm: number; weight_kg: number } {
  if (data.unit === 'metric') {
    return { height_cm: round1(data.height), weight_kg: round1(data.weight) };
  }
  return {
    height_cm: round1(data.height * IN_TO_CM),
    weight_kg: round1(data.weight * LBS_TO_KG),
  };
}

/** Map collected onboarding answers to a `profiles` row patch (snake_case, metric). */
export function onboardingToProfile(data: OnboardingData): Partial<ProfileRow> {
  const { height_cm, weight_kg } = toMetric(data);
  const birth_date = birthDateToISO(data.birthDate);
  const goal = data.goal || null;
  const gender = data.gender || null;
  const activity_level = data.activityLevel || null;

  const targets = computeTargets({
    gender,
    weightKg: weight_kg,
    heightCm: height_cm,
    age: ageFromISO(birth_date),
    activityLevel: activity_level,
    goal,
    trainingTypes: data.trainingTypes,
    dietaryStyles: data.dietaryStyles,
  });

  return {
    name: data.name.trim() || null,
    goal,
    dietary_styles: data.dietaryStyles,
    custom_dietary_style: data.customDietaryStyle.trim() || null,
    allergies: data.allergies,
    custom_allergy: data.customAllergy.trim() || null,
    gender,
    birth_date,
    height_cm,
    weight_kg,
    unit: data.unit,
    activity_level,
    training_types: data.trainingTypes,
    custom_training_type: data.customTrainingType.trim() || null,
    calorie_target: targets?.calories ?? null,
    protein_target_g: targets?.protein ?? null,
    carb_target_g: targets?.carbs ?? null,
    fat_target_g: targets?.fat ?? null,
    onboarded: true,
  };
}

/** Targets stored on a profile row, or null if not yet computed. */
export function storedTargets(row: ProfileRow | null): Targets | null {
  if (!row || row.calorie_target == null) return null;
  return {
    calories: row.calorie_target,
    protein: row.protein_target_g ?? 0,
    carbs: row.carb_target_g ?? 0,
    fat: row.fat_target_g ?? 0,
  };
}

/** Targets from a profile row — computed live from the latest data (so plan
 * tweaks apply immediately), falling back to stored values if data is missing. */
export function rowTargets(row: ProfileRow | null): Targets | null {
  if (!row) return null;
  return (
    computeTargets({
      gender: row.gender,
      weightKg: row.weight_kg,
      heightCm: row.height_cm,
      age: ageFromISO(row.birth_date),
      activityLevel: row.activity_level,
      goal: row.goal,
      trainingTypes: row.training_types,
      dietaryStyles: row.dietary_styles,
    }) ?? storedTargets(row)
  );
}

/** Full target breakdown (BMR, maintenance, etc.) from a profile row — for the
 * Daily Targets explainer. */
export function rowBreakdown(row: ProfileRow | null): TargetBreakdown | null {
  if (!row) return null;
  return computeBreakdown({
    gender: row.gender,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    age: ageFromISO(row.birth_date),
    activityLevel: row.activity_level,
    goal: row.goal,
    trainingTypes: row.training_types,
    dietaryStyles: row.dietary_styles,
  });
}

/** Compute targets straight from the locally-cached onboarding answers (offline fallback). */
export function onboardingTargets(data: OnboardingData | null | undefined): Targets | null {
  if (!data || typeof data.height !== 'number' || typeof data.weight !== 'number') return null;
  const { height_cm, weight_kg } = toMetric(data);
  return computeTargets({
    gender: data.gender || null,
    weightKg: weight_kg,
    heightCm: height_cm,
    age: ageFromISO(birthDateToISO(data.birthDate)),
    activityLevel: data.activityLevel || null,
    goal: data.goal || null,
    trainingTypes: data.trainingTypes,
    dietaryStyles: data.dietaryStyles,
  });
}

/** Update profile columns (used by Edit Profile). Upsert so it persists even if
 * the row somehow doesn't exist yet. */
export async function updateProfile(
  userId: string,
  patch: Partial<ProfileRow>
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch }, { onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) return null;
  return (data as ProfileRow | null) ?? null;
}

/** Read the current user's profile row. Returns null if missing or unreachable. */
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return (data as ProfileRow | null) ?? null;
}

/**
 * Like {@link fetchProfile}, but reports whether the query *succeeded*. `ok:false`
 * means the request failed (offline / flaky network); `ok:true, row:null` means
 * it succeeded and the user simply has no profile yet. The launch gate uses this
 * to avoid treating a network blip as "not onboarded" and re-running onboarding.
 */
export async function fetchProfileOutcome(
  userId: string
): Promise<{ row: ProfileRow | null; ok: boolean }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return { row: null, ok: false };
  return { row: (data as ProfileRow | null) ?? null, ok: true };
}

/**
 * Persist onboarding answers into the user's profile (upsert by id, so it works
 * whether or not the signup trigger has seeded the row). Returns the saved row.
 */
export async function saveOnboardingToProfile(
  userId: string,
  data: OnboardingData
): Promise<ProfileRow | null> {
  const patch = onboardingToProfile(data);
  const { data: row, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch }, { onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) return null;
  return (row as ProfileRow | null) ?? null;
}
