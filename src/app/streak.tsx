/** Streak — a playful view of the logging streak behind the Kitchen flame chip. */
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pop } from '@/components/anim';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { addDays, currentStreak, loggedDays, localDateISO, longestStreak, useRecentLogs, useToday } from '@/lib/food';
import { useTheme } from '@/theme/ThemeProvider';

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];
const HEAT_WEEKS = 14;

function flameLine(streak: number): string {
  if (streak === 0) return 'Log a meal today to start your streak.';
  if (streak < 3) return 'Nice start — keep it going!';
  if (streak < 7) return "You're building momentum.";
  if (streak < 30) return "You're on fire — don't break the chain!";
  return 'Unstoppable. Incredible consistency.';
}

export default function StreakScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { logs } = useRecentLogs(120);
  const today = useToday();
  const days = loggedDays(logs);
  const streak = currentStreak(days, today);
  const longest = longestStreak(days);
  const total = days.size;

  const nextMilestone = MILESTONES.find((m) => m > streak) ?? null;
  const progress = nextMilestone ? Math.min(1, streak / nextMilestone) : 1;

  // heatmap: HEAT_WEEKS columns (weeks) × 7 rows (Mon–Sun), ending this week
  const dow = new Date(`${today}T00:00:00`).getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const startISO = addDays(today, mondayOffset - (HEAT_WEEKS - 1) * 7);
  const columns = Array.from({ length: HEAT_WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, r) => {
      const iso = addDays(startISO, w * 7 + r);
      return { iso, logged: days.has(iso), isToday: iso === today, isFuture: iso > localDateISO() };
    })
  );

  const stats = [
    { v: String(streak), l: 'Current' },
    { v: String(longest), l: 'Longest' },
    { v: String(total), l: 'Days logged' },
  ];

  return (
    <ScreenBg>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 6, paddingHorizontal: 22 }}>
        <Pressable
          onPress={() => router.back()}
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
          Streak
        </Txt>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* hero */}
        <Pop>
          <View
            style={{
              alignItems: 'center',
              backgroundColor: theme.surface,
              borderRadius: 26,
              paddingVertical: 30,
              paddingHorizontal: 22,
              boxShadow: '0px 10px 28px -16px rgba(30,28,24,0.22)',
            }}
          >
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: theme.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt style={{ fontSize: 52 }}>🔥</Txt>
            </View>
            <H size={64} style={{ marginTop: 12 }}>
              {streak}
            </H>
            <Txt w={700} size={15} color={theme.inkSec} style={{ marginTop: 0 }}>
              day{streak === 1 ? '' : 's'} in a row
            </Txt>
            <Txt w={500} size={14} color={theme.inkSec} style={{ marginTop: 12, textAlign: 'center', lineHeight: 20, maxWidth: 260 }}>
              {flameLine(streak)}
            </Txt>
          </View>
        </Pop>

        {/* next milestone */}
        {nextMilestone && (
          <Pop delay={70}>
            <View style={{ backgroundColor: theme.surface, borderRadius: 20, padding: 18, marginTop: 14, boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Txt w={700} size={14} color={theme.ink}>
                  Next milestone
                </Txt>
                <Txt w={700} size={14} color={theme.primary}>
                  {streak}/{nextMilestone} days
                </Txt>
              </View>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.track, overflow: 'hidden' }}>
                <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 5, backgroundColor: theme.primary }} />
              </View>
            </View>
          </Pop>
        )}

        {/* heatmap */}
        <Pop delay={140}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 20, padding: 18, marginTop: 14, boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)' }}>
            <Txt w={700} size={14} color={theme.ink} style={{ marginBottom: 14 }}>
              Last {HEAT_WEEKS} weeks
            </Txt>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {columns.map((col, ci) => (
                <View key={ci} style={{ gap: 4 }}>
                  {col.map((cell) => (
                    <View
                      key={cell.iso}
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: 4,
                        backgroundColor: cell.isFuture
                          ? 'transparent'
                          : cell.logged
                            ? theme.primary
                            : theme.track,
                        borderWidth: cell.isToday ? 1.5 : 0,
                        borderColor: theme.accent,
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </Pop>

        {/* stats */}
        <View style={{ flexDirection: 'row', gap: 11, marginTop: 14 }}>
          {stats.map((s, i) => (
            <Pop key={s.l} delay={200 + i * 50} style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: 18,
                  paddingVertical: 16,
                  alignItems: 'center',
                  boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
                }}
              >
                <Txt w={800} size={24} color={theme.ink} style={{ letterSpacing: -0.5 }}>
                  {s.v}
                </Txt>
                <Txt w={600} size={11.5} color={theme.inkSec} style={{ marginTop: 3 }}>
                  {s.l}
                </Txt>
              </View>
            </Pop>
          ))}
        </View>
      </ScrollView>
    </ScreenBg>
  );
}
