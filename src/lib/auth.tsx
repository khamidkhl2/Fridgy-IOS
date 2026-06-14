/**
 * Auth state + actions backed by Supabase.
 *
 * Tracks the current session (persisted/refreshed by the supabase client),
 * exposes provider sign-in and sign-out, and reports `loading` while the
 * initial session is read from storage so the launch gate can wait.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Provider, Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { queryClient } from './queryClient';
import { supabase } from './supabase';

type Result = { error: Error | null };

type AuthCtx = {
  session: Session | null;
  /** `true` until the persisted session has been read on launch. */
  loading: boolean;
  /** OAuth sign-in for any enabled provider (e.g. 'google', 'apple'). */
  signInWithOAuth: (provider: Provider) => Promise<Result>;
  /** Native iOS Apple sign-in, with OAuth fallback on web/Android. */
  signInWithApple: () => Promise<Result>;
  signOut: () => Promise<void>;
  /** Permanently delete the account + all data (App Store 5.1.1(v)). */
  deleteAccount: () => Promise<Result>;
};

const Context = createContext<AuthCtx | null>(null);

function errorFromUnknown(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback);
}

function createNonce(): string {
  return Array.from(Crypto.getRandomBytes(32), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Clear per-user local data so the next account starts clean: the onboarding
 *  cache, the onboarding flag, and any cached recipe sets (keyed per user). */
async function clearLocalUserData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys().catch(() => [] as readonly string[]);
  const recipeKeys = keys.filter((k) => k.startsWith('recipeCache'));
  await AsyncStorage.multiRemove(['userData', 'onboardingComplete', ...recipeKeys]).catch(() => {});
  queryClient.clear();
}

function appleProfileMetadata(credential: AppleAuthentication.AppleAuthenticationCredential) {
  const fullName = credential.fullName;
  if (!fullName) return null;

  const nameParts = [fullName.givenName, fullName.middleName, fullName.familyName].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0
  );
  if (nameParts.length === 0) return null;

  return {
    full_name: nameParts.join(' '),
    given_name: fullName.givenName,
    family_name: fullName.familyName,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Note: the onboarding → profile sync lives in ProfileProvider (the owner of
  // the profile row), which runs it once per user after sign-in.

  const signInWithOAuth = useMemo(
    () => async (provider: Provider): Promise<Result> => {
      // Web: full-page redirect; supabase-js completes the exchange on return.
      if (Platform.OS === 'web') {
        const redirectTo = window.location.origin;
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        });
        return { error: error ?? null };
      }

      // Native: open the provider in an in-app browser, then exchange the code.
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return { error };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') {
        return { error: null }; // user dismissed/cancelled — not an error
      }

      const { queryParams } = Linking.parse(result.url);
      const errorDescription = queryParams?.error_description;
      if (typeof errorDescription === 'string') return { error: new Error(errorDescription) };

      const code = queryParams?.code;
      if (typeof code !== 'string') return { error: new Error('No authorization code returned') };

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      return { error: exchangeError ?? null };
    },
    []
  );

  const signInWithApple = useMemo(
    () => async (): Promise<Result> => {
      if (Platform.OS !== 'ios') {
        return signInWithOAuth('apple');
      }

      try {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAvailable) {
          return signInWithOAuth('apple');
        }

        const rawNonce = createNonce();
        const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
        const credential = await AppleAuthentication.signInAsync({
          nonce: hashedNonce,
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!credential.identityToken) {
          return { error: new Error('Apple did not return an identity token.') };
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          access_token: credential.authorizationCode ?? undefined,
          nonce: rawNonce,
        });
        if (error) return { error };

        const metadata = appleProfileMetadata(credential);
        if (metadata) await supabase.auth.updateUser({ data: metadata });

        return { error: null };
      } catch (error) {
        if ((error as { code?: string })?.code === 'ERR_REQUEST_CANCELED') {
          return { error: null };
        }
        return { error: errorFromUnknown(error, 'Apple sign-in failed.') };
      }
    },
    [signInWithOAuth]
  );

  const signOut = useMemo(
    () => async () => {
      await supabase.auth.signOut();
      // drop the local onboarding cache + cached per-user query data so the next
      // account starts clean (no stale logs/fridge/recipes from the last user)
      await clearLocalUserData();
    },
    []
  );

  const deleteAccount = useMemo(
    () => async (): Promise<Result> => {
      const { error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) return { error };
      // account is gone server-side — clear the local session + cached user data
      await supabase.auth.signOut().catch(() => {});
      await clearLocalUserData();
      return { error: null };
    },
    []
  );

  const value = useMemo<AuthCtx>(
    () => ({ session, loading, signInWithOAuth, signInWithApple, signOut, deleteAccount }),
    [session, loading, signInWithOAuth, signInWithApple, signOut, deleteAccount]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
