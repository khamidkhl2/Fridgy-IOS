/**
 * Best-effort food → emoji mapping by keyword. Used for fridge ingredients and
 * recipe thumbnails so they read at a glance. Falls back to a generic plate.
 */

// Ordered most-specific → least, since we return the first keyword found in the
// name. Keep multi-word/specific keys above their generic parents.
const KEYWORD_EMOJI: [string, string][] = [
  // proteins
  ['salmon', '🐟'], ['tuna', '🐟'], ['fish', '🐟'], ['shrimp', '🦐'], ['prawn', '🦐'],
  ['crab', '🦀'], ['lobster', '🦞'], ['bacon', '🥓'], ['chicken', '🍗'], ['turkey', '🍗'],
  ['steak', '🥩'], ['beef', '🥩'], ['pork', '🥩'], ['lamb', '🥩'], ['meat', '🥩'],
  ['egg', '🥚'], ['tofu', '🧈'], ['bean', '🫘'], ['lentil', '🫘'], ['chickpea', '🫘'],
  // dairy
  ['cheese', '🧀'], ['parmesan', '🧀'], ['yogurt', '🥛'], ['yoghurt', '🥛'], ['milk', '🥛'],
  ['butter', '🧈'], ['cream', '🥛'],
  // veg
  ['spinach', '🥬'], ['lettuce', '🥬'], ['kale', '🥬'], ['cabbage', '🥬'], ['salad', '🥗'],
  ['tomato', '🍅'], ['carrot', '🥕'], ['potato', '🥔'], ['onion', '🧅'], ['garlic', '🧄'],
  ['pepper', '🫑'], ['chili', '🌶️'], ['chilli', '🌶️'], ['cucumber', '🥒'], ['pickle', '🥒'],
  ['broccoli', '🥦'], ['mushroom', '🍄'], ['corn', '🌽'], ['avocado', '🥑'], ['eggplant', '🍆'],
  ['aubergine', '🍆'],
  // fruit
  ['apple', '🍎'], ['banana', '🍌'], ['orange', '🍊'], ['lemon', '🍋'], ['lime', '🍋'],
  ['strawberr', '🍓'], ['berr', '🫐'], ['grape', '🍇'], ['watermelon', '🍉'], ['melon', '🍈'],
  ['peach', '🍑'], ['pear', '🍐'], ['pineapple', '🍍'], ['mango', '🥭'], ['cherry', '🍒'],
  ['coconut', '🥥'],
  // carbs / grains
  ['pasta', '🍝'], ['spaghetti', '🍝'], ['noodle', '🍜'], ['ramen', '🍜'], ['rice', '🍚'],
  ['sushi', '🍣'], ['bread', '🍞'], ['toast', '🍞'], ['bagel', '🥯'], ['croissant', '🥐'],
  ['oat', '🥣'], ['cereal', '🥣'], ['pancake', '🥞'], ['waffle', '🧇'], ['flour', '🌾'],
  ['quinoa', '🌾'], ['wheat', '🌾'],
  // dishes
  ['pizza', '🍕'], ['burger', '🍔'], ['sandwich', '🥪'], ['taco', '🌮'], ['burrito', '🌯'],
  ['wrap', '🌯'], ['soup', '🍲'], ['stew', '🍲'], ['curry', '🍛'], ['fries', '🍟'],
  ['dumpling', '🥟'], ['hot dog', '🌭'], ['hotdog', '🌭'],
  // extras
  ['nut', '🥜'], ['peanut', '🥜'], ['almond', '🥜'], ['honey', '🍯'], ['chocolate', '🍫'],
  ['cake', '🍰'], ['cookie', '🍪'], ['ice cream', '🍨'], ['coffee', '☕'], ['tea', '🍵'],
  ['juice', '🧃'], ['water', '💧'], ['oil', '🫗'], ['salt', '🧂'], ['sugar', '🧁'],
];

/** An emoji for a food/ingredient/recipe name (first keyword match). */
export function foodEmoji(name: string): string {
  const s = (name ?? '').toLowerCase();
  for (const [kw, emoji] of KEYWORD_EMOJI) {
    if (s.includes(kw)) return emoji;
  }
  return '🍽️';
}
