/**
 * scan-fridge — Supabase Edge Function (Deno).
 *
 * Receives a base64 fridge photo from a signed-in client and returns the food
 * ingredients detected in it. The provider lives behind `detectIngredients()`
 * so swapping OpenAI for Anthropic later is a one-function change.
 *
 * Auth: the platform verifies the caller's Supabase JWT (verify_jwt, default on),
 * so only authenticated users reach this code.
 * Rate limit: per-user daily budget (SCAN_DAILY_LIMIT, default 30) so a single
 * account can't drain the OpenAI balance in a loop.
 *
 * Secrets (set with `supabase secrets set ...`):
 *   OPENAI_API_KEY   — required
 *   VISION_MODEL     — optional, defaults to gpt-4o-mini
 */
import { checkRateLimit } from '../_shared/rateLimit.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type DetectedItem = { name: string; category: string | null };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

const PROMPT =
  'You are a food recognition assistant. Look at this photo of the inside of a ' +
  "fridge and list the distinct, identifiable food ingredients you can see. Use " +
  'short, generic names (e.g. "Eggs", "Spinach", "Cheddar cheese"), singular or ' +
  'as commonly written. Ignore non-food items, containers, and anything you are ' +
  'not reasonably confident about. Group each into a simple category from: ' +
  'Produce, Dairy, Meat, Pantry, Condiments, Drinks, Other. ' +
  'Respond with JSON only in the form ' +
  '{"items":[{"name":"...","category":"..."}]} and nothing else.';

/** OpenAI vision provider. Returns detected ingredients (possibly empty). */
async function detectWithOpenAI(dataUrl: string, apiKey: string): Promise<DetectedItem[]> {
  const model = Deno.env.get('VISION_MODEL') ?? 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as { items?: { name?: unknown; category?: unknown }[] };

  return (parsed.items ?? [])
    .map((it) => ({
      name: typeof it.name === 'string' ? it.name.trim() : '',
      category: typeof it.category === 'string' ? it.category.trim() : null,
    }))
    .filter((it) => it.name.length > 0)
    .slice(0, 30);
}

async function detectIngredients(dataUrl: string): Promise<DetectedItem[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) return detectWithOpenAI(dataUrl, openaiKey);
  throw new Error('No vision provider configured (set OPENAI_API_KEY).');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const limit = await checkRateLimit(req, 'scan-fridge', Number(Deno.env.get('SCAN_DAILY_LIMIT') ?? 30));
  if (!limit.ok) return json({ error: limit.error }, limit.status);

  let body: { image?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const image = body.image?.trim();
  if (!image) return json({ error: 'Missing image (base64)' }, 400);

  const mimeType = body.mimeType ?? 'image/jpeg';
  const dataUrl = image.startsWith('data:') ? image : `data:${mimeType};base64,${image}`;

  try {
    const items = await detectIngredients(dataUrl);
    return json({ items });
  } catch (err) {
    console.error('scan-fridge failed:', err);
    const message = err instanceof Error ? err.message : 'Detection failed';
    return json({ error: message }, 502);
  }
});
