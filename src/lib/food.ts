/**
 * Food logging data layer: `food_logs` CRUD, a focus-aware day/history hook,
 * and pure aggregation helpers (daily totals, per-meal grouping, streak, week
 * activity) consumed by the dashboard.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useReducer, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from './auth';
import type { Tables } from './database.types';
import { invalidate, qk } from './queryClient';
import { supabase } from './supabase';
import type { Macros } from './usda';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEALS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
];

/**
 * A row of `public.food_logs` (generated). The DB stores `meal_type`/`source`
 * as plain text under check constraints; we refine them to the app's unions.
 * `quantity` is grams; `logged_on` is 'YYYY-MM-DD'.
 */
export type FoodLog = Omit<Tables<'food_logs'>, 'meal_type' | 'source'> & {
  meal_type: MealType;
  source: 'manual' | 'scan' | 'recipe';
};

// ── dates (local calendar day, not UTC) ──────────────────────────────────────

/** Local calendar date as 'YYYY-MM-DD'. */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return localDateISO(d);
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function listLogsSince(userId: string, sinceISO: string): Promise<FoodLog[]> {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_on', sinceISO)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data as FoodLog[]) ?? [];
}

export type NewFoodLog = {
  userId: string;
  loggedOn: string;
  mealType: MealType;
  name: string;
  macros: Macros;
  grams: number;
  source?: FoodLog['source'];
};

export async function addFoodLog(entry: NewFoodLog): Promise<FoodLog | null> {
  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: entry.userId,
      logged_on: entry.loggedOn,
      meal_type: entry.mealType,
      name: entry.name,
      calories: entry.macros.calories,
      protein_g: entry.macros.protein,
      carbs_g: entry.macros.carbs,
      fat_g: entry.macros.fat,
      quantity: entry.grams,
      source: entry.source ?? 'manual',
    })
    .select()
    .maybeSingle();
  if (error) return null;
  invalidate.logs();
  return (data as FoodLog | null) ?? null;
}

export async function deleteFoodLog(id: string): Promise<boolean> {
  const { error } = await supabase.from('food_logs').delete().eq('id', id);
  if (!error) invalidate.logs();
  return !error;
}

/** Re-scale a logged food to a new portion (grams + recomputed macros). */
export async function updateFoodLog(
  id: string,
  patch: { grams: number; macros: Macros }
): Promise<FoodLog | null> {
  const { data, error } = await supabase
    .from('food_logs')
    .update({
      quantity: patch.grams,
      calories: patch.macros.calories,
      protein_g: patch.macros.protein,
      carbs_g: patch.macros.carbs,
      fat_g: patch.macros.fat,
    })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return null;
  invalidate.logs();
  return (data as FoodLog | null) ?? null;
}

// Transient holder so the add-food screen can pick up a tapped log to edit
// without serializing the whole row through navigation params.
let editLog: FoodLog | null = null;
export function setEditLog(log: FoodLog) {
  editLog = log;
}
export function getEditLog(): FoodLog | null {
  return editLog;
}

// ── hooks ────────────────────────────────────────────────────────────────────

/**
 * The current local calendar day ('YYYY-MM-DD'), kept fresh while the app stays
 * open: a timer fires at the next local midnight, and returning to the
 * foreground re-checks (covering a device that slept through the timer). Lets
 * the dashboard roll over to a new day without a restart.
 */
export function useToday(): string {
  const [today, setToday] = useState(localDateISO());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0); // upcoming local midnight
      // +1s so localDateISO() definitely reads the new day when the timer fires
      timer = setTimeout(() => {
        setToday(localDateISO());
        schedule();
      }, nextMidnight.getTime() - now.getTime() + 1000);
    };
    schedule();

    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') setToday(localDateISO());
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}

/**
 * Recent food logs (default 30 days). Backed by the shared query cache, so the
 * dashboard and profile tab share one fetch; mutations invalidate ['logs'] to
 * refresh. `reload` forces a refetch when needed.
 */
export function useRecentLogs(days = 30): { logs: FoodLog[]; loading: boolean; reload: () => void } {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const q = useQuery({
    queryKey: [...qk.logs(userId), days],
    queryFn: () => listLogsSince(userId!, addDays(localDateISO(), -days)),
    enabled: !!userId,
  });

  return { logs: q.data ?? [], loading: q.isLoading, reload: () => void q.refetch() };
}

// ── aggregation (pure) ───────────────────────────────────────────────────────

const ZERO: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function sumMacros(logs: FoodLog[]): Macros {
  return logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.protein_g,
      carbs: acc.carbs + l.carbs_g,
      fat: acc.fat + l.fat_g,
    }),
    ZERO
  );
}

export function logsForDay(logs: FoodLog[], dayISO: string): FoodLog[] {
  return logs.filter((l) => l.logged_on === dayISO);
}

export function groupByMeal(logs: FoodLog[]): Record<MealType, FoodLog[]> {
  const out: Record<MealType, FoodLog[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const l of logs) out[l.meal_type]?.push(l);
  return out;
}

/** Set of distinct days (ISO) that have at least one log. */
export function loggedDays(logs: FoodLog[]): Set<string> {
  return new Set(logs.map((l) => l.logged_on));
}

/**
 * Consecutive-day streak ending today (or yesterday if today isn't logged yet,
 * so the streak doesn't read 0 first thing each morning).
 */
export function currentStreak(days: Set<string>, todayISO: string = localDateISO()): number {
  let cursor = days.has(todayISO) ? todayISO : addDays(todayISO, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export type DayState = { iso: string; weekday: string; dayNum: number; state: 'done' | 'today' | 'future' };

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** The current Mon–Sun week, each day tagged done/today/future for the strip. */
export function weekActivity(days: Set<string>, todayISO: string = localDateISO()): DayState[] {
  const today = new Date(`${todayISO}T00:00:00`);
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const mondayISO = addDays(todayISO, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(mondayISO, i);
    const d = new Date(`${iso}T00:00:00`);
    const state: DayState['state'] =
      iso === todayISO ? 'today' : iso < todayISO ? (days.has(iso) ? 'done' : 'future') : 'future';
    return { iso, weekday: WEEKDAY[d.getDay()], dayNum: d.getDate(), state };
  });
}

// ── portion unit preference (grams / ounces) ─────────────────────────────────
// food_logs.quantity is always stored in grams (canonical); this preference only
// changes how the add-food portion editor displays + steps the amount.

export type FoodUnit = 'g' | 'oz';

/** Grams per avoirdupois ounce (food weight, not the fluid oz used for water). */
export const G_PER_OZ = 28.349523125;

/** grams → display value in the chosen unit (rounded). */
export function gramsToUnit(g: number, unit: FoodUnit): number {
  return unit === 'oz' ? Math.round((g / G_PER_OZ) * 10) / 10 : Math.round(g);
}

/** A value in the chosen unit → grams. */
export function unitToGrams(value: number, unit: FoodUnit): number {
  return unit === 'oz' ? value * G_PER_OZ : value;
}

/** Step size (grams) for one nudge of the portion stepper in the given unit. */
export function stepGrams(unit: FoodUnit): number {
  return unit === 'oz' ? G_PER_OZ : 10; // 1 oz or 10 g
}

const KEY_FOOD_UNIT = 'fridgy_food_unit';
let foodUnitValue: FoodUnit = 'g';
let foodUnitLoaded = false;
let foodUnitDirty = false; // a user change happened — don't let a late load clobber it
const foodUnitListeners = new Set<() => void>();

/** Tiny global store so Units + add-food stay in sync (AsyncStorage-backed). */
export function useFoodUnit(): [FoodUnit, (u: FoodUnit) => void] {
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    foodUnitListeners.add(force);
    if (!foodUnitLoaded) {
      foodUnitLoaded = true;
      AsyncStorage.getItem(KEY_FOOD_UNIT).then((v) => {
        if (!foodUnitDirty && (v === 'g' || v === 'oz')) {
          foodUnitValue = v;
          foodUnitListeners.forEach((l) => l());
        }
      });
    }
    return () => {
      foodUnitListeners.delete(force);
    };
  }, []);

  const setUnit = (u: FoodUnit) => {
    foodUnitDirty = true;
    foodUnitValue = u;
    AsyncStorage.setItem(KEY_FOOD_UNIT, u).catch(() => {});
    foodUnitListeners.forEach((l) => l());
  };

  return [foodUnitValue, setUnit];
}
