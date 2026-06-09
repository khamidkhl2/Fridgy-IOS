/**
 * Recipes data layer: AI generation via the `generate-recipes` Edge Function,
 * plus persisting favourites. A saved recipe is simply a `recipes` row owned by
 * the user — saving inserts one, un-saving deletes it (which cascades the
 * `saved_recipes` join, reserved for a future shared library).
 */
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from './auth';
import { functionErrorMessage } from './functions';
import { invalidate, qk } from './queryClient';
import { supabase } from './supabase';

export type RecipeIngredient = { name: string; quantity: string; have: boolean };

/** Shape returned by the generate-recipes function. */
export type GeneratedRecipe = {
  title: string;
  description: string;
  mealType: string;
  minutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  usesCount: number;
};

/** A persisted `recipes` row. */
export type RecipeRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  meal_type: string | null;
  minutes: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  uses_count: number;
  created_at: string;
};

/** Normalized recipe shape the shared card renders (from generated or saved). */
export type RecipeView = {
  key: string;
  title: string;
  description: string;
  mealType: string;
  minutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  usesCount: number;
  ingredients: RecipeIngredient[];
  steps: string[];
};

export function viewFromGenerated(r: GeneratedRecipe): RecipeView {
  return {
    key: r.title,
    title: r.title,
    description: r.description,
    mealType: r.mealType,
    minutes: r.minutes,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    usesCount: r.usesCount,
    ingredients: r.ingredients,
    steps: r.steps,
  };
}

// Transient holder so the recipe detail screen can read the tapped recipe
// without serializing it through navigation params.
let activeRecipe: RecipeView | null = null;
export function setActiveRecipe(r: RecipeView) {
  activeRecipe = r;
}
export function getActiveRecipe(): RecipeView | null {
  return activeRecipe;
}

export function viewFromRow(r: RecipeRow): RecipeView {
  return {
    key: r.id,
    title: r.title,
    description: r.description ?? '',
    mealType: r.meal_type ?? 'Dinner',
    minutes: r.minutes ?? 0,
    calories: r.calories ?? 0,
    protein: r.protein_g ?? 0,
    carbs: r.carbs_g ?? 0,
    fat: r.fat_g ?? 0,
    usesCount: r.uses_count,
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    steps: Array.isArray(r.steps) ? r.steps : [],
  };
}

export type GenerateInput = {
  ingredients: string[];
  dietaryStyles?: string[];
  allergies?: string[];
  goal?: string;
  count?: number;
};

export async function generateRecipes(input: GenerateInput): Promise<GeneratedRecipe[]> {
  const { data, error } = await supabase.functions.invoke('generate-recipes', { body: input });
  if (error) throw new Error(await functionErrorMessage(error, 'Could not generate recipes.'));
  if (data?.error) throw new Error(data.error);
  return (data?.recipes ?? []) as GeneratedRecipe[];
}

export async function listSavedRecipes(userId: string): Promise<RecipeRow[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data as RecipeRow[]) ?? [];
}

export async function saveRecipe(userId: string, r: GeneratedRecipe): Promise<RecipeRow | null> {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      title: r.title,
      description: r.description || null,
      meal_type: r.mealType || null,
      minutes: r.minutes || null,
      calories: r.calories || null,
      protein_g: r.protein || null,
      carbs_g: r.carbs || null,
      fat_g: r.fat || null,
      ingredients: r.ingredients,
      steps: r.steps,
      uses_count: r.usesCount,
    })
    .select()
    .maybeSingle();
  if (error || !data) return null;
  invalidate.savedRecipes();
  return data as RecipeRow;
}

/** Removes a saved recipe; the saved_recipes row cascades on delete. */
export async function deleteSavedRecipe(userId: string, recipeId: string): Promise<boolean> {
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId).eq('user_id', userId);
  if (!error) invalidate.savedRecipes();
  return !error;
}

/**
 * Saved recipes for the current user from the shared query cache, with toggle
 * helpers keyed by title (generated recipes have no id until persisted).
 * save/remove invalidate ['savedRecipes'] so the list refreshes.
 */
export function useSavedRecipes() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const q = useQuery({
    queryKey: qk.savedRecipes(userId),
    queryFn: () => listSavedRecipes(userId!),
    enabled: !!userId,
  });
  const recipes = useMemo(() => q.data ?? [], [q.data]);

  // title → recipe id, so the screen can toggle generated recipes by title
  const idByTitle = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of recipes) m.set(r.title, r.id);
    return m;
  }, [recipes]);

  const isSaved = useCallback((title: string) => idByTitle.has(title), [idByTitle]);

  const save = useCallback(
    async (r: GeneratedRecipe) => {
      if (!userId || idByTitle.has(r.title)) return;
      await saveRecipe(userId, r); // invalidates ['savedRecipes']
    },
    [userId, idByTitle]
  );

  const remove = useCallback(
    async (title: string) => {
      const id = idByTitle.get(title);
      if (!userId || !id) return;
      await deleteSavedRecipe(userId, id); // invalidates ['savedRecipes']
    },
    [userId, idByTitle]
  );

  return {
    recipes,
    loading: q.isLoading,
    count: recipes.length,
    isSaved,
    save,
    remove,
    reload: () => void q.refetch(),
  };
}
