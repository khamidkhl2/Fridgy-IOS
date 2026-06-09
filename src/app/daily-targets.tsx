/** Daily targets — read-only breakdown of the calorie + macro goals from the profile. */
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Ring } from '@/components/Ring';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { rowBreakdown } from '@/lib/db';
import { useNav } from '@/lib/nav';
import { useProfileRow, useTargets } from '@/lib/profile';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/themes';

function goalAdjustmentLabel(factor: number): string {
  if (factor < 1) return `−${Math.round((1 - factor) * 100)}%`;
  if (factor > 1) return `+${Math.round((factor - 1) * 100)}%`;
  return 'Maintain';
}

const MACROS: { key: 'protein' | 'carbs' | 'fat'; label: string; perGram: number; color: keyof Theme; soft: keyof Theme }[] = [
  { key: 'protein', label: 'Protein', perGram: 4, color: 'protein', soft: 'proteinSoft' },
  { key: 'carbs', label: 'Carbs', perGram: 4, color: 'carbs', soft: 'carbsSoft' },
  { key: 'fat', label: 'Fat', perGram: 9, color: 'fat', soft: 'fatSoft' },
];

export default function DailyTargetsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const targets = useTargets();
  const { row, local } = useProfileRow();

  const goal = row?.goal ?? (typeof local.goal === 'string' ? local.goal : undefined);
  const activity = row?.activity_level ?? (typeof local.activityLevel === 'string' ? local.activityLevel : undefined);
  const breakdown = rowBreakdown(row);

  return (
    <ScreenBg>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 6, paddingHorizontal: 22 }}>
        <Pressable
          onPress={() => nav.back()}
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
          Daily targets
        </Txt>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {!targets ? (
          <Txt w={500} size={15} color={theme.inkSec} style={{ textAlign: 'center', marginTop: 40, lineHeight: 22 }}>
            Complete onboarding (age, height, weight, activity) to see your personalized targets.
          </Txt>
        ) : (
          <>
            {/* calories */}
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 22,
                padding: 24,
                alignItems: 'center',
                boxShadow: '0px 8px 22px -12px rgba(30,28,24,0.18)',
              }}
            >
              <Txt w={800} size={52} color={theme.ink} style={{ letterSpacing: -1.5, fontVariant: ['tabular-nums'] }}>
                {targets.calories.toLocaleString()}
              </Txt>
              <Txt w={600} size={15} color={theme.inkSec} style={{ marginTop: 4 }}>
                kcal per day
              </Txt>
            </View>

            {/* macro split */}
            <View style={{ flexDirection: 'row', gap: 11, marginTop: 12 }}>
              {MACROS.map((m) => {
                const grams = targets[m.key];
                const pct = targets.calories ? Math.round(((grams * m.perGram) / targets.calories) * 100) : 0;
                return (
                  <View
                    key={m.key}
                    style={{
                      flex: 1,
                      backgroundColor: theme.surface,
                      borderRadius: 18,
                      paddingVertical: 18,
                      alignItems: 'center',
                      boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
                    }}
                  >
                    <Ring size={58} stroke={6} progress={pct / 100} color={theme[m.color] as string} track={theme.track}>
                      <Txt w={800} size={13} color={theme[m.color] as string}>
                        {pct}%
                      </Txt>
                    </Ring>
                    <Txt w={800} size={19} color={theme.ink} style={{ marginTop: 10 }}>
                      {grams}g
                    </Txt>
                    <Txt w={600} size={12.5} color={theme.inkSec} style={{ marginTop: 2 }}>
                      {m.label}
                    </Txt>
                  </View>
                );
              })}
            </View>

            {/* how it's calculated */}
            {breakdown && (
              <View
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: theme.surface,
                  boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
                }}
              >
                <Txt w={800} size={12.5} color={theme.inkSec} style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                  How this is calculated
                </Txt>
                <CalcRow label="Base metabolism (BMR)" value={`${breakdown.bmr.toLocaleString()} kcal`} />
                <CalcRow
                  label={`Maintenance${activity ? ` · ${activity}` : ''}`}
                  value={`${breakdown.maintenance.toLocaleString()} kcal`}
                />
                <CalcRow label={`Goal · ${goal ?? '—'}`} value={goalAdjustmentLabel(breakdown.goalFactor)} />
                <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />
                <CalcRow label="Daily target" value={`${targets.calories.toLocaleString()} kcal`} strong />
                <CalcRow label="Protein" value={`${breakdown.proteinPerKg} g / kg bodyweight`} />
              </View>
            )}

            <Txt w={500} size={12.5} color={theme.inkSec} style={{ marginTop: 16, textAlign: 'center', lineHeight: 18 }}>
              Targets update automatically from your profile.
            </Txt>
          </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

function CalcRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Txt w={strong ? 800 : 600} size={14} color={strong ? theme.ink : theme.inkSec} style={{ flex: 1, marginRight: 12 }}>
        {label}
      </Txt>
      <Txt w={800} size={14} color={strong ? theme.primary : theme.ink} style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Txt>
    </View>
  );
}
