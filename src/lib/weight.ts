/**
 * Body-weight tracking: `weight_logs` CRUD + a focus-aware history hook.
 *
 * A check-in is one row per day (upsert by user+day). The latest is treated as
 * the current weight, so logging also syncs `profiles.weight_kg` + recomputes
 * targets. All reads swallow errors (degrade to [] before the migration ships).
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth';
import type { Tables } from './database.types';
import { updateProfile, type ProfileRow } from './db';
import { localDateISO } from './food';
import { invalidate, qk } from './queryClient';
import { supabase } from './supabase';
import { ageFromISO, computeTargets } from './targets';

export type WeightLog = Tables<'weight_logs'>;

const round1 = (n: number) => Math.round(n * 10) / 10;
export const KG_PER_LB = 0.453592;

/** kg → display unit. */
export function kgToUnit(kg: number, metric: boolean): number {
  return metric ? Math.round(kg * 10) / 10 : Math.round(kg / KG_PER_LB);
}
/** display unit → kg. */
export function unitToKg(value: number, metric: boolean): number {
  return metric ? value : value * KG_PER_LB;
}

export async function listWeights(userId: string): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_on', { ascending: true });
  if (error) return [];
  return (data as WeightLog[]) ?? [];
}

/**
 * Record a weight check-in for a day (upsert), and keep the profile's current
 * weight + targets in sync. Returns false if the write failed (e.g. offline, or
 * the weight_logs table isn't deployed yet).
 */
export async function logWeight(opts: {
  userId: string;
  weightKg: number;
  dayISO?: string;
  row?: ProfileRow | null;
}): Promise<boolean> {
  const dayISO = opts.dayISO ?? localDateISO();
  const weight_kg = round1(opts.weightKg);

  const { error } = await supabase
    .from('weight_logs')
    .upsert({ user_id: opts.userId, logged_on: dayISO, weight_kg }, { onConflict: 'user_id,logged_on' });
  if (error) return false;

  const r = opts.row;
  const patch: Partial<ProfileRow> = { weight_kg };
  if (r) {
    const t = computeTargets({
      gender: r.gender,
      weightKg: weight_kg,
      heightCm: r.height_cm,
      age: ageFromISO(r.birth_date),
      activityLevel: r.activity_level,
      goal: r.goal,
      trainingTypes: r.training_types,
      dietaryStyles: r.dietary_styles,
    });
    if (t) {
      patch.calorie_target = t.calories;
      patch.protein_target_g = t.protein;
      patch.carb_target_g = t.carbs;
      patch.fat_target_g = t.fat;
    }
  }
  await updateProfile(opts.userId, patch);
  invalidate.weights();
  return true;
}

/** Weight history (oldest → newest). Backed by the shared query cache. */
export function useWeights(): { logs: WeightLog[]; loading: boolean; reload: () => void } {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const q = useQuery({
    queryKey: qk.weights(userId),
    queryFn: () => listWeights(userId!),
    enabled: !!userId,
  });
  return { logs: q.data ?? [], loading: q.isLoading, reload: () => void q.refetch() };
}
