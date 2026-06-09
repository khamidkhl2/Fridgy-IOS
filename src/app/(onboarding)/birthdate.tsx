/** Onboarding 6 — Birth date (3-column drum picker). */
import { View } from 'react-native';
import { BottomDock } from '@/components/BottomDock';
import { H } from '@/components/Headline';
import { OnboardBar } from '@/components/OnboardBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { Wheel, WheelGroup } from '@/components/Wheel';
import { ONB_TOTAL, stepOf, useGo, useOnboarding } from '@/lib/onboarding';
import { useTheme } from '@/theme/ThemeProvider';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 2010 - 1940 + 1 }, (_, i) => 1940 + i);

export default function BirthDateScreen() {
  const { theme } = useTheme();
  const { data, update } = useOnboarding();
  const go = useGo();
  const { month, day, year } = data.birthDate;

  // functional merge so concurrent column settles don't clobber each other
  const set = (patch: Partial<typeof data.birthDate>) =>
    update((prev) => ({ birthDate: { ...prev.birthDate, ...patch } }));

  return (
    <ScreenBg>
      <OnboardBar step={stepOf('birthdate')} total={ONB_TOTAL} onBack={go.back} />

      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 28 }}>
        <H size={34}>When were you born?</H>
        <Txt w={500} size={15} color={theme.inkSec} style={{ marginTop: 11, lineHeight: 21 }}>
          Your age refines your calorie targets.
        </Txt>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <WheelGroup>
            <Wheel items={MONTHS} value={month} onChange={(v) => set({ month: v })} />
            <Wheel items={DAYS} value={day} onChange={(v) => set({ day: v })} />
            <Wheel items={YEARS} value={year} onChange={(v) => set({ year: v })} />
          </WheelGroup>
        </View>
      </View>

      <BottomDock>
        <PrimaryButton onPress={() => go.push('/body')}>Continue</PrimaryButton>
      </BottomDock>
    </ScreenBg>
  );
}
