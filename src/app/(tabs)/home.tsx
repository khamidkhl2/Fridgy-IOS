/** Screen 3 — Home / Kitchen dashboard. Calorie ring, macro mini-rings, today's meals. */
import { useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field } from '@/components/Field';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Ring } from '@/components/Ring';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { Pop } from '@/components/anim';
import { haptics } from '@/lib/haptics';
import {
  currentStreak,
  dayGrid,
  deleteFoodLog,
  groupByMeal,
  loggedDays,
  logsForDay,
  MEALS as MEAL_DEFS,
  MICRO_META,
  MICRO_INFO,
  microTarget,
  pickMicros,
  setEditLog,
  sumMacros,
  sumMicros,
  useRecentLogs,
  useToday,
  type FoodLog,
  type MealType,
  type MicroKey,
} from '@/lib/food';
import { useProfileRow, useTargets } from '@/lib/profile';
import { formatWater, fromUnit, servingMl, useWaterDay, waterGoalMl } from '@/lib/water';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/themes';

const MACRO_META: { key: 'protein' | 'carbs' | 'fat'; label: string; emoji: string; soft: keyof Theme }[] = [
  { key: 'protein', label: 'Protein', emoji: '🥩', soft: 'proteinSoft' },
  { key: 'carbs', label: 'Carbs', emoji: '🍞', soft: 'carbsSoft' },
  { key: 'fat', label: 'Fat', emoji: '🥑', soft: 'fatSoft' },
];

const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: '🥣',
  lunch: '🍗',
  dinner: '🍝',
  snack: '🍎',
};

// Fallback goals shown before the profile/targets load (or if data is incomplete).
const FALLBACK_TARGETS = { calories: 2000, protein: 150, carbs: 220, fat: 60 };

const CARD_SHADOW = '0px 8px 22px -12px rgba(30,28,24,0.18)';
const SOFT_SHADOW = '0px 6px 16px -12px rgba(30,28,24,0.16)';
// Shared height so all three swipeable stat pages (macros · micros · water) match.
const STAT_CARD_H = 144;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export default function DashboardScreen() {
  const { theme } = useTheme();
  const targets = useTargets() ?? FALLBACK_TARGETS;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { logs, reload } = useRecentLogs();
  const today = useToday();

  // The day the dashboard is showing. Defaults to today, follows the week strip;
  // a stored past day is kept until the user picks another (never the future).
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
  const selected = selectedOverride && selectedOverride <= today ? selectedOverride : today;
  const isToday = selected === today;

  const todays = logsForDay(logs, selected);
  const consumed = sumMacros(todays);
  const microTotals = sumMicros(todays);
  const byMeal = groupByMeal(todays);
  const days = loggedDays(logs);
  const streak = currentStreak(days, today);
  const grid = dayGrid(days, today);
  // group the flat day list into weeks so each one is a full-width snap page
  const weeks: (typeof grid)[] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  // horizontal strip: 5 weeks wide; land on the current week on first layout
  const stripRef = useRef<ScrollView>(null);
  const stripInit = useRef(false);
  // a touch tighter than width/7 so the days sit closer together (centred per week)
  const cellW = Math.min(50, width / 7);

  const remainingCal = Math.max(0, targets.calories - consumed.calories);
  const calProgress = targets.calories ? clamp01(consumed.calories / targets.calories) : 0;

  const goalFor = (k: 'protein' | 'carbs' | 'fat') => targets[k];

  // water — always shown in glasses; specific amounts use the profile's system
  const { row } = useProfileRow();
  const metric = row?.unit === 'metric';
  const water = useWaterDay(selected);
  const waterGoal = waterGoalMl({
    weightKg: row?.weight_kg,
    goal: row?.goal,
    trainingTypes: row?.training_types,
  });
  const waterProgress = clamp01(water.totalMl / waterGoal);
  const [waterModalOpen, setWaterModalOpen] = useState(false);

  // swipeable stat pager: macros → micronutrients → water
  // the 3 micros shown are personalized by training type (+ diet)
  const micros = pickMicros(row?.training_types, row?.dietary_styles);
  const [microDetail, setMicroDetail] = useState<MicroKey | null>(null);
  const [statPage, setStatPage] = useState(0);
  const STAT_PAGES = 3;

  const addWater = (ml: number) => {
    haptics.light();
    water.add(ml).catch(() => Alert.alert("Couldn't save water", 'Please check your connection and try again.'));
  };
  const undoWater = () => {
    haptics.light();
    water.undo().catch(() => Alert.alert("Couldn't update water", 'Please check your connection and try again.'));
  };

  const addTo = (meal: MealType) => {
    haptics.light();
    router.push(`/add-food?meal=${meal}&date=${selected}` as Href);
  };
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
          <H size={32} style={{ letterSpacing: -0.3 }}>Kitchen</H>
          <Pressable
            onPress={() => {
              haptics.light();
              router.push('/streak' as Href);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Day streak: ${streak}. View streak`}
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
            <Txt size={16}>🔥</Txt>
            <Txt w={800} size={15} color={theme.ink}>
              {streak}
            </Txt>
          </Pressable>
        </View>

        {/* week strip — scroll 3 weeks back / 1 ahead, tap a day to view it */}
        <ScrollView
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width}
          decelerationRate="fast"
          onContentSizeChange={() => {
            if (stripInit.current) return;
            stripInit.current = true;
            stripRef.current?.scrollTo({ x: width * 3, animated: false }); // current week
          }}
          style={{ paddingTop: 16, paddingBottom: 4 }}
        >
          {weeks.map((week, wi) => (
            <View key={wi} style={{ width, flexDirection: 'row', justifyContent: 'center' }}>
              {week.map((d) => {
                const sel = d.iso === selected;
                return (
                  <Pressable
                    key={d.iso}
                    disabled={d.isFuture}
                    onPress={() => {
                      haptics.selection();
                      setSelectedOverride(d.iso);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel, disabled: d.isFuture }}
                    style={{ width: cellW, alignItems: 'center', gap: 6, paddingVertical: 4, opacity: d.isFuture ? 0.3 : 1 }}
                  >
                    <Txt w={700} size={12} color={sel || d.isToday ? theme.ink : theme.inkSec}>
                      {d.weekdayLetter}
                    </Txt>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: sel ? theme.primary : d.logged ? theme.primarySoft : 'transparent',
                        borderWidth: d.isToday && !sel ? 2 : sel ? 0 : 1,
                        borderColor: d.isToday ? theme.primary : theme.track,
                      }}
                    >
                      <Txt w={800} size={14} color={sel ? theme.onPrimary : d.logged ? theme.primary : theme.ink}>
                        {d.dayNum}
                      </Txt>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {!isToday && (
          <Pressable
            onPress={() => {
              haptics.selection();
              setSelectedOverride(null);
              stripRef.current?.scrollTo({ x: width * 3, animated: true });
            }}
            accessibilityRole="button"
            accessibilityLabel="Back to today"
            style={{
              alignSelf: 'center',
              marginTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingVertical: 6,
              paddingLeft: 10,
              paddingRight: 14,
              borderRadius: 16,
              backgroundColor: theme.primarySoft,
            }}
          >
            <Icon name="chevronLeft" size={15} color={theme.primary} stroke={2.4} />
            <Txt w={700} size={13} color={theme.primary}>
              Back to today
            </Txt>
          </Pressable>
        )}

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
                <Txt size={26}>⚡</Txt>
              </View>
            </Ring>
          </View>
        </View>

        {/* swipeable stats: macros · water  (micronutrients slots in here later) */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const p = Math.round(e.nativeEvent.contentOffset.x / width);
            if (p !== statPage) {
              haptics.selection();
              setStatPage(p);
            }
          }}
          style={{ paddingTop: 11 }}
        >
          {/* page 1 — macros */}
          <View style={{ width, paddingHorizontal: 18 }}>
            <View style={{ flexDirection: 'row', gap: 11 }}>
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
                      minHeight: STAT_CARD_H,
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
                          <Txt size={15}>{m.emoji}</Txt>
                        </View>
                      </Ring>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* page 2 — micronutrients */}
          <View style={{ width, paddingHorizontal: 18 }}>
            <View style={{ flexDirection: 'row', gap: 11 }}>
              {micros.map((key) => {
                const meta = MICRO_META[key];
                const target = microTarget(key, row?.gender);
                const used = Math.round(microTotals[key]);
                const prog = clamp01(used / target);
                const over = meta.kind === 'limit' && used > target;
                const color = over ? theme.protein : meta.kind === 'goal' ? theme.primary : theme.fat;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      haptics.light();
                      setMicroDetail(key);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${meta.label}: ${used} of ${target} ${meta.unit}. Tap for details`}
                    style={({ pressed }) => ({
                      flex: 1,
                      minHeight: STAT_CARD_H,
                      backgroundColor: theme.surface,
                      borderRadius: 18,
                      paddingTop: 15,
                      paddingHorizontal: 13,
                      paddingBottom: 16,
                      boxShadow: SOFT_SHADOW,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <Txt w={800} size={20} color={theme.ink} style={{ letterSpacing: -0.5 }}>
                      {used}
                      {meta.unit}
                    </Txt>
                    <Txt w={600} size={12.5} color={theme.inkSec} style={{ marginTop: 4 }}>
                      {meta.label}
                    </Txt>
                    <View style={{ alignSelf: 'center', marginTop: 12 }}>
                      <Ring size={52} stroke={6} progress={prog} color={color} track={theme.track}>
                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
                          <Txt size={15}>{meta.emoji}</Txt>
                        </View>
                      </Ring>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* page 3 — water (the whole card opens the custom-amount sheet) */}
          <View style={{ width, paddingHorizontal: 18 }}>
            <Pressable
              onPress={() => {
                haptics.light();
                setWaterModalOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Add a custom water amount"
              style={{
                minHeight: STAT_CARD_H,
                justifyContent: 'center',
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
                  <Txt size={22}>💧</Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt w={800} size={15.5} color={theme.ink}>
                    Water
                  </Txt>
                  <Txt w={600} size={13} color={theme.inkSec} style={{ marginTop: 2 }}>
                    {formatWater(water.totalMl, 'glasses')} of {formatWater(waterGoal, 'glasses')}
                  </Txt>
                </View>
                <Pressable
                  onPress={undoWater}
                  accessibilityRole="button"
                  accessibilityLabel="Remove last drink"
                  hitSlop={6}
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
                  onPress={() => addWater(servingMl('glasses'))}
                  accessibilityRole="button"
                  accessibilityLabel="Add a glass of water"
                  hitSlop={6}
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
            </Pressable>
          </View>
        </ScrollView>

        {/* page dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {Array.from({ length: STAT_PAGES }).map((_, i) => (
            <View
              key={i}
              style={{
                width: i === statPage ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === statPage ? theme.primary : theme.track,
              }}
            />
          ))}
        </View>

        {/* today's meals */}
        <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
          <H size={22} style={{ marginBottom: 12 }}>
            {isToday
              ? "Today's meals"
              : new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
          </H>
          <View style={{ gap: 10 }}>
            {MEAL_DEFS.map((def, i) => {
              const items = byMeal[def.key];
              const total = items.reduce((s, it) => s + it.calories, 0);
              const logged = items.length > 0;
              return (
                <Pop key={def.key} delay={i * 55}>
                <View
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
                      {logged ? (
                        <Txt size={20}>{MEAL_EMOJI[def.key]}</Txt>
                      ) : (
                        <Icon name="plus" size={20} color={theme.inkSec} stroke={2} />
                      )}
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
                </Pop>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <WaterAddModal
        visible={waterModalOpen}
        metric={metric}
        onClose={() => setWaterModalOpen(false)}
        onAdd={addWater}
      />

      <MicroDetailModal
        microKey={microDetail}
        used={microDetail ? Math.round(microTotals[microDetail]) : 0}
        target={microDetail ? microTarget(microDetail, row?.gender) : 0}
        onClose={() => setMicroDetail(null)}
      />
    </ScreenBg>
  );
}

/** Tap-through detail for a micronutrient: why it matters + consumed / left. */
function MicroDetailModal({
  microKey,
  used,
  target,
  onClose,
}: {
  microKey: MicroKey | null;
  used: number;
  target: number;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  if (!microKey) return null;
  const meta = MICRO_META[microKey];
  const isLimit = meta.kind === 'limit';
  const remaining = Math.max(0, target - used);
  const over = isLimit && used > target;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 28 }}
      >
        <Pressable onPress={() => {}} style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={24}>{meta.emoji}</Txt>
            </View>
            <View style={{ flex: 1 }}>
              <H size={22}>{meta.label}</H>
              <Txt w={600} size={12.5} color={theme.inkSec} style={{ marginTop: 1 }}>
                {isLimit ? 'Daily limit' : 'Daily goal'} {target.toLocaleString()} {meta.unit}
              </Txt>
            </View>
          </View>

          <Txt w={500} size={14.5} color={theme.ink} style={{ lineHeight: 21, marginBottom: 18 }}>
            {MICRO_INFO[microKey]}
          </Txt>

          <View style={{ flexDirection: 'row', gap: 11 }}>
            <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
              <Txt w={800} size={20} color={theme.ink}>
                {used.toLocaleString()}
                {meta.unit}
              </Txt>
              <Txt w={600} size={12} color={theme.inkSec} style={{ marginTop: 3 }}>
                Consumed
              </Txt>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
              <Txt w={800} size={20} color={over ? theme.protein : theme.primary}>
                {over ? `+${(used - target).toLocaleString()}` : remaining.toLocaleString()}
                {meta.unit}
              </Txt>
              <Txt w={600} size={12} color={theme.inkSec} style={{ marginTop: 3 }}>
                {over ? 'Over limit' : isLimit ? 'Left under limit' : 'Left to go'}
              </Txt>
            </View>
          </View>

          <Pressable onPress={onClose} style={{ paddingVertical: 12, marginTop: 14 }}>
            <Txt w={700} size={14.5} color={theme.inkSec} style={{ textAlign: 'center' }}>
              Close
            </Txt>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Small popup to log an exact water amount in the user's measurement system
 *  (millilitres on metric, fluid ounces on imperial). */
function WaterAddModal({
  visible,
  metric,
  onClose,
  onAdd,
}: {
  visible: boolean;
  metric: boolean;
  onClose: () => void;
  onAdd: (ml: number) => void;
}) {
  const { theme } = useTheme();
  const [value, setValue] = useState('');

  const close = () => {
    setValue('');
    onClose();
  };

  const unit = metric ? 'ml' : 'oz';
  const presets = metric ? [200, 250, 500] : [8, 12, 16];
  const unitName = metric ? 'millilitres (ml)' : 'fluid ounces (oz)';

  const submit = () => {
    const v = Number(value);
    if (!Number.isFinite(v) || v <= 0) return;
    onAdd(fromUnit(v, unit));
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable
        onPress={close}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 28 }}
      >
        {/* inner stops the backdrop press from closing */}
        <Pressable onPress={() => {}} style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 22 }}>
          <H size={22}>Add water</H>
          <Txt w={500} size={13.5} color={theme.inkSec} style={{ marginTop: 4, marginBottom: 16 }}>
            Enter an amount in {unitName}.
          </Txt>

          <Field
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            placeholder={`e.g. ${presets[1]}`}
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {presets.map((p) => (
              <Pressable
                key={p}
                onPress={() => setValue(String(p))}
                accessibilityRole="button"
                accessibilityLabel={`${p} ${unitName}`}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 11,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: value === String(p) ? theme.fat : theme.border,
                  backgroundColor: theme.bg,
                }}
              >
                <Txt w={700} size={14} color={theme.ink}>
                  {p}
                </Txt>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 18 }}>
            <PrimaryButton onPress={submit} disabled={!Number(value)}>
              Add water
            </PrimaryButton>
          </View>
          <Pressable onPress={close} style={{ paddingVertical: 10, marginTop: 6 }}>
            <Txt w={700} size={14.5} color={theme.inkSec} style={{ textAlign: 'center' }}>
              Cancel
            </Txt>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
