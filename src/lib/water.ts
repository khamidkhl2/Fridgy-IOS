/**
 * Water tracking: a unit preference (glasses / ml / oz) and `water_logs` CRUD.
 * Stored canonically in millilitres; the unit only affects display + step size.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useReducer } from 'react';
import { useAuth } from './auth';
import { useToday } from './food';
import { qk, queryClient } from './queryClient';
import { supabase } from './supabase';
import { trainingProfile } from './targets';

export type WaterUnit = 'glasses' | 'ml' | 'oz';

const ML_PER_GLASS = 250;
const ML_PER_OZ = 29.5735;

/** A sensible "one serving" add amount (ml) for each unit. */
export function servingMl(unit: WaterUnit): number {
  if (unit === 'oz') return Math.round(8 * ML_PER_OZ); // 8 oz
  return ML_PER_GLASS; // glasses + ml both add a 250 ml cup
}

/** Convert ml → the chosen unit's display value (rounded). */
export function toUnit(ml: number, unit: WaterUnit): number {
  if (unit === 'glasses') return Math.round((ml / ML_PER_GLASS) * 10) / 10;
  if (unit === 'oz') return Math.round(ml / ML_PER_OZ);
  return Math.round(ml);
}

/** Convert a value in the chosen unit back to ml (inverse of toUnit). */
export function fromUnit(value: number, unit: WaterUnit): number {
  if (unit === 'glasses') return Math.round(value * ML_PER_GLASS);
  if (unit === 'oz') return Math.round(value * ML_PER_OZ);
  return Math.round(value); // ml
}

export function unitLabel(unit: WaterUnit, plural = true): string {
  if (unit === 'glasses') return plural ? 'glasses' : 'glass';
  return unit; // 'ml' | 'oz'
}

/** Format a ml amount for display, e.g. "5 glasses" / "1,250 ml" / "42 oz". */
export function formatWater(ml: number, unit: WaterUnit): string {
  const v = toUnit(ml, unit);
  const label = unit === 'glasses' ? unitLabel(unit, v !== 1) : unit;
  return `${v.toLocaleString()} ${label}`;
}

/**
 * Daily water goal (ml): ~35 ml/kg baseline, plus extra for training load
 * (more sweat loss) and goal (weight loss → satiety/metabolism, muscle gain →
 * protein metabolism). Rounded to 50 ml, clamped 1500–5000.
 */
export function waterGoalMl(opts: {
  weightKg?: number | null;
  goal?: string | null;
  trainingTypes?: string[] | null;
}): number {
  const base = opts.weightKg ? opts.weightKg * 35 : 2500;
  const tp = trainingProfile(opts.trainingTypes ?? []);
  const trainingBonus = tp.strength || tp.endurance ? 600 : tp.light ? 250 : 0;
  const g = (opts.goal ?? '').toLowerCase();
  const goalBonus = g.includes('lose') ? 350 : g.includes('build') || g.includes('muscle') ? 300 : 0;
  return Math.min(5000, Math.max(1500, Math.round((base + trainingBonus + goalBonus) / 50) * 50));
}

// ── unit preference (tiny global store so settings + home stay in sync) ───────
const KEY_UNIT = 'fridgy_water_unit';
let unitValue: WaterUnit = 'glasses';
let unitLoaded = false;
let unitDirty = false; // a user change happened — don't let a late load clobber it
const unitListeners = new Set<() => void>();

export function useWaterUnit(): [WaterUnit, (u: WaterUnit) => void] {
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    unitListeners.add(force);
    if (!unitLoaded) {
      unitLoaded = true;
      AsyncStorage.getItem(KEY_UNIT).then((v) => {
        if (!unitDirty && (v === 'glasses' || v === 'ml' || v === 'oz')) {
          unitValue = v;
          unitListeners.forEach((l) => l());
        }
      });
    }
    return () => {
      unitListeners.delete(force);
    };
  }, []);

  const setUnit = (u: WaterUnit) => {
    unitDirty = true;
    unitValue = u;
    AsyncStorage.setItem(KEY_UNIT, u).catch(() => {});
    unitListeners.forEach((l) => l());
  };

  return [unitValue, setUnit];
}

// ── logs ─────────────────────────────────────────────────────────────────────
async function sumWater(userId: string, dayISO: string): Promise<number> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', userId)
    .eq('logged_on', dayISO);
  if (error || !data) return 0;
  return data.reduce((sum, r) => sum + (r.amount_ml ?? 0), 0);
}

/** Today's water total (ml) with optimistic add / undo helpers. Backed by the
 *  shared query cache (key per user+day). */
export function useWaterToday(): {
  totalMl: number;
  add: (ml: number) => Promise<void>;
  undo: () => Promise<void>;
  reload: () => void;
} {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const today = useToday(); // live: rolls over at midnight without a restart

  const q = useQuery({
    queryKey: qk.water(userId, today),
    queryFn: () => sumWater(userId!, today),
    enabled: !!userId,
  });

  const add = useCallback(
    async (ml: number) => {
      if (!userId) return;
      const key = qk.water(userId, today);
      queryClient.setQueryData<number>(key, (t) => (t ?? 0) + ml); // optimistic
      const { error } = await supabase
        .from('water_logs')
        .insert({ user_id: userId, logged_on: today, amount_ml: ml });
      if (error) {
        queryClient.invalidateQueries({ queryKey: key }); // roll back to server truth
        throw error; // let the caller surface it (the optimistic bump just vanished)
      }
    },
    [userId, today]
  );

  const undo = useCallback(async () => {
    if (!userId) return;
    const key = qk.water(userId, today);
    const { data } = await supabase
      .from('water_logs')
      .select('id, amount_ml')
      .eq('user_id', userId)
      .eq('logged_on', today)
      .order('created_at', { ascending: false })
      .limit(1);
    const last = data?.[0];
    if (!last) return;
    queryClient.setQueryData<number>(key, (t) => Math.max(0, (t ?? 0) - (last.amount_ml ?? 0))); // optimistic
    const { error } = await supabase.from('water_logs').delete().eq('id', last.id);
    queryClient.invalidateQueries({ queryKey: key });
    if (error) throw error;
  }, [userId, today]);

  return { totalMl: q.data ?? 0, add, undo, reload: () => void q.refetch() };
}
