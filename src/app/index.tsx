/** Screen 1 — Welcome. Minimal editorial intro: wordmark, serif headline, CTA. */
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/components/Headline';
import { BrandMark } from '@/components/BrandMark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { useGo, useOnboarding } from '@/lib/onboarding';
import { useProfileRow } from '@/lib/profile';
import { useTheme } from '@/theme/ThemeProvider';

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const go = useGo();
  const { session, loading } = useAuth();
  const { row, loading: profileLoading, loadFailed, refresh } = useProfileRow();
  const { isOnboarded } = useOnboarding();
  const insets = useSafeAreaInsets();

  // launch gate: a saved session enters the app only if onboarding is complete;
  // otherwise (e.g. signed in but never set up a plan) it resumes onboarding.
  if (loading) return <ScreenBg>{null}</ScreenBg>;
  if (session) {
    // wait for the profile fetch + local flag before deciding (avoids a wrong-route flash)
    if ((profileLoading && row === null) || isOnboarded === null) return <ScreenBg>{null}</ScreenBg>;
    const onboarded = row?.onboarded === true || isOnboarded === true;
    // If the profile fetch failed (offline / flaky) and nothing locally confirms
    // onboarding, we genuinely don't know this user's status — don't bounce a
    // possibly-returning user into onboarding (which would overwrite their saved
    // plan). Show a retry instead and let them in once the row loads.
    if (!onboarded && loadFailed) return <ConnectingScreen onRetry={refresh} />;
    return <Redirect href={onboarded ? '/home' : '/name'} />;
  }

  return (
    <ScreenBg>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 30,
          paddingTop: insets.top + 26,
          paddingBottom: Math.max(insets.bottom, 20) + 16,
        }}
      >
        {/* wordmark */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <BrandMark size={26} />
          <H size={22} style={{ marginTop: 3 }}>
            Fridgy
          </H>
        </View>

        {/* editorial headline */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Txt
            w={800}
            size={13}
            color={theme.primary}
            style={{ textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 18 }}
          >
            Fridge to table
          </Txt>
          <H size={42} style={{ letterSpacing: -0.5 }}>
            {'Cook what\nyou already\nhave.'}
          </H>
          <Txt w={500} size={16} color={theme.inkSec} style={{ lineHeight: 24, marginTop: 20, maxWidth: 330 }}>
            Scan your fridge, get recipes you can actually make, and track every macro — automatically.
          </Txt>
        </View>

        {/* CTA */}
        <View>
          <PrimaryButton onPress={() => go.push('/name')}>Get Started</PrimaryButton>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18 }}>
            <Txt w={500} size={15} color={theme.inkSec}>
              Already have an account?{' '}
            </Txt>
            <Txt
              w={800}
              size={15}
              color={theme.ink}
              onPress={() => go.push('/auth?mode=signin')}
              style={{ textDecorationLine: 'underline' }}
            >
              Sign in
            </Txt>
          </View>
        </View>
      </View>
    </ScreenBg>
  );
}

/** Shown when a signed-in user's profile can't be reached on launch — better
 *  than wrongly routing a returning user back into onboarding. */
function ConnectingScreen({ onRetry }: { onRetry: () => void }) {
  const { theme } = useTheme();
  return (
    <ScreenBg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 }}>
        <H size={24} style={{ textAlign: 'center' }}>
          Couldn&apos;t connect
        </H>
        <Txt w={500} size={15} color={theme.inkSec} style={{ textAlign: 'center', marginTop: 12, lineHeight: 22 }}>
          We couldn&apos;t reach your account. Check your connection and try again.
        </Txt>
        <View style={{ width: '100%', marginTop: 28 }}>
          <PrimaryButton onPress={onRetry}>Try again</PrimaryButton>
        </View>
      </View>
    </ScreenBg>
  );
}
