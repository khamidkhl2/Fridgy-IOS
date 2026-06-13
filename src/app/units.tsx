/** Units — measurement system, food portion unit, and water unit. */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { updateProfile } from '@/lib/db';
import { useFoodUnit, type FoodUnit } from '@/lib/food';
import { useNav } from '@/lib/nav';
import { useProfileRow } from '@/lib/profile';
import { useWaterUnit, type WaterUnit } from '@/lib/water';
import { useTheme } from '@/theme/ThemeProvider';

type Measure = 'imperial' | 'metric';
const MEASURES: { id: Measure; label: string }[] = [
  { id: 'imperial', label: 'Imperial' },
  { id: 'metric', label: 'Metric' },
];
const WATER_UNITS: { id: WaterUnit; label: string }[] = [
  { id: 'glasses', label: 'Glasses' },
  { id: 'ml', label: 'Milliliters' },
  { id: 'oz', label: 'Ounces' },
];
const FOOD_UNITS: { id: FoodUnit; label: string }[] = [
  { id: 'g', label: 'Grams' },
  { id: 'oz', label: 'Ounces' },
];

export default function UnitsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { session } = useAuth();
  const { row, local, refresh } = useProfileRow();
  const [waterUnit, setWaterUnit] = useWaterUnit();
  const [foodUnit, setFoodUnit] = useFoodUnit();

  const initialMeasure = (row?.unit ?? (local.unit as Measure | undefined) ?? 'imperial') as Measure;
  const [measure, setMeasure] = useState<Measure>(initialMeasure);

  const changeMeasure = (m: Measure) => {
    setMeasure(m);
    if (session?.user) updateProfile(session.user.id, { unit: m }).then(refresh);
  };

  return (
    <ScreenBg>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 6, paddingHorizontal: 22 }}>
        <Pressable
          onPress={() => nav.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.surface,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0px 2px 8px rgba(30,28,24,0.06)',
          }}
        >
          <Icon name="chevronLeft" size={20} color={theme.ink} stroke={2.2} />
        </Pressable>
        <Txt w={800} size={18} color={theme.ink}>
          Units
        </Txt>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>Measurement system</SectionLabel>
        <Segmented
          options={MEASURES.map((m) => ({ id: m.id, label: m.label }))}
          value={measure}
          onSelect={(v) => changeMeasure(v as Measure)}
        />
        <Txt w={500} size={12.5} color={theme.inkSec} style={{ marginTop: 8 }}>
          {measure === 'imperial' ? 'Weight in lb, height in inches.' : 'Weight in kg, height in cm.'}
        </Txt>

        <View style={{ height: 22 }} />

        <SectionLabel>Food portions</SectionLabel>
        <Segmented
          options={FOOD_UNITS.map((u) => ({ id: u.id, label: u.label }))}
          value={foodUnit}
          onSelect={(v) => setFoodUnit(v as FoodUnit)}
        />
        <Txt w={500} size={12.5} color={theme.inkSec} style={{ marginTop: 8 }}>
          How portions are shown when logging food.
        </Txt>

        <View style={{ height: 22 }} />

        <SectionLabel>Water</SectionLabel>
        <Segmented
          options={WATER_UNITS.map((u) => ({ id: u.id, label: u.label }))}
          value={waterUnit}
          onSelect={(v) => setWaterUnit(v as WaterUnit)}
        />
      </ScrollView>
    </ScreenBg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Txt w={800} size={12.5} color={theme.inkSec} style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
      {children}
    </Txt>
  );
}

function Segmented({
  options,
  value,
  onSelect,
}: {
  options: { id: string; label: string }[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.bg, borderRadius: 14, padding: 4 }}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => onSelect(o.id)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 11,
              borderRadius: 11,
              backgroundColor: on ? theme.surface : 'transparent',
              boxShadow: on ? '0px 2px 6px rgba(0,0,0,0.10)' : undefined,
            }}
          >
            <Txt w={on ? 800 : 600} size={14} color={on ? theme.ink : theme.inkSec}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
