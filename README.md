# Fridgy 🥬

A warm, premium kitchen companion built in **React Native + Expo**. Scan your
fridge → AI recognizes ingredients → generate recipes → track daily nutrition.

This app implements the **Fridgy Design System** (handed off from Claude Design):
sage-green primary, warm off-white surfaces, editorial serif headlines (DM Serif
Display) over Plus Jakarta Sans UI, soft 18px cards, and a custom line-icon set.

## Running the app

> **Node lives in `~/.local`** (installed there during setup, no sudo). If `node`
> isn't found in your terminal, add it to your PATH first:
>
> ```bash
> export PATH="$HOME/.local/bin:$PATH"      # add to ~/.zshrc to make permanent
> ```

```bash
npm install            # already done, but safe to re-run
npx expo start         # then press i (iOS), a (Android), or w (web)
```

- **iOS / Android:** install **Expo Go** on your phone and scan the QR code, or
  press `i` / `a` for a simulator/emulator.
- **Web:** `npx expo start --web` (or press `w`). Useful for a quick look.

## What's implemented

Seven screens with real navigation, all Flexbox layouts, fully themeable:

| Route | Screen | Notes |
| --- | --- | --- |
| `/` | **Welcome** | Animated fridge-scan hero with live ingredient detection |
| `/goal` | **Goal Setup** | The reusable onboarding pattern (progress bar, select cards) |
| `/home` | **Kitchen** | Calorie ring, 3 macro mini-rings, today's meals |
| `/scan` | **Fridge Scan** | Signature feature — animated brackets, scan → detect → recipe flow |
| `/recipes` | **Recipes** | Suggestions generated from your scanned ingredients |
| `/profile` | **Profile** | Stats + settings list |
| `/settings` | **Appearance** | In-app theme picker — re-tints the whole app instantly |

**Flow:** Welcome → Goal Setup → Kitchen, with a bottom tab bar
(Kitchen · Recipes · **Scan FAB** · Profile). Tap the Scan FAB to run the
scan → "found 5 ingredients" → Build a recipe sequence.

**Themes:** Sage (default) plus Terracotta, Charcoal & Citron, Plum & Honey, and
Teal & Amber. Open **Profile → Appearance** to switch; the choice persists via
AsyncStorage.

## Project structure

```
src/
  app/                 # expo-router file-based routes
    _layout.tsx        # root Stack + fonts + ThemeProvider
    index.tsx          # Welcome
    goal.tsx  scan.tsx  settings.tsx
    (tabs)/            # tab group (shares the custom TabBar)
      _layout.tsx  home.tsx  recipes.tsx  profile.tsx
  components/          # Icon, Ring, PrimaryButton, TabBar, anim helpers, …
  theme/
    themes.ts          # the 5 palettes (design tokens)
    typography.ts      # Plus Jakarta Sans + per-theme serif fonts
    ThemeProvider.tsx  # active theme + persistence
  lib/nav.ts           # nav.go('route') wrapper over expo-router
```

## Design notes / next steps

- The camera feed and recipe/meal thumbnails are **striped placeholders** — drop
  in a real camera view (e.g. `expo-camera`) and food photography when ready.
- Scan detection is mocked (a 1.5s timer → canned ingredient list); wire it to
  your real recognition backend.
- Icons are an original monochrome line set (`src/components/Icon.tsx`).
- The app icon / splash are still the Expo defaults — swap the assets in
  `assets/images/` and `app.json` to brand them.
