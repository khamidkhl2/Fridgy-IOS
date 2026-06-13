/** Edit Profile — change onboarding answers later; recomputes targets on save. */
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { onboardingToProfile, updateProfile, type ProfileRow } from '@/lib/db';
import { useNav } from '@/lib/nav';
import { DIET_PRIMARY_GROUP, type OnboardingData } from '@/lib/onboarding';
import { useProfileRow } from '@/lib/profile';
import { ageFromISO, computeTargets } from '@/lib/targets';
import { useTheme } from '@/theme/ThemeProvider';

const GOALS = ['Lose weight', 'Build muscle', 'Maintain weight', 'Eat healthier'];
const ACTIVITIES = ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'];
const GENDERS = ['Male', 'Female', 'Prefer not to say'];
const DIETARY = [
  'No restrictions', 'Vegetarian', 'Vegan', 'Pescatarian', 'Flexitarian', 'Mediterranean',
  'Keto / Low-carb', 'Paleo', 'Gluten-free', 'Dairy-free', 'Halal', 'Kosher', 'Whole30', 'Low FODMAP',
];
const DIETARY_EXCLUSIVE = 'No restrictions';
// Primary eating patterns are mutually exclusive — picking one swaps out another.
const DIETARY_GROUPS: readonly (readonly string[])[] = [DIET_PRIMARY_GROUP];
const TRAINING = [
  'Weightlifting', 'Running', 'Cycling', 'Swimming', 'Yoga', 'Pilates', 'HIIT', 'CrossFit',
  'Boxing / MMA', 'Team sports', 'Tennis', 'Climbing', 'Rowing', 'Walking', 'Dance / Zumba',
  'Calisthenics', "I don't train",
];
const TRAINING_EXCLUSIVE = "I don't train";
const MAX_PICKS = 3; // cap on dietary styles / training types

const LBS_PER_KG = 2.2046226218;
const IN_PER_CM = 0.3937007874;

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { row, local, loading } = useProfileRow();

  // Build the effective profile from the DB row, falling back to the local
  // onboarding cache (the app often runs off this before the row loads).
  let effective: Partial<ProfileRow> | null = row;
  if (!effective && typeof local.height === 'number') {
    try {
      effective = onboardingToProfile(local as unknown as OnboardingData);
    } catch {
      effective = null;
    }
  }

  if (loading && !effective) {
    return (
      <ScreenBg>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </ScreenBg>
    );
  }

  return <EditForm effective={effective} />;
}

function EditForm({ effective }: { effective: Partial<ProfileRow> | null }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { session } = useAuth();
  const { refresh } = useProfileRow();

  const unit = effective?.unit ?? 'imperial';
  const metric = unit === 'metric';

  const [name, setName] = useState(effective?.name ?? '');
  const [gender, setGender] = useState(effective?.gender ?? '');
  const [goal, setGoal] = useState(effective?.goal ?? '');
  const [activity, setActivity] = useState(effective?.activity_level ?? '');
  const [dietary, setDietary] = useState<string[]>(effective?.dietary_styles ?? []);
  const [training, setTraining] = useState<string[]>(effective?.training_types ?? []);
  const [weight, setWeight] = useState(
    effective?.weight_kg ? String(Math.round(metric ? effective.weight_kg : effective.weight_kg * LBS_PER_KG)) : ''
  );
  const [height, setHeight] = useState(
    effective?.height_cm ? String(Math.round(metric ? effective.height_cm : effective.height_cm * IN_PER_CM)) : ''
  );
  const [age, setAge] = useState(() => {
    const a = ageFromISO(effective?.birth_date);
    return a != null ? String(a) : '';
  });
  const [saving, setSaving] = useState(false);

  // toggle with a mutually-exclusive id (e.g. "No restrictions"), optional
  // mutually-exclusive groups (a new pick swaps out a sibling), and a max cap;
  // deselecting is always allowed, adding past the cap is ignored.
  const toggleExclusive = (
    list: string[],
    id: string,
    exclusive: string,
    max: number,
    groups?: readonly (readonly string[])[]
  ): string[] => {
    if (id === exclusive) return list.includes(id) ? [] : [id];
    if (list.includes(id)) return list.filter((x) => x !== id);
    let base = list.filter((x) => x !== exclusive);
    const group = groups?.find((g) => g.includes(id));
    if (group) base = base.filter((x) => !group.includes(x)); // swap within the group
    if (base.length >= max) return list; // at cap — ignore
    return [...base, id];
  };

  const save = async () => {
    if (!session?.user) return;
    setSaving(true);

    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    const weightKg = metric ? w : w / LBS_PER_KG;
    const heightCm = metric ? h : h / IN_PER_CM;

    let birthDate = effective?.birth_date ?? null;
    if (a > 0 && a < 120) {
      const year = new Date().getFullYear() - a;
      const md = effective?.birth_date?.slice(4) ?? '-01-01';
      birthDate = `${year}${md}`;
    }

    const targets = computeTargets({
      gender: gender || null,
      weightKg: weightKg || null,
      heightCm: heightCm || null,
      age: a || null,
      activityLevel: activity || null,
      goal: goal || null,
      trainingTypes: training,
      dietaryStyles: dietary,
    });

    await updateProfile(session.user.id, {
      name: name.trim() || null,
      gender: gender || null,
      goal: goal || null,
      activity_level: activity || null,
      dietary_styles: dietary,
      training_types: training,
      unit,
      weight_kg: weightKg ? Math.round(weightKg * 10) / 10 : null,
      height_cm: heightCm ? Math.round(heightCm * 10) / 10 : null,
      birth_date: birthDate,
      calorie_target: targets?.calories ?? null,
      protein_target_g: targets?.protein ?? null,
      carb_target_g: targets?.carbs ?? null,
      fat_target_g: targets?.fat ?? null,
      onboarded: true,
    });

    refresh();
    setSaving(false);
    nav.back();
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
          Edit profile
        </Txt>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <Label>Name</Label>
        <Field value={name} onChangeText={setName} placeholder="Your name" autoCorrect={false} />

        <Label>Goal</Label>
        <Chips options={GOALS} value={goal} onSelect={setGoal} />

        <Label>Activity level</Label>
        <Chips options={ACTIVITIES} value={activity} onSelect={setActivity} />

        <Label>Gender</Label>
        <Chips options={GENDERS} value={gender} onSelect={setGender} />

        <Label>Body</Label>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <NumField label={metric ? 'Weight (kg)' : 'Weight (lb)'} value={weight} onChange={setWeight} />
          <NumField label={metric ? 'Height (cm)' : 'Height (in)'} value={height} onChange={setHeight} />
          <NumField label="Age" value={age} onChange={setAge} />
        </View>

        <Label>Dietary styles</Label>
        <MultiChips
          options={DIETARY}
          selected={dietary}
          max={MAX_PICKS}
          exclusive={DIETARY_EXCLUSIVE}
          groups={DIETARY_GROUPS}
          onToggle={(id) => setDietary((d) => toggleExclusive(d, id, DIETARY_EXCLUSIVE, MAX_PICKS, DIETARY_GROUPS))}
        />

        <Label>Training</Label>
        <MultiChips
          options={TRAINING}
          selected={training}
          max={MAX_PICKS}
          exclusive={TRAINING_EXCLUSIVE}
          onToggle={(id) => setTraining((t) => toggleExclusive(t, id, TRAINING_EXCLUSIVE, MAX_PICKS))}
        />
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 22,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16) + 6,
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <PrimaryButton onPress={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </PrimaryButton>
      </View>
    </ScreenBg>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Txt w={800} size={12.5} color={theme.inkSec} style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 22, marginBottom: 10 }}>
      {children}
    </Txt>
  );
}

function Chips({ options, value, onSelect }: { options: string[]; value: string; onSelect: (v: string) => void }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = value === o;
        return (
          <Pressable
            key={o}
            onPress={() => onSelect(o)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: on ? theme.primary : theme.border,
              backgroundColor: on ? theme.primary : theme.surface,
            }}
          >
            <Txt w={700} size={13.5} color={on ? theme.onPrimary : theme.ink}>
              {o}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function MultiChips({
  options,
  selected,
  onToggle,
  max,
  exclusive,
  groups,
}: {
  options: string[];
  selected: string[];
  onToggle: (id: string) => void;
  max?: number;
  exclusive?: string;
  groups?: readonly (readonly string[])[];
}) {
  const { theme } = useTheme();
  const count = selected.filter((x) => x !== exclusive).length;
  const atCap = max != null && count >= max;
  // A pick that swaps out a chosen sibling keeps the count flat — allow it at cap.
  const replacesSibling = (id: string) => {
    const group = groups?.find((g) => g.includes(id));
    return !!group && selected.some((s) => s !== id && group.includes(s));
  };
  return (
    <View>
      {max != null && (
        <Txt w={700} size={12.5} color={atCap ? theme.primary : theme.inkSec} style={{ marginBottom: 9 }}>
          {count} of {max} selected{atCap ? ' · max reached' : ''}
        </Txt>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => {
          const on = selected.includes(o);
          const blocked = !on && atCap && o !== exclusive && !replacesSibling(o);
          return (
            <Pressable
              key={o}
              onPress={() => onToggle(o)}
              disabled={blocked}
              style={{
                paddingVertical: 9,
                paddingHorizontal: 13,
                borderRadius: 12,
                opacity: blocked ? 0.4 : 1,
                borderWidth: 1.5,
                borderColor: on ? theme.primary : theme.border,
                backgroundColor: on ? theme.primarySoft : theme.surface,
              }}
            >
              <Txt w={700} size={13} color={on ? theme.primary : theme.ink}>
                {o}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Txt w={600} size={12} color={theme.inkSec} style={{ marginBottom: 6 }}>
        {label}
      </Txt>
      <Field value={value} onChangeText={onChange} keyboardType="numeric" placeholder="—" style={{ height: 52, fontSize: 16 }} />
    </View>
  );
}
