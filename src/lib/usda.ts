/**
 * USDA FoodData Central — food search.
 *
 * The actual search + nutrient parsing happens in the `usda-search` Edge
 * Function so the data.gov API key stays server-side (it used to be bundled into
 * the client via EXPO_PUBLIC_). This module is now a thin client: it invokes the
 * function and keeps the pure macro-scaling helper used by the logging UI.
 *
 * Hits carry macros per 100 g (the unit USDA reports); `scaleMacros` converts
 * them to the chosen gram amount.
 */
import { functionErrorMessage } from './functions';
import { supabase } from './supabase';

export type Macros = { calories: number; protein: number; carbs: number; fat: number };

export type FoodHit = {
  fdcId: number;
  name: string;
  brand?: string;
  /** Per-100g macros. */
  per100g: Macros;
  /** Manufacturer serving size in grams, when known (Branded foods). */
  servingGrams?: number;
};

/**
 * Search foods by name via the `usda-search` Edge Function. Returns up to
 * `pageSize` normalized hits, cleanest data types first. Throws on
 * network/HTTP/config errors so the caller can surface them.
 */
export async function searchFoods(query: string, pageSize = 25): Promise<FoodHit[]> {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase.functions.invoke('usda-search', {
    body: { query: q, pageSize },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'Food search failed.'));
  if (data?.error) throw new Error(data.error);
  return (data?.foods ?? []) as FoodHit[];
}

/** Scale per-100g macros to an absolute gram amount, rounded for storage. */
export function scaleMacros(per100g: Macros, grams: number): Macros {
  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    protein: Math.round(per100g.protein * factor * 10) / 10,
    carbs: Math.round(per100g.carbs * factor * 10) / 10,
    fat: Math.round(per100g.fat * factor * 10) / 10,
  };
}
