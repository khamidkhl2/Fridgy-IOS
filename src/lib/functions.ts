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
      // Our functions return { error: "<user-facing message>" } — show that.
      if (body && typeof body.error === 'string') return body.error;
      // Platform-level failures (e.g. BOOT_ERROR, gateway timeouts) carry
      // code/message but no `error`. Log the technical detail for diagnosis, but
      // show the caller's clean fallback — never the raw supabase-js "non-2xx"
      // string, which is meaningless to the user.
      if (body && (typeof body.message === 'string' || typeof body.code === 'string')) {
        console.warn(`Edge function ${body.code ?? 'error'}: ${body.message ?? ''}`.trim());
      }
    } catch {
      /* body wasn't JSON */
    }
    return fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
