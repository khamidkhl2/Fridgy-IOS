/**
 * Helpers for calling Edge Functions.
 *
 * `supabase.functions.invoke` reports a non-2xx response as a FunctionsHttpError
 * whose `message` is a generic "non-2xx status code" — the useful detail (e.g.
 * our 429 "Daily limit reached" text) lives in the response body. This unwraps
 * that body so the UI can show the real message.
 */
import { FunctionsHttpError } from '@supabase/supabase-js';

export async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body && typeof body.error === 'string') return body.error;
    } catch {
      /* body wasn't JSON — fall through to the generic message */
    }
  }
  return error instanceof Error ? error.message : fallback;
}
