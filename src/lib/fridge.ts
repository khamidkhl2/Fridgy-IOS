/**
 * Fridge inventory data layer: `fridge_items` CRUD + a focus-aware hook.
 * Items arrive either from a scan (AI vision) or manual entry.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth';
import type { Tables } from './database.types';
import { invalidate, qk } from './queryClient';
import { estimateExpiry } from './shelfLife';
import { supabase } from './supabase';

/** A row of `public.fridge_items` (generated); `source` refined to its two
 *  app values (DB stores plain text under a check constraint). */
export type FridgeItem = Omit<Tables<'fridge_items'>, 'source'> & {
  source: 'manual' | 'scan';
};

/** A detected/entered ingredient before it's persisted. */
export type DetectedItem = { name: string; category?: string | null };

export async function listFridgeItems(userId: string): Promise<FridgeItem[]> {
  const { data, error } = await supabase
    .from('fridge_items')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });
  if (error) return [];
  return (data as FridgeItem[]) ?? [];
}

/** Bulk-insert detected ingredients. Returns the inserted rows. */
export async function addFridgeItems(
  userId: string,
  items: DetectedItem[],
  source: FridgeItem['source'] = 'scan'
): Promise<FridgeItem[]> {
  const clean = items
    .map((it) => ({ name: it.name.trim(), category: it.category?.trim() || null }))
    .filter((it) => it.name.length > 0);
  if (clean.length === 0) return [];

  const { data, error } = await supabase
    .from('fridge_items')
    .insert(
      clean.map((it) => ({
        user_id: userId,
        name: it.name,
        category: it.category,
        source,
        expires_at: estimateExpiry(it.category),
      }))
    )
    .select();
  if (error) return [];
  invalidate.fridge();
  return (data as FridgeItem[]) ?? [];
}

export async function addFridgeItem(userId: string, name: string): Promise<FridgeItem | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('fridge_items')
    .insert({ user_id: userId, name: trimmed, source: 'manual', expires_at: estimateExpiry(null) })
    .select()
    .maybeSingle();
  if (error) return null;
  invalidate.fridge();
  return (data as FridgeItem | null) ?? null;
}

/** Delete every fridge item for a user — used when a scan replaces the fridge. */
export async function clearFridge(userId: string): Promise<boolean> {
  const { error } = await supabase.from('fridge_items').delete().eq('user_id', userId);
  if (!error) invalidate.fridge();
  return !error;
}

/** Update an item's expiry date (ISO timestamp). Drives the expiry reminders. */
export async function updateFridgeItemExpiry(id: string, expiresAt: string): Promise<boolean> {
  const { error } = await supabase.from('fridge_items').update({ expires_at: expiresAt }).eq('id', id);
  if (!error) invalidate.fridge();
  return !error;
}

export async function deleteFridgeItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('fridge_items').delete().eq('id', id);
  if (!error) invalidate.fridge();
  return !error;
}

/** Current fridge contents from the shared query cache. */
export function useFridgeItems(): {
  items: FridgeItem[];
  loading: boolean;
  reload: () => void;
} {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const q = useQuery({
    queryKey: qk.fridge(userId),
    queryFn: () => listFridgeItems(userId!),
    enabled: !!userId,
  });

  return { items: q.data ?? [], loading: q.isLoading, reload: () => void q.refetch() };
}
