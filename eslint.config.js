// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // `dist` is build output; `supabase/functions` are Deno edge functions with
    // URL imports (deployed via the Supabase CLI, not bundled into the app) and
    // shouldn't be linted by the React Native/Expo config.
    ignores: ["dist/*", "supabase/functions/**"],
  }
]);
