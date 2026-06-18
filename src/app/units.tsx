/** Units — measurement system, presented like the onboarding step. Drives
 *  height/weight display, food portions (g/oz follow the system), and the units
 *  used when entering a specific water amount. */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { updateProfile } from '@/lib/db';
import { useFoodUnit } from '@/lib/food';
import { haptics } from '@/lib/haptics';
import { useNav } from '@/lib/nav';
import { useProfileRow } from '@/lib/profile';
import { useTheme } from '@/theme/ThemeProvider';

type Measure = 'imperial' | 'metric';
const OPTIONS: { id: Measure; emoji: string; label: string; desc: string }[] = [
  { id: 'metric', emoji: '🌍', label: 'Metric', desc: 'm, kg, ml' },
  { id: 'imperial', emoji: '🇺🇸', label: 'Imperial', desc: 'ft, lb, fl oz' },
];

export default function UnitsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { session } = useAuth();
  const { row, local, refresh } = useProfileRow();
  const [, setFoodUnit] = useFoodUnit();

  const [measure, setMeasure] = useState<Measure>(
    (row?.unit ?? (local.unit as Measure | undefined) ?? 'imperial') as Measure
  );
  // sync the selection once the row loads / changes (adjust-during-render idiom)
  const [synced, setSynced] = useState(row?.unit);
  if (row?.unit !== synced) {
    setSynced(row?.unit);
    if (row?.unit === 'imperial' || row?.unit === 'metric') setMeasure(row.unit);
  }

  const choose = (m: Measure) => {
    if (m === measure) return;
    setMeasure(m);
    haptics.selection();
    setFoodUnit(m === 'metric' ? 'g' : 'oz'); // food portions follow the system
    if (session?.user) updateProfile(session.user.id, { unit: m }).then(refresh);
  };

  return (
    <ScreenBg>
      {/* header */}
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

      <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
        <H size={28}>Which units do you use?</H>
        <Txt w={500} size={14.5} color={theme.inkSec} style={{ marginTop: 8, lineHeight: 21 }}>
          We&apos;ll use these throughout the app.
        </Txt>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 22, gap: 12 }} showsVerticalScrollIndicator={false}>
        {OPTIONS.map((o) => {
          const on = measure === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => choose(o.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                padding: 16,
                borderRadius: 18,
                backgroundColor: theme.surface,
                borderWidth: 1.6,
                borderColor: on ? theme.primary : theme.border,
                boxShadow: on ? `0px 10px 24px -14px ${theme.primary}` : '0px 2px 10px rgba(30,28,24,0.04)',
                transform: [{ scale: pressed ? 0.985 : 1 }],
              })}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primarySoft }}>
                <Txt size={24}>{o.emoji}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt w={800} size={17.5} color={theme.ink} style={{ letterSpacing: -0.1 }}>
                  {o.label}
                </Txt>
                <Txt w={500} size={13.5} color={theme.inkSec} style={{ marginTop: 2 }}>
                  {o.desc}
                </Txt>
              </View>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: on ? 0 : 2,
                  borderColor: theme.border,
                  backgroundColor: on ? theme.primary : 'transparent',
                }}
              >
                {on && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.onPrimary }} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenBg>
  );
}
