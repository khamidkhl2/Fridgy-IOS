/** Onboarding 11 — Auth (sign up / sign in). Google uses OAuth; Apple uses native iOS auth when available. */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/components/Headline';
import { BrandMark } from '@/components/BrandMark';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { fetchProfile, saveOnboardingToProfile } from '@/lib/db';
import { PRIVACY_URL, TERMS_URL } from '@/lib/links';
import { useGo, useOnboarding } from '@/lib/onboarding';
import { useProfileRow } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

function AppleLogo({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M16.365 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.98 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.2-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.57 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.74-1.51.03-2.01-.88-3.83-.88s-2.36.85-3.78.91c-1.48.06-2.62-1.51-3.6-2.84-1.96-2.66-3.44-7.51-1.46-10.78.95-1.66 2.6-2.71 4.4-2.74 1.52-.03 2.94.99 3.85.99.91 0 2.66-1.22 4.49-1.04.74.03 2.84.27 4.18 2.27-.11.07-2.5 1.46-2.48 4.34.03 3.41 2.97 4.54 3.01 4.55z"
      />
    </Svg>
  );
}

function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </Svg>
  );
}

type BtnProps = {
  bg: string;
  fg: string;
  border?: string;
  logo: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
};

function AuthButton({ bg, fg, border, logo, label, onPress, disabled = false, busy = false }: BtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled && !busy ? 0.5 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 58,
        borderRadius: 16,
        backgroundColor: bg,
        borderWidth: border ? 1.5 : 0,
        borderColor: border,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {busy ? <ActivityIndicator color={fg} /> : logo}
      <Txt w={700} size={16.5} color={fg}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Name from the provider (Apple gives it on first sign-in; Google in metadata). */
function providerNameFrom(user: { user_metadata?: Record<string, unknown> | null }): string {
  const meta = user.user_metadata ?? {};
  return (
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    ''
  );
}

export default function AuthScreen() {
  const { theme } = useTheme();
  const { finish, data: onboardingData } = useOnboarding();
  const { signInWithOAuth, signInWithApple, session } = useAuth();
  const { refresh: refreshProfile } = useProfileRow();
  const go = useGo();
  const params = useLocalSearchParams<{ mode?: string }>();
  const insets = useSafeAreaInsets();
  const [busyProvider, setBusyProvider] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = busyProvider !== null;

  // 'signin' = the user tapped "Sign in" (no onboarding done). Default = the
  // final step of onboarding, where answers are saved to the account.
  const signInMode = params.mode === 'signin';

  // Finishing onboarding while already authenticated — either the user just
  // signed in here (default mode), or they signed in first and were routed back
  // through onboarding to build a plan. There's nothing left to sign into, so we
  // skip the auth buttons entirely: persist the plan, refresh the profile so the
  // new targets/answers are live everywhere, and enter the app. Runs on web and
  // native (no OAuth redirect needed since the session already exists).
  const finishing = !signInMode && !!session?.user;
  const completed = useRef(false);
  // Set once a provider button handles sign-in this mount, so the fallback effect
  // below (which only covers *arriving already-authenticated*) doesn't double-run.
  const handled = useRef(false);
  useEffect(() => {
    if (!finishing || completed.current || handled.current) return;
    completed.current = true;
    const user = session!.user;
    (async () => {
      await finish();
      // Don't clobber an already-set-up profile with the in-memory answers.
      const existing = await fetchProfile(user.id);
      if (!existing?.onboarded) {
        await saveOnboardingToProfile(user.id, { ...onboardingData, name: onboardingData.name || providerNameFrom(user) });
      }
      refreshProfile();
      go.replace('/home');
    })().catch(() => {
      // best-effort: the local cache still drives the app + the launch gate
      go.replace('/home');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishing]);

  const onOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    handled.current = true; // this button owns the post-sign-in routing
    setBusyProvider(provider);

    // Persist onboarding answers first (only when finishing onboarding) — on web
    // the OAuth call redirects the page away before we can do it afterwards.
    if (!signInMode) await finish();

    const { error: signInError } = provider === 'apple' ? await signInWithApple() : await signInWithOAuth(provider);
    if (signInError) {
      setError(signInError.message);
      setBusyProvider(null);
      handled.current = false;
      return;
    }

    // Web has redirected; the launch gate (index) routes by onboarding status.
    if (Platform.OS === 'web') {
      setBusyProvider(null);
      return;
    }

    // Native: the session is now on the client. Read the account's existing
    // onboarding status straight from the DB *before* the profile providers
    // react, so we can tell a returning account from a brand-new one.
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    setBusyProvider(null);
    if (!user) {
      handled.current = false; // sign-in cancelled / no session
      return;
    }

    const wasOnboarded = (await fetchProfile(user.id))?.onboarded === true;

    // Existing, fully-set-up account: never overwrite their plan — greet + enter.
    if (wasOnboarded) {
      refreshProfile();
      Alert.alert('Welcome back', 'You already have an account — signing you in.', [
        { text: 'Continue', onPress: () => go.replace('/home') },
      ]);
      return;
    }

    // Signed into an account that never finished setup — build a plan now.
    if (signInMode) {
      Alert.alert(
        "Let's set up your plan",
        "This account hasn't finished setup yet. We'll build your plan now.",
        [{ text: 'Continue', onPress: () => go.replace('/goal') }]
      );
      return;
    }

    // New account finishing onboarding: save answers (+ provider name) and enter.
    await saveOnboardingToProfile(user.id, { ...onboardingData, name: onboardingData.name || providerNameFrom(user) });
    refreshProfile();
    go.replace('/home');
  };

  // Already authenticated and finishing onboarding: show a brief loader instead
  // of the sign-in buttons while we save the plan and route into the app.
  if (finishing) {
    return (
      <ScreenBg>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </ScreenBg>
    );
  }

  return (
    <ScreenBg>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 26,
          paddingTop: insets.top + 30,
          paddingBottom: Math.max(insets.bottom, 18) + 10,
        }}
      >
        {/* brand + heading */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <BrandMark size={62} />
          <H size={34} style={{ marginTop: 24, textAlign: 'center' }}>
            {signInMode ? 'Welcome back' : 'Your plan is ready'}
          </H>
          <Txt
            w={500}
            size={15.5}
            color={theme.inkSec}
            style={{ marginTop: 12, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}
          >
            {signInMode
              ? 'Sign in to pick up where you left off.'
              : 'Create an account to save your plan and sync across devices.'}
          </Txt>
        </View>

        {/* auth actions */}
        <View style={{ gap: 12 }}>
          <AuthButton
            bg="#000000"
            fg="#FFFFFF"
            logo={<AppleLogo color="#FFFFFF" />}
            label={busyProvider === 'apple' ? 'Signing in…' : 'Sign in with Apple'}
            onPress={() => onOAuth('apple')}
            disabled={busy}
            busy={busyProvider === 'apple'}
          />
          <AuthButton
            bg={theme.surface}
            fg={theme.ink}
            border={theme.border}
            logo={<GoogleLogo />}
            label={busyProvider === 'google' ? 'Signing in…' : 'Sign in with Google'}
            onPress={() => onOAuth('google')}
            disabled={busy}
            busy={busyProvider === 'google'}
          />

          {error && (
            <Txt
              w={600}
              size={13.5}
              color={theme.protein}
              style={{ textAlign: 'center', marginTop: 2, lineHeight: 19 }}
            >
              {error}
            </Txt>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
            {signInMode ? (
              <>
                <Txt w={500} size={15} color={theme.inkSec}>
                  New here?{' '}
                </Txt>
                <Txt w={800} size={15} color={theme.ink} onPress={() => go.replace('/goal')} style={{ textDecorationLine: 'underline' }}>
                  Get started
                </Txt>
              </>
            ) : (
              <>
                <Txt w={500} size={15} color={theme.inkSec}>
                  Already have an account?{' '}
                </Txt>
                <Txt w={800} size={15} color={theme.ink} onPress={() => go.replace('/auth?mode=signin')} style={{ textDecorationLine: 'underline' }}>
                  Sign in
                </Txt>
              </>
            )}
          </View>

          <Txt w={500} size={12} color={theme.inkSec} style={{ textAlign: 'center', marginTop: 14, lineHeight: 17 }}>
            By continuing you agree to our{' '}
            <Txt w={700} size={12} color={theme.inkSec} onPress={() => Linking.openURL(TERMS_URL).catch(() => {})} style={{ textDecorationLine: 'underline' }}>
              Terms
            </Txt>{' '}
            and{' '}
            <Txt w={700} size={12} color={theme.inkSec} onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})} style={{ textDecorationLine: 'underline' }}>
              Privacy Policy
            </Txt>
            .
          </Txt>
        </View>
      </View>
    </ScreenBg>
  );
}
