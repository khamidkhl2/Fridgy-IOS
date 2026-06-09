/** Onboarding 1 — Name. */
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { BottomDock } from '@/components/BottomDock';
import { Field } from '@/components/Field';
import { H } from '@/components/Headline';
import { OnboardBar } from '@/components/OnboardBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { ONB_TOTAL, stepOf, useGo, useOnboarding } from '@/lib/onboarding';
import { useTheme } from '@/theme/ThemeProvider';

export default function NameScreen() {
  const { theme } = useTheme();
  const { data, update } = useOnboarding();
  const go = useGo();

  return (
    <ScreenBg>
      <OnboardBar step={stepOf('name')} total={ONB_TOTAL} onBack={go.back} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 28 }}>
          <H size={34}>What&apos;s your name?</H>
          <Txt w={500} size={15} color={theme.inkSec} style={{ marginTop: 11, lineHeight: 21 }}>
            We&apos;ll use it to personalize your plan.
          </Txt>
          <Field
            value={data.name}
            onChangeText={(t) => update({ name: t })}
            placeholder="Your name"
            autoFocus
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => data.name.trim() && go.push('/goal')}
            style={{ marginTop: 26 }}
          />
        </View>
        <BottomDock>
          <PrimaryButton disabled={!data.name.trim()} onPress={() => go.push('/goal')}>
            Continue
          </PrimaryButton>
        </BottomDock>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}
