# Fridgy — Handoff

_Last updated: 2026-06-16 · branch `ui-polish`_

A working session built several features + fixes on top of the Supabase-backed Expo app.
Everything below is **code-complete and statically verified** (`tsc` 0 errors, `eslint` 0, production
iOS bundle builds clean) but **not yet committed, deployed, or device-tested**. Read the two
"Blockers" first — most "it doesn't work" reports trace back to them.

---

## ⚠️ Blockers (do these or features stay broken)

### 1. Backend not deployed
Several features read tables / functions that exist in the repo but **aren't pushed to the live
Supabase project** (`abcomiqfprvfffwqfvgn`). CLI is linked.

```bash
supabase db push                                  # applies pending migrations
supabase functions deploy usda-search scan-meal   # micro data sources
```

Pending migrations (verify against the live DB before pushing):
- `20260615120000_progress.sql` — `weight_logs` table + `profiles.goal_weight_kg`. **Weight logging
  (Progress tab) is broken until this is pushed** — the client code is correct; the table is missing.
- `20260615130000_food_micros.sql` — old per-nutrient columns (superseded below).
- `20260616120000_micros_jsonb.sql` — adds `food_logs.micros jsonb`, **drops** the 4 old micro
  columns (`if exists`, so safe). Micros stay 0 until this + the function deploy land.

The app degrades gracefully pre-deploy (food logging works; Progress/micros just empty/0).

### 2. Fresh native build required (3 native modules added)
`expo-haptics`, `expo-image-picker`, `expo-notifications` are in `package.json` but **not in the
current device binary** → no vibrations, no gallery button, no notifications on the installed build.
`ios/` is gitignored (CNG), so:

```bash
npx expo prebuild -p ios --clean    # relinks all native modules (runs pod install)
# then open ios/Fridgy.xcworkspace in Xcode → Archive → TestFlight
# OR: eas build --platform ios --profile production --auto-submit
```

**OTA (`eas update`) is NOT enough for these three** — native code needs a new binary. Everything
else this session is JS-only and OTA-able once a binary with the native modules is out.

---

## What shipped this session (all uncommitted — 72 changed files)

**Notifications** (local, on-device; `expo-notifications`) — expiry + meal + lifecycle reminders,
per-category opt-in toggles (Profile → Notifications), gated on an active session.
`src/lib/notifications.ts`, `src/lib/NotificationSync.tsx`.

**Personalized micronutrients** — 10-micro set, sex-aware RDAs, training+diet-personalized top-3
(`src/lib/micros.ts`); USDA (`usda-search`) + AI meal-scan (`scan-meal`) both produce real micros;
stored in `food_logs.micros` jsonb. Tap a micro card for a detail modal.

**Scanner UX** — unified meal/fridge layout, drag-to-peek result sheet, gallery picker
(`expo-image-picker`), "add a description?" step before analyzing, outer-L corner brackets, themed
accents, camera releases off-screen (`active={isFocused && phase==='idle'}`), "Replace all / Add"
prompt after a fridge scan.

**UI polish** — emojis throughout (calories ⚡, streak 🔥, ingredients + recipes via
`src/lib/foodEmoji.ts`), scan FAB → plus icon, Wheel picker rewritten on FlatList (fixes weight/
birthdate/height scroll lag), water = glasses-only with whole-card tap + per-system custom amount,
Units screen = onboarding Metric/Imperial picker, equal-height stat cards, recipe meta cleaned up.

**Fixes** — splash-screen prebuild crash (added iOS splash image + cleared stale storyboard),
sign-in "Invalid API key" (EAS prod env `EXPO_PUBLIC_SUPABASE_ANON_KEY` was the placeholder — the
user updated it), all 21 pre-existing lint errors resolved, blank "Start cooking" button (JSX-array
children → template literal), haptics enabled + a Haptics toggle (Appearance settings).

---

## Open / deferred (not started)

- **Server push notifications** (Supabase scheduled fn + Expo push tokens) — only local notifications
  exist. Onboarding-completion nudge intentionally skipped.
- **Recipe-logged micros** — recipes log macros only (source `recipe`); no micros.
- **Scanned-meal micro accuracy** — AI estimates, less accurate than USDA.
- Patch-version drift on ~6 Expo packages (advisory; `npx expo install --check` to align).
- Nothing this session has been **simulator/device-verified** — visual + native behavior need a real
  build pass (haptics, camera, image picker, wheel feel, notification scheduling).

---

## Build & deploy reference

- **CNG project**: `ios/` is gitignored and generated. EAS Build regenerates it in the cloud; for
  local Xcode builds run `npx expo prebuild -p ios` first (use `--clean` after native/config changes).
- **Env vars**: local builds read `.env`; EAS builds read the EAS environment per profile
  (`eas.json` → `production` uses the `production` environment). All keys are `EXPO_PUBLIC_*`
  (anon key is public/RLS-protected).
- **Versioning**: `eas.json` has `appVersionSource: remote` + `production.autoIncrement` — EAS bumps
  the build number server-side; the `app.json` `buildNumber` ("15") is ignored for EAS prod builds.
  For manual Xcode archives, bump the build number yourself.
- **Verify before shipping**: `npx tsc --noEmit` · `npx eslint .` · `npx expo export --platform ios`.

## Architecture pointers
- Data layer: `src/lib/*` (food, fridge, water, weight, micros, notifications, targets). Pure
  taxonomy/targets live in `micros.ts` + `targets.ts`.
- Screens: `src/app/**` (expo-router). Tabs: Kitchen/Recipes/Progress/Profile + corner scan FAB
  (`src/components/TabBar.tsx`).
- Edge functions (Deno, can't import `src/`): `supabase/functions/{usda-search,scan-meal,...}` —
  micro nutrient-number maps are duplicated there on purpose.
- Memory/notes for this project also live in the Claude memory file `app-store-polish.md`.
