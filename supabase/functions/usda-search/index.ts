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
// Sparse per-100g micro map; keys match the app's MicroKey (src/lib/micros.ts).
type Micros = Record<string, number>;
type FoodHit = {
  fdcId: number;
  name: string;
  brand?: string;
  per100g: Macros;
  /** Per-100g micronutrients (sparse), keyed by the app's MicroKey. */
  micros100g?: Micros;
  servingGrams?: number;
};

// USDA nutrientNumber → our macro field.
const NUTRIENT = { calories: '208', protein: '203', carbs: '205', fat: '204' } as const;
// USDA nutrientNumber → our MicroKey. Units: fiber g; sodium/potassium/calcium/
// magnesium/iron/zinc/vitaminC mg; vitaminD/vitaminB12 mcg. (Mirror of
// src/lib/micros.ts — Deno functions can't import from the app.)
const MICRO: Record<string, string> = {
  fiber: '291',
  sodium: '307',
  potassium: '306',
  calcium: '301',
  iron: '303',
  magnesium: '304',
  zinc: '309',
  vitaminC: '401',
  vitaminD: '328', // Vitamin D (D2+D3), µg
  vitaminB12: '418', // µg
};
const VITD_IU = '324'; // fallback: Vitamin D in IU (÷40 → µg)

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

function nutrientMap(food: RawFood): Record<string, number> {
  const by: Record<string, number> = {};
  for (const n of food.foodNutrients ?? []) {
    if (n.nutrientNumber && typeof n.value === 'number') by[n.nutrientNumber] = n.value;
  }
  return by;
}

function macrosOf(by: Record<string, number>): Macros {
  return {
    calories: Math.round(by[NUTRIENT.calories] ?? 0),
    protein: by[NUTRIENT.protein] ?? 0,
    carbs: by[NUTRIENT.carbs] ?? 0,
    fat: by[NUTRIENT.fat] ?? 0,
  };
}

function microsOf(by: Record<string, number>): Micros {
  const out: Micros = {};
  for (const [key, num] of Object.entries(MICRO)) {
    const v = by[num];
    if (typeof v === 'number' && v > 0) out[key] = v;
  }
  // Vitamin D is sometimes only reported in IU — convert to µg if µg is absent.
  if (out.vitaminD === undefined && typeof by[VITD_IU] === 'number' && by[VITD_IU] > 0) {
    out.vitaminD = Math.round((by[VITD_IU] / 40) * 100) / 100;
  }
  return out;
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
      const by = nutrientMap(food);
      return {
        fdcId: food.fdcId,
        name: toTitleCase(food.description ?? 'Unknown food'),
        brand: food.brandName || food.brandOwner || undefined,
        per100g: macrosOf(by),
        micros100g: microsOf(by),
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
  if (!apiKey) {
    console.error('usda-search misconfigured: USDA_API_KEY is not set');
    return json({ error: 'Food search is temporarily unavailable. Please try again later.' }, 500);
  }

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
