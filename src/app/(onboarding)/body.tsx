/** Onboarding — Height & weight (drum pickers; unit chosen on the prior screen). */
import { useEffect, useState } from 'react';
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

const FT = [3, 4, 5, 6, 7, 8];
const INCHES = Array.from({ length: 12 }, (_, i) => i); // 0–11
const LB = Array.from({ length: 400 - 60 + 1 }, (_, i) => 60 + i);
const CM = Array.from({ length: 250 - 100 + 1 }, (_, i) => 100 + i);
const KG = Array.from({ length: 250 - 30 + 1 }, (_, i) => 30 + i);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const IN_PER_CM = 2.54;
const KG_PER_LB = 0.453592;

export default function HeightWeightScreen() {
  const { theme } = useTheme();
  const { data, update } = useOnboarding();
  const go = useGo();

  const unit = data.unit; // chosen on the Measurements step
  const imperial = unit === 'imperial';

  // seed from the stored values, converting if they were captured in the other unit
  const [ft, setFt] = useState(() =>
    imperial ? clamp(Math.floor(data.height / 12), 3, 8) : clamp(Math.floor(Math.round(data.height / IN_PER_CM) / 12), 3, 8)
  );
  const [inch, setInch] = useState(() =>
    imperial ? clamp(data.height % 12, 0, 11) : clamp(Math.round(data.height / IN_PER_CM) % 12, 0, 11)
  );
  const [lb, setLb] = useState(() =>
    imperial ? clamp(Math.round(data.weight), 60, 400) : clamp(Math.round(data.weight / KG_PER_LB), 60, 400)
  );
  const [cm, setCm] = useState(() =>
    !imperial ? clamp(Math.round(data.height), 100, 250) : clamp(Math.round(data.height * IN_PER_CM), 100, 250)
  );
  const [kg, setKg] = useState(() =>
    !imperial ? clamp(Math.round(data.weight), 30, 250) : clamp(Math.round(data.weight * KG_PER_LB), 30, 250)
  );

  // keep context in sync with the active unit
  useEffect(() => {
    if (imperial) update({ unit, height: ft * 12 + inch, weight: lb });
    else update({ unit, height: cm, weight: kg });
  }, [unit, imperial, ft, inch, cm, lb, kg, update]);

  return (
    <ScreenBg>
      <OnboardBar step={stepOf('body')} total={ONB_TOTAL} onBack={go.back} />

      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 24 }}>
        <H size={34}>Height &amp; weight</H>
        <Txt w={500} size={15} color={theme.inkSec} style={{ marginTop: 11, lineHeight: 21 }}>
          {imperial ? 'In feet, inches and pounds.' : 'In centimetres and kilograms.'}
        </Txt>

        <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
          <View>
            <Txt w={700} size={13} color={theme.inkSec} style={{ marginBottom: 9, marginLeft: 4, letterSpacing: 0.3, textTransform: 'uppercase' }}>
              Height
            </Txt>
            {imperial ? (
              <WheelGroup>
                <Wheel items={FT} value={ft} onChange={setFt} format={(v) => `${v} ft`} />
                <Wheel items={INCHES} value={inch} onChange={setInch} format={(v) => `${v} in`} />
              </WheelGroup>
            ) : (
              <WheelGroup>
                <Wheel items={CM} value={cm} onChange={setCm} format={(v) => `${v} cm`} />
              </WheelGroup>
            )}
          </View>

          <View>
            <Txt w={700} size={13} color={theme.inkSec} style={{ marginBottom: 9, marginLeft: 4, letterSpacing: 0.3, textTransform: 'uppercase' }}>
              Weight
            </Txt>
            {imperial ? (
              <WheelGroup>
                <Wheel items={LB} value={lb} onChange={setLb} format={(v) => `${v} lb`} />
              </WheelGroup>
            ) : (
              <WheelGroup>
                <Wheel items={KG} value={kg} onChange={setKg} format={(v) => `${v} kg`} />
              </WheelGroup>
            )}
          </View>
        </View>
      </View>

      <BottomDock>
        <PrimaryButton onPress={() => go.push('/activity')}>Continue</PrimaryButton>
      </BottomDock>
    </ScreenBg>
  );
}
