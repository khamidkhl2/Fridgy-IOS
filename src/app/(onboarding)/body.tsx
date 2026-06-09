/** Onboarding 7 — Height & weight (drum pickers with imperial/metric toggle). */
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomDock } from '@/components/BottomDock';
import { H } from '@/components/Headline';
import { OnboardBar } from '@/components/OnboardBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { Wheel, WheelGroup } from '@/components/Wheel';
import { ONB_TOTAL, stepOf, useGo, useOnboarding, type Unit } from '@/lib/onboarding';
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

  // seed both unit systems once from stored values
  const [unit, setUnit] = useState<Unit>(data.unit);
  const [ft, setFt] = useState(() =>
    data.unit === 'imperial' ? clamp(Math.floor(data.height / 12), 3, 8) : clamp(Math.floor(Math.round(data.height / IN_PER_CM) / 12), 3, 8)
  );
  const [inch, setInch] = useState(() =>
    data.unit === 'imperial' ? clamp(data.height % 12, 0, 11) : clamp(Math.round(data.height / IN_PER_CM) % 12, 0, 11)
  );
  const [lb, setLb] = useState(() =>
    data.unit === 'imperial' ? clamp(Math.round(data.weight), 60, 400) : clamp(Math.round(data.weight / KG_PER_LB), 60, 400)
  );
  const [cm, setCm] = useState(() =>
    data.unit === 'metric' ? clamp(Math.round(data.height), 100, 250) : clamp(Math.round((data.height) * IN_PER_CM), 100, 250)
  );
  const [kg, setKg] = useState(() =>
    data.unit === 'metric' ? clamp(Math.round(data.weight), 30, 250) : clamp(Math.round(data.weight * KG_PER_LB), 30, 250)
  );

  // keep context in sync with the active unit
  useEffect(() => {
    if (unit === 'imperial') update({ unit, height: ft * 12 + inch, weight: lb });
    else update({ unit, height: cm, weight: kg });
  }, [unit, ft, inch, cm, lb, kg, update]);

  const switchTo = (next: Unit) => {
    if (next === unit) return;
    if (next === 'imperial') {
      const inches = Math.round(cm / IN_PER_CM);
      setFt(clamp(Math.floor(inches / 12), 3, 8));
      setInch(clamp(inches % 12, 0, 11));
      setLb(clamp(Math.round(kg / KG_PER_LB), 60, 400));
    } else {
      const inches = ft * 12 + inch;
      setCm(clamp(Math.round(inches * IN_PER_CM), 100, 250));
      setKg(clamp(Math.round(lb * KG_PER_LB), 30, 250));
    }
    setUnit(next);
  };

  return (
    <ScreenBg>
      <OnboardBar step={stepOf('body')} total={ONB_TOTAL} onBack={go.back} />

      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 24 }}>
        <H size={34}>Height &amp; weight</H>

        {/* unit toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.track,
            borderRadius: 14,
            padding: 4,
            marginTop: 18,
          }}
        >
          {(['imperial', 'metric'] as Unit[]).map((u) => {
            const on = unit === u;
            return (
              <Pressable
                key={u}
                onPress={() => switchTo(u)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 11,
                  alignItems: 'center',
                  backgroundColor: on ? theme.surface : 'transparent',
                  boxShadow: on ? '0px 2px 8px rgba(30,28,24,0.08)' : undefined,
                }}
              >
                <Txt w={on ? 800 : 600} size={14.5} color={on ? theme.ink : theme.inkSec}>
                  {u === 'imperial' ? 'Imperial' : 'Metric'}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
          <View>
            <Txt w={700} size={13} color={theme.inkSec} style={{ marginBottom: 9, marginLeft: 4, letterSpacing: 0.3, textTransform: 'uppercase' }}>
              Height
            </Txt>
            {unit === 'imperial' ? (
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
            {unit === 'imperial' ? (
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
