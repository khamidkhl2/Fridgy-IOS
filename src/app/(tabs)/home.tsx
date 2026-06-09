/** Screen 3 — Home / Kitchen dashboard. Calorie ring, macro mini-rings, today's meals. */
import { useRouter, type Href } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/components/Headline';
import { Icon, type IconName } from '@/components/Icon';
import { LeafMark } from '@/components/LeafMark';
import { Ring } from '@/components/Ring';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import {
  currentStreak,
  deleteFoodLog,
  groupByMeal,
  loggedDays,
  logsForDay,
  MEALS as MEAL_DEFS,
  setEditLog,
  sumMacros,
  useRecentLogs,
  useToday,
  weekActivity,
  type FoodLog,
  type MealType,
} from '@/lib/food';
import { useProfile, useProfileRow, useTargets } from '@/lib/profile';
import { formatWater, servingMl, useWaterToday, useWaterUnit, waterGoalMl } from '@/lib/water';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/themes';

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const MACRO_META: { key: 'protein' | 'carbs' | 'fat'; label: string; icon: IconName; soft: keyof Theme }[] = [
  { key: 'protein', label: 'Protein', icon: 'drumstick', soft: 'proteinSoft' },
  { key: 'carbs', label: 'Carbs', icon: 'wheat', soft: 'carbsSoft' },
  { key: 'fat', label: 'Fat', icon: 'droplet', soft: 'fatSoft' },
];

const MEAL_ICON: Record<MealType, IconName> = {
  breakfast: 'leaf',
  lunch: 'drumstick',
  dinner: 'wheat',
  snack: 'apple',
};

// Fallback goals shown before the profile/targets load (or if data is incomplete).
const FALLBACK_TARGETS = { calories: 2000, protein: 150, carbs: 220, fat: 60 };

const CARD_SHADOW = '0px 8px 22px -12px rgba(30,28,24,0.18)';
const SOFT_SHADOW = '0px 6px 16px -12px rgba(30,28,24,0.16)';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export default function DashboardScreen() {
  const { theme } = useTheme();
  const profile = useProfile();
  const targets = useTargets() ?? FALLBACK_TARGETS;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const greeting = greetingFor(new Date().getHours());

  const { logs, reload } = useRecentLogs();
  const today = useToday();
  const todays = logsForDay(logs, today);
  const consumed = sumMacros(todays);
  const byMeal = groupByMeal(todays);
  const days = loggedDays(logs);
  const streak = currentStreak(days, today);
  const week = weekActivity(days, today);

  const remainingCal = Math.max(0, targets.calories - consumed.calories);
  const calProgress = targets.calories ? clamp01(consumed.calories / targets.calories) : 0;

  const goalFor = (k: 'protein' | 'carbs' | 'fat') => targets[k];

  // water
  const { row } = useProfileRow();
  const [waterUnit] = useWaterUnit();
  const water = useWaterToday();
  const waterGoal = waterGoalMl({
    weightKg: row?.weight_kg,
    goal: row?.goal,
    trainingTypes: row?.training_types,
  });
  const waterProgress = clamp01(water.totalMl / waterGoal);

  const addTo = (meal: MealType) =>
    router.push(`/add-food?meal=${meal}&date=${today}` as Href);
  const edit = (log: FoodLog) => {
    // Recipe meals are logged per serving, so the gram-based portion editor
    // doesn't apply — point the user at long-press to remove instead.
    if (log.source === 'recipe') {
      Alert.alert('Logged from a recipe', 'This meal was logged as one serving. Press and hold to remove it.');
      return;
    }
    setEditLog(log);
    router.push('/add-food?edit=1' as Href);
  };
  const remove = async (id: string) => {
    await deleteFoodLog(id);
    reload();
  };

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 22,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <LeafMark size={28} />
            <H size={25}>Fridgy</H>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 8,
              paddingLeft: 11,
              paddingRight: 14,
              borderRadius: 22,
              backgroundColor: theme.accentSoft,
            }}
          >
            <Icon name="flame" size={17} color={theme.accent} stroke={1.7} fill={theme.accent} />
            <Txt w={800} size={15} color={theme.ink}>
              {streak}
            </Txt>
          </View>
        </View>

        {/* greeting */}
        <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
          <Txt w={600} size={14} color={theme.inkSec}>
            {greeting},
          </Txt>
          <H size={28} style={{ marginTop: 1 }}>
            {profile.firstName}
          </H>
        </View>

        {/* week strip */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 }}>
          {week.map((w) => {
            const today_ = w.state === 'today';
            const done = w.state === 'done';
            return (
              <View key={w.iso} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Txt w={700} size={12} color={today_ ? theme.ink : theme.inkSec}>
                  {w.weekday}
                </Txt>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: today_ ? theme.primary : 'transparent',
                    borderWidth: today_ ? 0 : 2,
                    borderColor: done ? theme.primary : theme.track,
                  }}
                >
                  {done ? (
                    <Icon name="check" size={15} color={theme.primary} stroke={2.6} />
                  ) : (
                    <Txt w={800} size={14} color={today_ ? theme.onPrimary : theme.inkSec}>
                      {w.dayNum}
                    </Txt>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* calories card */}
        <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
          <View
            accessible
            accessibilityLabel={`${remainingCal.toLocaleString()} of ${targets.calories.toLocaleString()} kilocalories remaining today`}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 22,
              paddingVertical: 22,
              paddingHorizontal: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: CARD_SHADOW,
            }}
          >
            <View>
              <Txt w={800} size={52} color={theme.ink} style={{ letterSpacing: -1.5, fontVariant: ['tabular-nums'] }}>
                {remainingCal.toLocaleString()}
              </Txt>
              <Txt w={600} size={15} color={theme.inkSec} style={{ marginTop: 6 }}>
                kcal remaining
              </Txt>
            </View>
            <Ring size={104} stroke={11} progress={calProgress} color={theme.primary} track={theme.track}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: theme.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="flame" size={26} color={theme.primary} stroke={1.7} />
              </View>
            </Ring>
          </View>
        </View>

        {/* macro cards */}
        <View style={{ flexDirection: 'row', gap: 11, paddingHorizontal: 18, paddingTop: 11 }}>
          {MACRO_META.map((m) => {
            const goal = goalFor(m.key);
            const used = consumed[m.key];
            const left = Math.max(0, Math.round(goal - used));
            const prog = goal ? clamp01(used / goal) : 0;
            return (
              <View
                key={m.key}
                style={{
                  flex: 1,
                  backgroundColor: theme.surface,
                  borderRadius: 18,
                  paddingTop: 15,
                  paddingHorizontal: 13,
                  paddingBottom: 16,
                  boxShadow: SOFT_SHADOW,
                }}
              >
                <Txt w={800} size={23} color={theme.ink} style={{ letterSpacing: -0.5 }}>
                  {left}g
                </Txt>
                <Txt w={600} size={12.5} color={theme.inkSec} style={{ marginTop: 4 }}>
                  {m.label} left
                </Txt>
                <View style={{ alignSelf: 'center', marginTop: 12 }}>
                  <Ring size={52} stroke={6} progress={prog} color={theme[m.key] as string} track={theme.track}>
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: theme[m.soft] as string,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={m.icon} size={16} color={theme[m.key] as string} stroke={1.8} />
                    </View>
                  </Ring>
                </View>
              </View>
            );
          })}
        </View>

        {/* water */}
        <View style={{ paddingHorizontal: 18, paddingTop: 11 }}>
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 18,
              padding: 16,
              boxShadow: SOFT_SHADOW,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: theme.fatSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="droplet" size={22} color={theme.fat} stroke={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt w={800} size={15.5} color={theme.ink}>
                  Water
                </Txt>
                <Txt w={600} size={13} color={theme.inkSec} style={{ marginTop: 2 }}>
                  {formatWater(water.totalMl, waterUnit)} of {formatWater(waterGoal, waterUnit)}
                </Txt>
              </View>
              <Pressable
                onPress={water.undo}
                accessibilityRole="button"
                accessibilityLabel="Remove last drink"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.bg,
                }}
              >
                <View style={{ width: 16, height: 2.4, borderRadius: 2, backgroundColor: theme.inkSec }} />
              </Pressable>
              <Pressable
                onPress={() => water.add(servingMl(waterUnit))}
                accessibilityRole="button"
                accessibilityLabel="Add water"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.fat,
                }}
              >
                <Icon name="plus" size={20} color="#FFFFFF" stroke={2.6} />
              </Pressable>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.track, overflow: 'hidden', marginTop: 14 }}>
              <View style={{ width: `${waterProgress * 100}%`, height: '100%', backgroundColor: theme.fat, borderRadius: 4 }} />
            </View>
          </View>
        </View>

        {/* today's meals */}
        <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
          <H size={22} style={{ marginBottom: 4 }}>
            Today&apos;s meals
          </H>
          <Txt w={500} size={12.5} color={theme.inkSec} style={{ marginBottom: 12 }}>
            Tap ＋ to log food · tap an item to edit · hold to remove
          </Txt>
          <View style={{ gap: 10 }}>
            {MEAL_DEFS.map((def) => {
              const items = byMeal[def.key];
              const total = items.reduce((s, it) => s + it.calories, 0);
              const logged = items.length > 0;
              return (
                <View
                  key={def.key}
                  style={{
                    padding: 12,
                    backgroundColor: theme.surface,
                    borderRadius: 16,
                    boxShadow: '0px 4px 14px -12px rgba(30,28,24,0.14)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 13,
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: logged ? theme.primarySoft : theme.bg,
                        borderWidth: logged ? 0 : 1.5,
                        borderColor: theme.border,
                        borderStyle: 'dashed',
                      }}
                    >
                      <Icon
                        name={logged ? MEAL_ICON[def.key] : 'plus'}
                        size={20}
                        color={logged ? theme.primary : theme.inkSec}
                        stroke={logged ? 1.8 : 2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt w={800} size={15.5} color={theme.ink}>
                        {def.label}
                      </Txt>
                      <Txt w={500} size={13} color={theme.inkSec} numberOfLines={1} style={{ marginTop: 2 }}>
                        {logged
                          ? `${items.length} item${items.length > 1 ? 's' : ''} · ${total} cal`
                          : 'Nothing logged yet'}
                      </Txt>
                    </View>
                    <Pressable
                      onPress={() => addTo(def.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add food to ${def.label}`}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: logged ? theme.bg : theme.primary,
                      }}
                    >
                      <Icon name="plus" size={18} color={logged ? theme.inkSec : theme.onPrimary} stroke={2.4} />
                    </Pressable>
                  </View>

                  {logged && (
                    <View style={{ marginTop: 10, gap: 2 }}>
                      {items.map((it) => (
                        <Pressable
                          key={it.id}
                          onPress={() => edit(it)}
                          onLongPress={() => remove(it.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`${it.name}, ${it.calories} calories`}
                          accessibilityHint={
                            it.source === 'recipe' ? 'Press and hold to remove' : 'Tap to edit portion, press and hold to remove'
                          }
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            paddingVertical: 7,
                            paddingLeft: 59,
                          }}
                        >
                          <Txt w={600} size={13.5} color={theme.ink} numberOfLines={1} style={{ flex: 1 }}>
                            {it.name}
                          </Txt>
                          <Txt w={600} size={13} color={theme.inkSec} style={{ fontVariant: ['tabular-nums'] }}>
                            {it.calories} cal
                          </Txt>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ScreenBg>
  );
}
