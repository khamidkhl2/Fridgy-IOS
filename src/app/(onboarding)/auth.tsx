/** Onboarding 11 — Auth (sign up / sign in). Google uses OAuth; Apple uses native iOS auth when available. */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/components/Headline';
import { LeafMark } from '@/components/LeafMark';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { fetchProfile, saveOnboardingToProfile } from '@/lib/db';
import { PRIVACY_URL, TERMS_URL } from '@/lib/links';
import { useGo, useOnboarding } from '@/lib/onboarding';
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

export default function AuthScreen() {
  const { theme } = useTheme();
  const { finish, data: onboardingData } = useOnboarding();
  const { signInWithOAuth, signInWithApple, session } = useAuth();
  const go = useGo();
  const params = useLocalSearchParams<{ mode?: string }>();
  const insets = useSafeAreaInsets();
  const [busyProvider, setBusyProvider] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = busyProvider !== null;

  // 'signin' = the user tapped "Sign in" (no onboarding done). Default = the
  // final step of onboarding, where answers are saved to the account.
  const signInMode = params.mode === 'signin';

  // Completion path for onboarding (native): once a session exists — whether the
  // user just signed in here, or arrived already signed in (routed back into
  // onboarding after a "sign in" with no plan) — save the plan and enter the app.
  const completed = useRef(false);
  useEffect(() => {
    if (signInMode || completed.current || Platform.OS === 'web') return;
    const user = session?.user;
    if (!user) return;
    completed.current = true;
    (async () => {
      await finish();
      await saveOnboardingToProfile(user.id, onboardingData);
      go.replace('/home');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, signInMode]);

  const onOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    setBusyProvider(provider);

    // Persist onboarding answers first (only when finishing onboarding) — on web
    // the OAuth call redirects the page away before we can do it afterwards.
    if (!signInMode) await finish();

    const { error: signInError } = provider === 'apple' ? await signInWithApple() : await signInWithOAuth(provider);
    if (signInError) {
      setError(signInError.message);
      setBusyProvider(null);
      return;
    }
    setBusyProvider(null);

    // Web has redirected; the launch gate (index) routes by onboarding status.
    // Native onboarding completion is handled by the effect above once the
    // session lands.
    if (Platform.OS === 'web' || !signInMode) return;

    // Plain sign-in: only onboarded accounts go to the app. A not-yet-onboarded
    // account is effectively new (it skipped setup) — send it through onboarding.
    const { data } = await supabase.auth.getUser();
    const onboarded = data.user ? (await fetchProfile(data.user.id))?.onboarded === true : false;
    if (onboarded) {
      go.replace('/home');
    } else {
      Alert.alert(
        "Let's set up your plan",
        "This account hasn't finished setup yet. We'll walk you through a quick onboarding to build your plan.",
        [{ text: 'Continue', onPress: () => go.replace('/name') }]
      );
    }
  };

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
          <LeafMark size={62} />
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
                <Txt w={800} size={15} color={theme.ink} onPress={() => go.replace('/name')} style={{ textDecorationLine: 'underline' }}>
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
