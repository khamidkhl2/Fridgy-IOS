/**
 * generate-recipes — Supabase Edge Function (Deno).
 *
 * Given the ingredients in a user's fridge plus their dietary constraints,
 * returns recipe suggestions as structured JSON. Provider sits behind
 * `generateRecipes()` so OpenAI can be swapped for Anthropic later.
 *
 * Auth: platform verify_jwt (default on) — only signed-in users reach this.
 * Rate limit: per-user daily budget (RECIPE_DAILY_LIMIT, default 30) so a single
 * account can't drain the OpenAI balance in a loop.
 * Secrets: OPENAI_API_KEY (required), VISION_MODEL/TEXT_MODEL (optional).
 */
import { checkRateLimit } from '../_shared/rateLimit.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Ingredient = { name: string; quantity: string; have: boolean };
type Recipe = {
  title: string;
  description: string;
  mealType: string;
  minutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  steps: string[];
  usesCount: number;
};

type RequestBody = {
  ingredients?: string[];
  dietaryStyles?: string[];
  allergies?: string[];
  goal?: string;
  count?: number;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function buildPrompt(body: RequestBody): string {
  const ingredients = (body.ingredients ?? []).filter(Boolean);
  const count = Math.min(Math.max(body.count ?? 4, 1), 6);
  const diet = (body.dietaryStyles ?? []).filter(Boolean);
  const allergies = (body.allergies ?? []).filter(Boolean);

  return [
    `You are a practical home-cooking assistant. Suggest ${count} recipes the user can cook`,
    'mostly from the ingredients currently in their fridge.',
    '',
    `Fridge ingredients: ${ingredients.length ? ingredients.join(', ') : '(none provided)'}.`,
    diet.length ? `Dietary styles to respect: ${diet.join(', ')}.` : '',
    allergies.length
      ? `STRICT allergies — never include these or their derivatives: ${allergies.join(', ')}.`
      : '',
    body.goal ? `The user's goal is: ${body.goal}.` : '',
    '',
    'Prefer recipes that use as many fridge ingredients as possible and need few extra items.',
    'Provide realistic nutrition per serving. Keep steps concise (one sentence each).',
    '',
    'Respond with JSON only in exactly this shape and nothing else:',
    '{"recipes":[{"title":"","description":"","mealType":"Breakfast|Lunch|Dinner|Snack",',
    '"minutes":0,"calories":0,"protein":0,"carbs":0,"fat":0,',
    '"ingredients":[{"name":"","quantity":"","have":true}],"steps":[""],"usesCount":0}]}',
    'Set ingredient "have" to true only if it appears in the fridge ingredients list.',
    'Set "usesCount" to how many fridge ingredients the recipe uses.',
  ]
    .filter(Boolean)
    .join('\n');
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function normalizeRecipes(raw: unknown): Recipe[] {
  const list = (raw as { recipes?: unknown[] })?.recipes ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((r): Recipe => {
      const o = (r ?? {}) as Record<string, unknown>;
      const ingredients = Array.isArray(o.ingredients)
        ? (o.ingredients as Record<string, unknown>[]).map((ing) => ({
            name: typeof ing.name === 'string' ? ing.name : '',
            quantity: typeof ing.quantity === 'string' ? ing.quantity : '',
            have: ing.have === true,
          }))
        : [];
      const steps = Array.isArray(o.steps)
        ? (o.steps as unknown[]).filter((s): s is string => typeof s === 'string')
        : [];
      return {
        title: typeof o.title === 'string' ? o.title : 'Untitled recipe',
        description: typeof o.description === 'string' ? o.description : '',
        mealType: typeof o.mealType === 'string' ? o.mealType : 'Dinner',
        minutes: num(o.minutes),
        calories: num(o.calories),
        protein: num(o.protein),
        carbs: num(o.carbs),
        fat: num(o.fat),
        ingredients: ingredients.filter((i) => i.name.length > 0),
        steps,
        usesCount: num(o.usesCount),
      };
    })
    .filter((r) => r.title.length > 0)
    .slice(0, 6);
}

async function generateWithOpenAI(prompt: string, apiKey: string): Promise<Recipe[]> {
  const model = Deno.env.get('TEXT_MODEL') ?? 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      // Headroom so a full set of recipes (with steps) isn't truncated mid-JSON,
      // which would otherwise fail JSON.parse and surface as an error.
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '{}';
  return normalizeRecipes(JSON.parse(content));
}

async function generateRecipes(body: RequestBody): Promise<Recipe[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) return generateWithOpenAI(buildPrompt(body), openaiKey);
  throw new Error('No recipe provider configured (set OPENAI_API_KEY).');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const limit = await checkRateLimit(req, 'generate-recipes', Number(Deno.env.get('RECIPE_DAILY_LIMIT') ?? 30));
  if (!limit.ok) return json({ error: limit.error }, limit.status);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    const recipes = await generateRecipes(body);
    return json({ recipes });
  } catch (err) {
    // Log the real error (OpenAI status, JSON parse failure, etc.) for
    // diagnosis, but never leak raw provider/parse text to the user.
    console.error('generate-recipes failed:', err);
    return json({ error: "We couldn't generate recipes right now. Please try again." }, 502);
  }
});
