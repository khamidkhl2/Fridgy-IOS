/** Add-food modal — search USDA FoodData Central, pick a portion, log it to a meal. */
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field } from '@/components/Field';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import {
  addFoodLog,
  getEditLog,
  gramsToUnit,
  localDateISO,
  MEALS,
  stepGrams,
  updateFoodLog,
  useFoodUnit,
  type FoodLog,
  type FoodUnit,
  type MealType,
} from '@/lib/food';
import { useTheme } from '@/theme/ThemeProvider';
import { scaleMacros, searchFoods, type FoodHit } from '@/lib/usda';

/** Synthesize a search-hit shape from an existing log so the PortionEditor can
 *  re-scale it — per-100g macros are recovered from the stored amount. */
function hitFromLog(log: FoodLog): FoodHit {
  const q = log.quantity > 0 ? log.quantity : 100;
  const factor = 100 / q;
  return {
    fdcId: 0,
    name: log.name,
    per100g: {
      calories: log.calories * factor,
      protein: log.protein_g * factor,
      carbs: log.carbs_g * factor,
      fat: log.fat_g * factor,
    },
  };
}

const MEAL_KEYS = MEALS.map((m) => m.key) as MealType[];

export default function AddFoodScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [foodUnit] = useFoodUnit();
  const params = useLocalSearchParams<{ meal?: string; date?: string; edit?: string }>();

  // Edit mode: a logged food was handed off via setEditLog(). Read it once so a
  // re-render can't lose it; falls back to add mode if the holder is empty.
  const [editLog] = useState<FoodLog | null>(() => (params.edit === '1' ? getEditLog() : null));
  const isEdit = !!editLog;

  const meal: MealType = isEdit
    ? editLog!.meal_type
    : MEAL_KEYS.includes(params.meal as MealType)
      ? (params.meal as MealType)
      : 'snack';
  const mealLabel = MEALS.find((m) => m.key === meal)?.label ?? 'meal';
  const loggedOn = isEdit ? editLog!.logged_on : (params.date ?? localDateISO());

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const [selected, setSelected] = useState<FoodHit | null>(() =>
    editLog ? hitFromLog(editLog) : null
  );
  const [grams, setGrams] = useState(() => editLog?.quantity ?? 100);
  const [saving, setSaving] = useState(false);

  // debounced search — all state updates happen inside the timer/promise, never
  // synchronously in the effect body
  useEffect(() => {
    const q = query.trim();
    let live = true;
    const handle = setTimeout(() => {
      if (q.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      setError(null);
      searchFoods(q)
        .then((hits) => live && setResults(hits))
        .catch(
          (e) => live && setError(e instanceof Error ? e.message : 'Could not reach the food database.')
        )
        .finally(() => live && setSearching(false));
    }, 350);
    return () => {
      live = false;
      clearTimeout(handle);
    };
  }, [query, retryTick]);

  const preview = useMemo(
    () => (selected ? scaleMacros(selected.per100g, grams) : null),
    [selected, grams]
  );

  const pick = (hit: FoodHit) => {
    setSelected(hit);
    setGrams(hit.servingGrams ?? 100);
  };

  const save = async () => {
    if (!selected || !preview || !session?.user) return;
    setSaving(true);
    const ok = editLog
      ? !!(await updateFoodLog(editLog.id, { grams, macros: preview }))
      : !!(await addFoodLog({
          userId: session.user.id,
          loggedOn,
          mealType: meal,
          name: selected.name,
          macros: preview,
          grams,
          source: 'manual',
        }));
    setSaving(false);
    if (!ok) {
      Alert.alert(
        editLog ? 'Could not save changes' : 'Could not add food',
        'Please check your connection and try again.'
      );
      return;
    }
    router.back();
  };

  return (
    <ScreenBg>
      <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
        {/* header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 18,
            paddingBottom: 8,
          }}
        >
          <Pressable
            onPress={() => (selected && !isEdit ? setSelected(null) : router.back())}
            accessibilityRole="button"
            accessibilityLabel={selected && !isEdit ? 'Back to search' : 'Close'}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: theme.surface,
              borderWidth: 1.5,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="chevronLeft" size={20} color={theme.ink} stroke={2.2} />
          </Pressable>
          <H size={22}>{isEdit ? 'Edit portion' : selected ? 'Portion' : `Add to ${mealLabel}`}</H>
        </View>

        {selected ? (
          <PortionEditor
            hit={selected}
            grams={grams}
            setGrams={setGrams}
            unit={foodUnit}
            preview={preview!}
            ctaLabel={isEdit ? 'Save changes' : `Add to ${mealLabel}`}
            savingLabel={isEdit ? 'Saving…' : 'Adding…'}
            saving={saving}
            onSave={save}
            insetBottom={insets.bottom}
          />
        ) : (
          <>
            <View style={{ paddingHorizontal: 18, paddingTop: 4 }}>
              <Field
                value={query}
                onChangeText={setQuery}
                placeholder="Search foods — e.g. greek yogurt"
                autoFocus
                autoCorrect={false}
                returnKeyType="search"
              />
              <Pressable
                onPress={() => router.push(`/scan-meal?meal=${meal}&date=${loggedOn}` as Href)}
                accessibilityRole="button"
                accessibilityLabel="Scan a meal with the camera"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                  marginTop: 10,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: theme.primarySoft,
                }}
              >
                <Icon name="camera" size={18} color={theme.primary} stroke={2} />
                <Txt w={700} size={14.5} color={theme.primary}>
                  Scan a meal with camera
                </Txt>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 18, paddingTop: 14, paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
            >
              {searching && <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />}
              {error && (
                <View style={{ alignItems: 'center', marginTop: 24, gap: 14 }}>
                  <Txt w={600} size={14} color={theme.protein} style={{ textAlign: 'center', lineHeight: 20 }}>
                    {error}
                  </Txt>
                  <Pressable
                    onPress={() => setRetryTick((t) => t + 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Try search again"
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 22,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                    }}
                  >
                    <Txt w={700} size={14} color={theme.ink}>
                      Try again
                    </Txt>
                  </Pressable>
                </View>
              )}
              {!searching && !error && query.trim().length >= 2 && results.length === 0 && (
                <Txt w={600} size={14} color={theme.inkSec} style={{ textAlign: 'center', marginTop: 20 }}>
                  No matches — try another name.
                </Txt>
              )}
              {results.map((hit) => (
                <ResultRow key={hit.fdcId} hit={hit} onPress={() => pick(hit)} />
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </ScreenBg>
  );
}

function ResultRow({ hit, onPress }: { hit: FoodHit; onPress: () => void }) {
  const { theme } = useTheme();
  const per = hit.servingGrams
    ? scaleMacros(hit.per100g, hit.servingGrams)
    : hit.per100g;
  const amount = hit.servingGrams ? `${hit.servingGrams} g serving` : 'per 100 g';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${hit.name}${hit.brand ? `, ${hit.brand}` : ''}, ${per.calories} calories ${amount}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 13,
        marginBottom: 10,
        backgroundColor: theme.surface,
        borderRadius: 16,
        boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="apple" size={22} color={theme.primary} stroke={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt w={800} size={15} color={theme.ink} numberOfLines={1}>
          {hit.name}
        </Txt>
        <Txt w={500} size={12.5} color={theme.inkSec} numberOfLines={1} style={{ marginTop: 2 }}>
          {hit.brand ? `${hit.brand} · ` : ''}
          {per.calories} cal · {amount}
        </Txt>
      </View>
      <View style={{ transform: [{ scaleX: -1 }] }}>
        <Icon name="chevronLeft" size={18} color={theme.inkSec} stroke={2} />
      </View>
    </Pressable>
  );
}

function PortionEditor({
  hit,
  grams,
  setGrams,
  unit,
  preview,
  ctaLabel,
  savingLabel,
  saving,
  onSave,
  insetBottom,
}: {
  hit: FoodHit;
  grams: number;
  setGrams: (g: number) => void;
  unit: FoodUnit;
  preview: { calories: number; protein: number; carbs: number; fat: number };
  ctaLabel: string;
  savingLabel: string;
  saving: boolean;
  onSave: () => void;
  insetBottom: number;
}) {
  const { theme } = useTheme();
  const inc = stepGrams(unit);
  const step = (dir: number) => setGrams(Math.max(5, grams + dir * inc));
  const unitLabel = unit === 'oz' ? 'ounces' : 'grams';
  const stepLabel = unit === 'oz' ? '1 ounce' : '10 grams'; // for the stepper a11y label

  const macros: { label: string; value: number; color: string }[] = [
    { label: 'Protein', value: preview.protein, color: theme.protein },
    { label: 'Carbs', value: preview.carbs, color: theme.carbs },
    { label: 'Fat', value: preview.fat, color: theme.fat },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 22, paddingBottom: insetBottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Txt w={800} size={20} color={theme.ink} style={{ marginBottom: 4 }}>
        {hit.name}
      </Txt>
      {hit.brand ? (
        <Txt w={500} size={13.5} color={theme.inkSec}>
          {hit.brand}
        </Txt>
      ) : null}

      {/* calories */}
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <Txt w={800} size={48} color={theme.ink} style={{ letterSpacing: -1.5, fontVariant: ['tabular-nums'] }}>
          {preview.calories}
        </Txt>
        <Txt w={600} size={14} color={theme.inkSec} style={{ marginTop: 2 }}>
          calories
        </Txt>
      </View>

      {/* grams stepper */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          marginTop: 24,
        }}
      >
        <StepBtn kind="dec" amountLabel={stepLabel} onPress={() => step(-1)} />
        <View style={{ alignItems: 'center', minWidth: 96 }}>
          <Txt w={800} size={30} color={theme.ink} style={{ fontVariant: ['tabular-nums'] }}>
            {gramsToUnit(grams, unit)}
          </Txt>
          <Txt w={600} size={13} color={theme.inkSec}>
            {unitLabel}
          </Txt>
        </View>
        <StepBtn kind="inc" amountLabel={stepLabel} onPress={() => step(1)} />
      </View>

      {hit.servingGrams ? (
        <Pressable onPress={() => setGrams(hit.servingGrams!)} style={{ alignSelf: 'center', marginTop: 12 }}>
          <Txt w={700} size={13.5} color={theme.primary}>
            Reset to {gramsToUnit(hit.servingGrams, unit)} {unit} serving
          </Txt>
        </Pressable>
      ) : null}

      {/* macro preview */}
      <View style={{ flexDirection: 'row', gap: 11, marginTop: 26 }}>
        {macros.map((m) => (
          <View
            key={m.label}
            style={{
              flex: 1,
              backgroundColor: theme.surface,
              borderRadius: 16,
              paddingVertical: 15,
              alignItems: 'center',
              boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
            }}
          >
            <Txt w={800} size={20} color={m.color}>
              {m.value}g
            </Txt>
            <Txt w={600} size={12} color={theme.inkSec} style={{ marginTop: 3 }}>
              {m.label}
            </Txt>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 28 }}>
        <PrimaryButton onPress={onSave} disabled={saving}>
          {saving ? savingLabel : ctaLabel}
        </PrimaryButton>
      </View>
    </ScrollView>
  );
}

function StepBtn({ kind, amountLabel, onPress }: { kind: 'inc' | 'dec'; amountLabel: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={kind === 'inc' ? `Increase portion by ${amountLabel}` : `Decrease portion by ${amountLabel}`}
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: theme.surface,
        borderWidth: 1.5,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {kind === 'inc' ? (
        <Icon name="plus" size={22} color={theme.ink} stroke={2.4} />
      ) : (
        <View style={{ width: 20, height: 2.6, borderRadius: 2, backgroundColor: theme.ink }} />
      )}
    </Pressable>
  );
}
