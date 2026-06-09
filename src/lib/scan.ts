/**
 * Client bridge to the `scan-fridge` Edge Function. `functions.invoke`
 * automatically attaches the signed-in user's access token.
 */
import type { DetectedItem } from './fridge';
import { functionErrorMessage } from './functions';
import { supabase } from './supabase';

export async function scanFridge(base64: string): Promise<DetectedItem[]> {
  const { data, error } = await supabase.functions.invoke('scan-fridge', {
    body: { image: base64, mimeType: 'image/jpeg' },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'Could not scan your fridge.'));
  if (data?.error) throw new Error(data.error);
  return (data?.items ?? []) as DetectedItem[];
}
