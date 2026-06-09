/**
 * Per-user daily rate limiting for the OpenAI-backed Edge Functions.
 *
 * Resolves the caller from their Supabase JWT (same trust model as
 * delete-account — never trust a user id from the request body) and meters one
 * call of `fn` against a per-user/day budget via the increment_ai_usage RPC.
 *
 * Returns a decision the caller turns into a response: 401 if the token is
 * missing/invalid, 429 if the user is over budget, otherwise ok.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

export type RateLimitDecision =
  | { ok: true; used: number; limit: number }
  | { ok: false; status: number; error: string };

export async function checkRateLimit(
  req: Request,
  fn: string,
  dailyLimit: number,
): Promise<RateLimitDecision> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { ok: false, status: 401, error: 'Unauthorized' };

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) return { ok: false, status: 500, error: 'Server not configured' };

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  // Resolve the caller from their own token — the platform already verified the
  // JWT (verify_jwt), this just gives us the user id to key usage on.
  const jwt = authHeader.replace('Bearer ', '').trim();
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return { ok: false, status: 401, error: 'Invalid session' };

  const { data, error } = await admin.rpc('increment_ai_usage', {
    p_user: userData.user.id,
    p_fn: fn,
    p_limit: dailyLimit,
  });

  // Fail open on a metering error: a transient DB blip shouldn't take the whole
  // feature down for paying users. The platform JWT check still gates access,
  // and these errors are logged for follow-up.
  if (error) {
    console.error(`rate-limit check failed for ${fn}:`, error);
    return { ok: true, used: 0, limit: dailyLimit };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { allowed?: boolean; used?: number; lim?: number }
    | null;
  const limit = row?.lim ?? dailyLimit;
  if (row && row.allowed === false) {
    return {
      ok: false,
      status: 429,
      error: `Daily limit reached (${limit} per day). Please try again tomorrow.`,
    };
  }
  return { ok: true, used: row?.used ?? 0, limit };
}
