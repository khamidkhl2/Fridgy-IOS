/**
 * delete-account — Supabase Edge Function (Deno).
 *
 * Permanently deletes the calling user's account. Required by App Store Review
 * Guideline 5.1.1(v) (in-app account deletion). Deleting the auth user cascades
 * to all of their rows (profiles, fridge_items, food_logs, recipes,
 * saved_recipes) via the ON DELETE CASCADE foreign keys.
 *
 * Uses the service-role key (auto-injected by Supabase) to perform the admin
 * deletion, but only ever deletes the user identified by the caller's own JWT.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);
  const jwt = authHeader.replace('Bearer ', '').trim();

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) return json({ error: 'Server not configured' }, 500);

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  // Resolve the caller from their own token — never trust a user id from the body.
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ error: 'Invalid session' }, 401);

  const { error: delErr } = await admin.auth.admin.deleteUser(userData.user.id);
  if (delErr) {
    console.error('delete-account failed:', delErr);
    return json({ error: 'Could not delete account' }, 500);
  }

  return json({ ok: true });
});
