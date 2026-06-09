/**
 * usda-search — Supabase Edge Function (Deno).
 *
 * Proxies food searches to USDA FoodData Central so the data.gov API key stays
 * server-side instead of being bundled into the client. Returns normalized hits
 * with macros per 100 g (the unit `foodNutrients` reports); the client scales
 * them by the chosen gram amount.
 *
 * Auth: platform verify_jwt (default on) — only signed-in users reach this.
 * Secret: USDA_API_KEY (required) — set with `supabase secrets set USDA_API_KEY=...`.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BASE = 'https://api.nal.usda.gov/fdc/v1';

type Macros = { calories: number; protein: number; carbs: number; fat: number };
type FoodHit = {
  fdcId: number;
  name: string;
  brand?: string;
  per100g: Macros;
  servingGrams?: number;
};

// USDA nutrientNumber → our macro field.
const NUTRIENT = { calories: '208', protein: '203', carbs: '205', fat: '204' } as const;

type RawNutrient = { nutrientNumber?: string; value?: number };
type RawFood = {
  fdcId: number;
  description?: string;
  dataType?: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: RawNutrient[];
};

const TYPE_RANK: Record<string, number> = { Foundation: 0, 'SR Legacy': 1, Survey: 2, Branded: 3 };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function macrosOf(food: RawFood): Macros {
  const by: Record<string, number> = {};
  for (const n of food.foodNutrients ?? []) {
    if (n.nutrientNumber && typeof n.value === 'number') by[n.nutrientNumber] = n.value;
  }
  return {
    calories: Math.round(by[NUTRIENT.calories] ?? 0),
    protein: by[NUTRIENT.protein] ?? 0,
    carbs: by[NUTRIENT.carbs] ?? 0,
    fat: by[NUTRIENT.fat] ?? 0,
  };
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function rankOf(foods: RawFood[], hit: FoodHit): number {
  const dt = foods.find((f) => f.fdcId === hit.fdcId)?.dataType ?? 'Branded';
  return TYPE_RANK[dt] ?? 9;
}

function normalize(foods: RawFood[]): FoodHit[] {
  return foods
    .map((food): FoodHit => {
      const grams = food.servingSizeUnit?.toLowerCase() === 'g' ? food.servingSize : undefined;
      return {
        fdcId: food.fdcId,
        name: toTitleCase(food.description ?? 'Unknown food'),
        brand: food.brandName || food.brandOwner || undefined,
        per100g: macrosOf(food),
        servingGrams: grams && grams > 0 ? grams : undefined,
      };
    })
    .filter((h) => h.per100g.calories > 0)
    .sort((a, b) => rankOf(foods, a) - rankOf(foods, b));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { query?: string; pageSize?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const q = (body.query ?? '').trim();
  if (!q) return json({ foods: [] });
  const pageSize = Math.min(Math.max(body.pageSize ?? 25, 1), 50);

  const apiKey = Deno.env.get('USDA_API_KEY');
  if (!apiKey) return json({ error: 'Food search is not configured (missing USDA_API_KEY).' }, 500);

  const url =
    `${BASE}/foods/search?api_key=${apiKey}` +
    `&query=${encodeURIComponent(q)}` +
    `&pageSize=${pageSize}` +
    `&dataType=${encodeURIComponent('Foundation,SR Legacy,Branded')}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('usda-search upstream error:', res.status);
      return json({ error: `USDA search failed (${res.status})` }, 502);
    }
    const data = (await res.json()) as { foods?: RawFood[] };
    return json({ foods: normalize(data.foods ?? []) });
  } catch (err) {
    console.error('usda-search failed:', err);
    return json({ error: 'USDA search failed' }, 502);
  }
});
