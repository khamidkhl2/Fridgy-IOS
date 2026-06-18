/**
 * Edit a single profile field, onboarding-style. Opened from the Personal Details
 * and Goals & Body lists (see photo #5). Selects auto-save on tap; number/date/
 * multi inputs confirm with a Save button. Saving recomputes nutrition targets.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pop } from '@/components/anim';
import { BottomDock } from '@/components/BottomDock';
import { Field } from '@/components/Field';
import { Icon, type IconName } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { Wheel, WheelGroup } from '@/components/Wheel';
import { useAuth } from '@/lib/auth';
import { onboardingToProfile, updateProfile, type ProfileRow } from '@/lib/db';
import { haptics } from '@/lib/haptics';
import type { OnboardingData } from '@/lib/onboarding';
import { useProfileRow } from '@/lib/profile';
import { ageFromISO, computeTargets } from '@/lib/targets';
import { useTheme } from '@/theme/ThemeProvider';

const IN_PER_CM = 2.54;
const KG_PER_LB = 0.453592;
const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const FT = [3, 4, 5, 6, 7, 8];
const INCHES = Array.from({ length: 12 }, (_, i) => i);
const LB = Array.from({ length: 400 - 60 + 1 }, (_, i) => 60 + i);
const CM = Array.from({ length: 250 - 100 + 1 }, (_, i) => 100 + i);
const KG = Array.from({ length: 250 - 30 + 1 }, (_, i) => 30 + i);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 2010 - 1940 + 1 }, (_, i) => 1940 + i);

type Opt = { id: string; label: string; emoji?: string; icon?: IconName; desc?: string };

const GENDER: Opt[] = [
  { id: 'Male', emoji: '♂️', label: 'Male' },
  { id: 'Female', emoji: '♀️', label: 'Female' },
  { id: 'Prefer not to say', emoji: '⚪', label: 'Prefer not to say' },
];
const GOAL: Opt[] = [
  { id: 'Lose weight', icon: 'trendDown', label: 'Lose weight', desc: 'Burn fat, feel lighter' },
  { id: 'Build muscle', icon: 'dumbbell', label: 'Build muscle', desc: 'Gain strength and size' },
  { id: 'Maintain weight', icon: 'scale', label: 'Maintain weight', desc: 'Stay where I am' },
  { id: 'Eat healthier', icon: 'leaf', label: 'Eat healthier', desc: 'Better habits, more energy' },
];
const ACTIVITY: Opt[] = [
  { id: 'Sedentary', emoji: '🛋️', label: 'Sedentary', desc: 'Mostly sitting, desk job' },
  { id: 'Lightly active', emoji: '🚶', label: 'Lightly active', desc: 'Some walking day-to-day' },
  { id: 'Moderately active', emoji: '🏃', label: 'Moderately active', desc: 'Active job or daily exercise' },
  { id: 'Very active', emoji: '⚡', label: 'Very active', desc: 'Hard daily training' },
];
const DIET: Opt[] = [
  { id: 'Balanced', emoji: '🍽️', label: 'Balanced' },
  { id: 'Vegetarian', emoji: '🌱', label: 'Vegetarian' },
  { id: 'Pescatarian', emoji: '🐟', label: 'Pescatarian' },
  { id: 'Mediterranean', emoji: '🫒', label: 'Mediterranean' },
  { id: 'Keto / Low-carb', emoji: '🥑', label: 'Keto / Low-carb' },
  { id: 'Paleo', emoji: '🍖', label: 'Paleo' },
  { id: 'Halal', emoji: '☪️', label: 'Halal' },
  { id: 'Kosher', emoji: '✡️', label: 'Kosher' },
];
const TRAINING: Opt[] = [
  { id: 'Weightlifting', emoji: '🏋️', label: 'Weightlifting' },
  { id: 'Running', emoji: '🏃', label: 'Running' },
  { id: 'Cycling', emoji: '🚴', label: 'Cycling' },
  { id: 'Swimming', emoji: '🏊', label: 'Swimming' },
  { id: 'Yoga', emoji: '🧘', label: 'Yoga' },
  { id: 'Pilates', emoji: '🤸', label: 'Pilates' },
  { id: 'HIIT', emoji: '⚡', label: 'HIIT' },
  { id: 'CrossFit', emoji: '🔄', label: 'CrossFit' },
  { id: 'Boxing / MMA', emoji: '🥊', label: 'Boxing / MMA' },
  { id: 'Team sports', emoji: '⚽', label: 'Team sports' },
  { id: 'Walking', emoji: '🚶', label: 'Walking' },
  { id: 'Calisthenics', emoji: '🤸', label: 'Calisthenics' },
  { id: "I don't train", emoji: '💤', label: "I don't train" },
];

type FieldKey = 'name' | 'gender' | 'birthdate' | 'weight' | 'height' | 'goal' | 'activity' | 'diet' | 'training' | 'goalweight';
const TITLES: Record<FieldKey, string> = {
  name: 'Your name',
  gender: 'Biological sex',
  birthdate: 'Date of birth',
  weight: 'Current weight',
  height: 'Height',
  goal: 'Your goal',
  activity: 'Activity level',
  diet: 'Diet',
  training: 'Training',
  goalweight: 'Goal weight',
};

/** Normalized change → DB patch (+ recomputed targets, merged with the rest). */
type Change = {
  name?: string | null;
  gender?: string | null;
  goal?: string | null;
  activity?: string | null;
  dietary?: string[];
  training?: string[];
  weightKg?: number;
  heightCm?: number;
  goalWeightKg?: number;
  birthDate?: string | null;
};

export default function EditFieldScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { row, local, loading, refresh } = useProfileRow();
  const params = useLocalSearchParams<{ field?: string }>();
  const field = (params.field ?? 'name') as FieldKey;

  // effective profile: DB row, else the local onboarding cache mapped to a row
  let effective: Partial<ProfileRow> | null = row;
  if (!effective && typeof local.height === 'number') {
    try {
      effective = onboardingToProfile(local as unknown as OnboardingData);
    } catch {
      effective = null;
    }
  }

  const [saving, setSaving] = useState(false);

  const commit = async (change: Change) => {
    if (!session?.user || saving) return;
    setSaving(true);
    const e = effective ?? {};
    const targets = computeTargets({
      gender: change.gender ?? e.gender ?? null,
      weightKg: change.weightKg ?? e.weight_kg ?? null,
      heightCm: change.heightCm ?? e.height_cm ?? null,
      age: ageFromISO(change.birthDate ?? e.birth_date),
      activityLevel: change.activity ?? e.activity_level ?? null,
      goal: change.goal ?? e.goal ?? null,
      trainingTypes: change.training ?? e.training_types,
      dietaryStyles: change.dietary ?? e.dietary_styles,
    });
    const patch: Partial<ProfileRow> = {
      ...(change.name !== undefined ? { name: change.name } : {}),
      ...(change.gender !== undefined ? { gender: change.gender } : {}),
      ...(change.goal !== undefined ? { goal: change.goal } : {}),
      ...(change.activity !== undefined ? { activity_level: change.activity } : {}),
      ...(change.dietary !== undefined ? { dietary_styles: change.dietary } : {}),
      ...(change.training !== undefined ? { training_types: change.training } : {}),
      ...(change.weightKg !== undefined ? { weight_kg: round1(change.weightKg) } : {}),
      ...(change.heightCm !== undefined ? { height_cm: round1(change.heightCm) } : {}),
      ...(change.goalWeightKg !== undefined ? { goal_weight_kg: round1(change.goalWeightKg) } : {}),
      ...(change.birthDate !== undefined ? { birth_date: change.birthDate } : {}),
      calorie_target: targets?.calories ?? null,
      protein_target_g: targets?.protein ?? null,
      carb_target_g: targets?.carbs ?? null,
      fat_target_g: targets?.fat ?? null,
      onboarded: true,
    };
    await updateProfile(session.user.id, patch);
    refresh();
    haptics.success();
    router.back();
  };

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
          {TITLES[field]}
        </Txt>
      </View>

      {loading && !effective ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : field === 'name' ? (
        <NameEditor initial={effective?.name ?? ''} saving={saving} onSave={(name) => commit({ name: name.trim() || null })} />
      ) : field === 'gender' ? (
        <SelectEditor options={GENDER} initial={effective?.gender ?? ''} saving={saving} onPick={(id) => commit({ gender: id })} />
      ) : field === 'goal' ? (
        <SelectEditor options={GOAL} initial={effective?.goal ?? ''} saving={saving} onPick={(id) => commit({ goal: id })} />
      ) : field === 'activity' ? (
        <SelectEditor options={ACTIVITY} initial={effective?.activity_level ?? ''} saving={saving} onPick={(id) => commit({ activity: id })} />
      ) : field === 'diet' ? (
        <SelectEditor options={DIET} initial={effective?.dietary_styles?.[0] ?? ''} saving={saving} onPick={(id) => commit({ dietary: [id] })} />
      ) : field === 'training' ? (
        <TrainingEditor initial={effective?.training_types ?? []} saving={saving} onSave={(t) => commit({ training: t })} />
      ) : field === 'weight' ? (
        <WeightEditor unit={effective?.unit ?? 'imperial'} weightKg={effective?.weight_kg ?? null} saving={saving} onSave={(kg) => commit({ weightKg: kg })} />
      ) : field === 'height' ? (
        <HeightEditor unit={effective?.unit ?? 'imperial'} heightCm={effective?.height_cm ?? null} saving={saving} onSave={(cm) => commit({ heightCm: cm })} />
      ) : field === 'goalweight' ? (
        <WeightEditor unit={effective?.unit ?? 'imperial'} weightKg={effective?.goal_weight_kg ?? effective?.weight_kg ?? null} saving={saving} onSave={(kg) => commit({ goalWeightKg: kg })} />
      ) : (
        <BirthdateEditor initial={effective?.birth_date ?? null} saving={saving} onSave={(iso) => commit({ birthDate: iso })} />
      )}
    </ScreenBg>
  );
}

/** Full-width option row matching the onboarding select style. */
function OptionRow({ opt, on, onPress }: { opt: Opt; on: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
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
        {opt.icon ? <Icon name={opt.icon} size={24} color={theme.primary} stroke={1.9} /> : <Txt size={24}>{opt.emoji}</Txt>}
      </View>
      <View style={{ flex: 1 }}>
        <Txt w={800} size={17} color={theme.ink} style={{ letterSpacing: -0.1 }}>
          {opt.label}
        </Txt>
        {opt.desc && (
          <Txt w={500} size={13.5} color={theme.inkSec} style={{ marginTop: 2 }}>
            {opt.desc}
          </Txt>
        )}
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
}

/** Single-select that saves and exits on tap. */
function SelectEditor({ options, initial, saving, onPick }: { options: Opt[]; initial: string; saving: boolean; onPick: (id: string) => void }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 22, gap: 12 }} showsVerticalScrollIndicator={false}>
      {options.map((o, i) => (
        <Pop key={o.id} delay={i * 40}>
          <OptionRow opt={o} on={initial === o.id} onPress={() => !saving && onPick(o.id)} />
        </Pop>
      ))}
    </ScrollView>
  );
}

function TrainingEditor({ initial, saving, onSave }: { initial: string[]; saving: boolean; onSave: (t: string[]) => void }) {
  const [sel, setSel] = useState<string[]>(initial);
  const MAX = 3;
  const NONE = "I don't train";
  const count = sel.filter((x) => x !== NONE).length;
  const toggle = (id: string) => {
    haptics.selection();
    setSel((s) => {
      if (id === NONE) return s.includes(id) ? [] : [id];
      let next = s.filter((x) => x !== NONE);
      if (next.includes(id)) next = next.filter((x) => x !== id);
      else if (next.length < MAX) next = [...next, id];
      return next;
    });
  };
  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 12 }} showsVerticalScrollIndicator={false}>
        {TRAINING.map((o, i) => (
          <Pop key={o.id} delay={i * 30}>
            <OptionRow opt={o} on={sel.includes(o.id)} onPress={() => toggle(o.id)} />
          </Pop>
        ))}
      </ScrollView>
      <BottomDock>
        <PrimaryButton disabled={saving} onPress={() => onSave(sel)}>
          {saving ? 'Saving…' : `Save${count ? ` (${count})` : ''}`}
        </PrimaryButton>
      </BottomDock>
    </>
  );
}

function NameEditor({ initial, saving, onSave }: { initial: string; saving: boolean; onSave: (v: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <>
      <View style={{ paddingHorizontal: 22, paddingTop: 26 }}>
        <Field value={v} onChangeText={setV} placeholder="Your name" autoCapitalize="words" autoFocus />
      </View>
      <View style={{ flex: 1 }} />
      <BottomDock>
        <PrimaryButton disabled={saving} onPress={() => onSave(v)}>
          {saving ? 'Saving…' : 'Save'}
        </PrimaryButton>
      </BottomDock>
    </>
  );
}

function WeightEditor({ unit, weightKg, saving, onSave }: { unit: 'metric' | 'imperial'; weightKg: number | null; saving: boolean; onSave: (kg: number) => void }) {
  const metric = unit === 'metric';
  const seed = weightKg ? (metric ? Math.round(weightKg) : Math.round(weightKg / KG_PER_LB)) : metric ? 70 : 150;
  const [v, setV] = useState(clamp(seed, metric ? 30 : 60, metric ? 250 : 400));
  return (
    <WheelScreen saving={saving} onSave={() => onSave(metric ? v : v * KG_PER_LB)}>
      <WheelGroup>
        <Wheel items={metric ? KG : LB} value={v} onChange={setV} format={(x) => `${x} ${metric ? 'kg' : 'lb'}`} />
      </WheelGroup>
    </WheelScreen>
  );
}

function HeightEditor({ unit, heightCm, saving, onSave }: { unit: 'metric' | 'imperial'; heightCm: number | null; saving: boolean; onSave: (cm: number) => void }) {
  const metric = unit === 'metric';
  const totalIn = heightCm ? Math.round(heightCm / IN_PER_CM) : 68;
  const [cm, setCm] = useState(clamp(heightCm ? Math.round(heightCm) : 173, 100, 250));
  const [ft, setFt] = useState(clamp(Math.floor(totalIn / 12), 3, 8));
  const [inch, setInch] = useState(clamp(totalIn % 12, 0, 11));
  return (
    <WheelScreen saving={saving} onSave={() => onSave(metric ? cm : (ft * 12 + inch) * IN_PER_CM)}>
      {metric ? (
        <WheelGroup>
          <Wheel items={CM} value={cm} onChange={setCm} format={(x) => `${x} cm`} />
        </WheelGroup>
      ) : (
        <WheelGroup>
          <Wheel items={FT} value={ft} onChange={setFt} format={(x) => `${x} ft`} />
          <Wheel items={INCHES} value={inch} onChange={setInch} format={(x) => `${x} in`} />
        </WheelGroup>
      )}
    </WheelScreen>
  );
}

function BirthdateEditor({ initial, saving, onSave }: { initial: string | null; saving: boolean; onSave: (iso: string) => void }) {
  const parsed = initial ? new Date(`${initial}T00:00:00`) : null;
  const valid = parsed && !Number.isNaN(parsed.getTime());
  const [month, setMonth] = useState(valid ? MONTHS[parsed!.getMonth()] : 'January');
  const [day, setDay] = useState(valid ? parsed!.getDate() : 1);
  const [year, setYear] = useState(valid ? clamp(parsed!.getFullYear(), 1940, 2010) : 2000);
  const save = () => {
    const mm = String(MONTHS.indexOf(month) + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onSave(`${year}-${mm}-${dd}`);
  };
  return (
    <WheelScreen saving={saving} onSave={save}>
      <WheelGroup>
        <Wheel items={MONTHS} value={month} onChange={setMonth} />
        <Wheel items={DAYS} value={day} onChange={setDay} />
        <Wheel items={YEARS} value={year} onChange={setYear} />
      </WheelGroup>
    </WheelScreen>
  );
}

/** Shared layout for the wheel-based editors: centered wheel + Save dock. */
function WheelScreen({ children, saving, onSave }: { children: React.ReactNode; saving: boolean; onSave: () => void }) {
  return (
    <>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 22 }}>{children}</View>
      <BottomDock>
        <PrimaryButton disabled={saving} onPress={onSave}>
          {saving ? 'Saving…' : 'Save'}
        </PrimaryButton>
      </BottomDock>
    </>
  );
}
