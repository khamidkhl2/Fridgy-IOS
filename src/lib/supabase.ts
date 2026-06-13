/**
 * Supabase client singleton.
 *
 * - URL/anon key come from EXPO_PUBLIC_ env vars (see .env) — both are public,
 *   client-safe values guarded by Row-Level Security.
 * - Session is persisted with AsyncStorage and auto-refreshed.
 * - `detectSessionInUrl` is on for web only (the OAuth redirect returns to the
 *   page and supabase-js completes the PKCE exchange automatically). On native
 *   we complete the exchange manually after the in-app browser closes.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart the dev server.'
  );
}

const isWeb = Platform.OS === 'web';

/**
 * Web build uses static rendering (app.json `web.output: "static"`), so routes
 * are prerendered in Node where `window`/`localStorage` don't exist. This adapter
 * no-ops during SSR and uses real localStorage in the browser. Native uses
 * AsyncStorage directly (no SSR involved).
 */
const webStorage = {
  getItem: (key: string) =>
    Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem(key) : null),
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isWeb ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
    flowType: 'pkce',
  },
});

// On native, only refresh tokens while the app is foregrounded (Supabase guidance).
if (!isWeb) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
