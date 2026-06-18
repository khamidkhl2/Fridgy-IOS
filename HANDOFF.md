# Fridgy — What we did

_Branch `ui-polish` · last updated 2026-06-16_

## Features
- **Local notifications** — expiry, meal, and lifecycle (win-back + empty-fridge) reminders, with
  per-category opt-in toggles in Profile → Notifications. Scheduled on-device, gated on a signed-in
  user. `src/lib/notifications.ts`, `src/lib/NotificationSync.tsx`.
- **Personalized micronutrients** — a 10-micro set (iron, magnesium, zinc, calcium, potassium,
  sodium, vitamin C, vitamin D, B12, fiber) with sex-aware RDAs and a training+diet-personalized
  top-3 shown on the dashboard. Real data from USDA and AI meal-scan; stored in `food_logs.micros`
  (jsonb). Tap a micro for a detail card. `src/lib/micros.ts`.
- **Scanner overhaul** — meal & fridge scanners unified; gallery picker (`expo-image-picker`); an
  "add a description?" step before analyzing; drag-to-peek result sheet; outer-L corner brackets;
  theme-tinted accents; camera releases when off-screen; a "Replace all / Add" prompt after a
  fridge scan.

## Polish
- Emojis throughout — calories ⚡, streak 🔥, ingredients and recipes (`src/lib/foodEmoji.ts`).
- Scan FAB icon → plus; chooser options use emojis and no longer turn black.
- Wheel picker rebuilt on a virtualized FlatList — fixes the weight/birthdate/height scroll lag.
- Water simplified to glasses; whole card is tappable; custom amounts use your measurement system.
- Units screen is now the onboarding-style Metric/Imperial picker.
- Haptics enabled app-wide with a toggle (Appearance settings).
- Week-strip day spacing, equal-height stat cards, cleaner recipe meta.

## Fixes
- Splash-screen prebuild crash (iOS splash image + cleared stale storyboard).
- Sign-in "Invalid API key" — the EAS production anon key was a placeholder (now set).
- Blank "Start cooking" button (JSX-array children → template literal).
- All 21 pre-existing lint errors resolved.

## Backend
Deployed to the live Supabase project on 2026-06-16: migrations
(`progress`/`weight_logs`, `food_micros`, `micros_jsonb`) + edge functions (`usda-search`,
`scan-meal`). Weight logging and micros work server-side.

## State
Code committed + pushed to `origin/ui-polish`. `tsc`, `eslint`, and the production iOS bundle are all
clean.
