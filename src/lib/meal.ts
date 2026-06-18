/**
 * Client bridge to the `scan-meal` Edge Function. `functions.invoke`
 * automatically attaches the signed-in user's access token. Returns the foods
 * detected in a meal photo with estimated per-portion nutrition, which the
 * review screen lets the user confirm and log toward the day.
 */
import { functionErrorMessage } from './functions';
import type { MicroMap } from './micros';
import { supabase } from './supabase';

export type MealItem = {
  name: string;
  /** Estimated weight of the visible portion, grams. */
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** AI-estimated micros for the visible portion (sparse). */
  micros?: MicroMap;
};

export async function scanMeal(base64: string, note?: string): Promise<MealItem[]> {
  const { data, error } = await supabase.functions.invoke('scan-meal', {
    body: { image: base64, mimeType: 'image/jpeg', note: note?.trim() || undefined },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'Could not analyze your meal.'));
  if (data?.error) throw new Error(data.error);
  return (data?.items ?? []) as MealItem[];
}
