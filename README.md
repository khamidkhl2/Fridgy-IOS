# Fridgy

Premium SwiftUI iPhone MVP for fridge-first recipe generation.

## What is included

- Native `Fridgy.xcodeproj` that opens directly in Xcode.
- English SwiftUI flow: auth, onboarding, fridge scan, ingredient review, recipe suggestions, cooking steps, nutrition profile.
- Mock AI services for fridge recognition and recipe generation so the app runs before backend keys are added.
- Supabase Edge Function gateway scaffold for production API calls.
- Supabase Auth wired through `supabase-swift`: email/password, native Sign in with Apple, and Google OAuth via `fridgy://auth-callback`.
- Camera and photo-library flows for fridge images.
- Sign in with Apple UI and entitlement file.

## Backend shape

Keep OpenAI, FatSecret, USDA, and other API secrets on Supabase Edge Functions. The app should call:

- `POST /functions/v1/analyze-fridge`
- `POST /functions/v1/generate-recipes`
- `POST /functions/v1/resolve-nutrition`

Update these values in `Fridgy/Info.plist`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `FRIDGY_API_BASE_URL`
- `FRIDGY_AUTH_REDIRECT_URL`

For Google OAuth, add `fridgy://auth-callback` to the Supabase Auth redirect allow list and enable the Google provider in the Supabase dashboard.

## Next build steps

1. Replace placeholder Supabase values in `Info.plist`.
2. Enable Apple and Google providers in the Supabase dashboard.
3. Implement Supabase Edge Functions for OpenAI vision JSON, recipe generation, and nutrition lookup.
4. Add persistence for pantry scans and saved recipes.
