/** Recipe detail + animated step-by-step cooking mode. */
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pop } from '@/components/anim';
import { H } from '@/components/Headline';
import { Icon, type IconName } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { addFoodLog, localDateISO, MEALS, type MealType } from '@/lib/food';
import { useNav } from '@/lib/nav';
import { getActiveRecipe, type RecipeView } from '@/lib/recipes';
import { useTheme } from '@/theme/ThemeProvider';

const MEAL_KEYS = MEALS.map((m) => m.key) as MealType[];

/** Map a recipe's display meal type ("Breakfast") to a food-log key. */
function toMealKey(s: string): MealType {
  const k = s.toLowerCase() as MealType;
  return MEAL_KEYS.includes(k) ? k : 'dinner';
}

const MEAL_ICON: Record<string, IconName> = {
  Breakfast: 'leaf',
  Lunch: 'drumstick',
  Dinner: 'wheat',
  Snack: 'apple',
};

export default function RecipeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const recipe = getActiveRecipe();
  const { session } = useAuth();
  const nav = useNav();

  const [cooking, setCooking] = useState(false);
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  // Write the finished recipe's per-serving macros to today's food log, then
  // jump to Home so the user sees it counted. Returns false so the finish
  // screen can surface a failure (e.g. offline) instead of navigating away.
  const logMeal = async (meal: MealType): Promise<boolean> => {
    if (!recipe || !session?.user) return false;
    const row = await addFoodLog({
      userId: session.user.id,
      loggedOn: localDateISO(),
      mealType: meal,
      name: recipe.title,
      macros: {
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
      },
      grams: 1, // one serving
      source: 'recipe',
    });
    if (row) nav.go('home');
    return !!row;
  };

  if (!recipe) {
    return (
      <ScreenBg>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <Txt w={600} size={15} color={theme.inkSec} style={{ textAlign: 'center', marginBottom: 18 }}>
            This recipe is no longer available.
          </Txt>
          <View style={{ width: '100%' }}>
            <PrimaryButton onPress={() => router.back()}>Back</PrimaryButton>
          </View>
        </View>
      </ScreenBg>
    );
  }

  if (cooking) {
    return (
      <CookingMode
        recipe={recipe}
        step={step}
        setStep={setStep}
        onExit={() => setCooking(false)}
        onDone={() => router.back()}
        onLog={logMeal}
      />
    );
  }

  const icon = MEAL_ICON[recipe.mealType] ?? 'leaf';

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* hero */}
        <View
          style={{
            height: 230 + insets.top,
            paddingTop: insets.top + 8,
            backgroundColor: theme.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: insets.top + 6,
              left: 18,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.surface,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0px 2px 8px rgba(30,28,24,0.10)',
              }}
            >
              <Icon name="chevronLeft" size={20} color={theme.ink} stroke={2.2} />
            </Pressable>
          </View>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              backgroundColor: theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size={44} color={theme.onPrimary} stroke={1.6} />
          </View>
        </View>

        {/* title + meta */}
        <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 8,
              backgroundColor: theme.bg,
              marginBottom: 10,
            }}
          >
            <Txt w={800} size={11} color={theme.inkSec} style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {recipe.mealType}
            </Txt>
          </View>
          <H size={28} style={{ letterSpacing: -0.3 }}>
            {recipe.title}
          </H>

          <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
            {recipe.minutes > 0 && <Meta icon="flame" label={`${recipe.minutes} min`} />}
            {recipe.calories > 0 && <Meta icon="scale" label={`${recipe.calories} cal`} />}
            {recipe.usesCount > 0 && <Meta icon="fridge" label={`Uses ${recipe.usesCount}`} />}
          </View>

          {recipe.description ? (
            <Txt w={500} size={14.5} color={theme.inkSec} style={{ lineHeight: 22, marginTop: 16 }}>
              {recipe.description}
            </Txt>
          ) : null}
        </View>

        {/* ingredients (tap to check off) */}
        {recipe.ingredients.length > 0 && (
          <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
            <H size={20} style={{ marginBottom: 6 }}>
              Ingredients
            </H>
            <Txt w={500} size={12} color={theme.inkSec} style={{ marginBottom: 12, lineHeight: 17 }}>
              AI-generated — double-check ingredients and quantities, especially for allergens.
            </Txt>
            <View style={{ gap: 4 }}>
              {recipe.ingredients.map((ing, i) => {
                const on = checked[i];
                return (
                  <Pressable
                    key={i}
                    onPress={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: !!on }}
                    accessibilityLabel={`${ing.name}${ing.quantity ? `, ${ing.quantity}` : ''}${!ing.have ? ', need to buy' : ''}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? theme.primary : 'transparent',
                        borderWidth: on ? 0 : 1.5,
                        borderColor: theme.border,
                      }}
                    >
                      {on && <Icon name="check" size={14} color={theme.onPrimary} stroke={2.6} />}
                    </View>
                    <Txt
                      w={600}
                      size={14.5}
                      color={on ? theme.inkSec : theme.ink}
                      style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none' }}
                    >
                      {ing.name}
                      {ing.quantity ? ` · ${ing.quantity}` : ''}
                    </Txt>
                    {!ing.have && (
                      <Txt w={700} size={11} color={theme.accent} style={{ textTransform: 'uppercase', letterSpacing: 0.3 }}>
                        Need
                      </Txt>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* sticky start button */}
      {recipe.steps.length > 0 && (
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
          <PrimaryButton
            onPress={() => {
              setStep(0);
              setCooking(true);
            }}
          >
            Start cooking · {recipe.steps.length} steps
          </PrimaryButton>
        </View>
      )}
    </ScreenBg>
  );
}

function Meta({ icon, label }: { icon: IconName; label: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={16} color={theme.primary} stroke={1.8} />
      <Txt w={700} size={13.5} color={theme.ink}>
        {label}
      </Txt>
    </View>
  );
}

function CookingMode({
  recipe,
  step,
  setStep,
  onExit,
  onDone,
  onLog,
}: {
  recipe: RecipeView;
  step: number;
  setStep: (n: number) => void;
  onExit: () => void;
  onDone: () => void;
  onLog: (meal: MealType) => Promise<boolean>;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const total = recipe.steps.length;
  const finished = step >= total;
  const pct = finished ? 100 : Math.round(((step + 1) / total) * 100);

  const [meal, setMeal] = useState<MealType>(() => toMealKey(recipe.mealType));
  const [logging, setLogging] = useState(false);

  const handleLog = async () => {
    setLogging(true);
    const ok = await onLog(meal); // navigates Home on success
    if (!ok) {
      setLogging(false);
      Alert.alert('Could not log meal', 'Please check your connection and try again.');
    }
  };

  return (
    <ScreenBg>
      <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
        {/* top bar: close + progress */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
          <Pressable
            onPress={onExit}
            accessibilityRole="button"
            accessibilityLabel="Close cooking mode"
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
            <Icon name="close" size={18} color={theme.ink} stroke={2.2} />
          </Pressable>
          <View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: theme.track, overflow: 'hidden' }}>
            <View style={{ width: `${pct}%`, height: '100%', backgroundColor: theme.primary, borderRadius: 4 }} />
          </View>
        </View>

        {finished ? (
          <Pop key="done" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: theme.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 26,
              }}
            >
              <Icon name="check" size={48} color={theme.primary} stroke={2.4} />
            </View>
            <H size={30} style={{ textAlign: 'center' }}>
              Enjoy your meal!
            </H>
            <Txt w={500} size={15} color={theme.inkSec} style={{ textAlign: 'center', marginTop: 10, lineHeight: 22 }}>
              You finished {recipe.title}.
            </Txt>

            {/* log it to today's totals */}
            <View style={{ marginTop: 30, width: '100%' }}>
              <Txt
                w={800}
                size={12}
                color={theme.inkSec}
                style={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}
              >
                Log it to your day
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {MEALS.map((m) => {
                  const on = meal === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => setMeal(m.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={{
                        paddingVertical: 9,
                        paddingHorizontal: 15,
                        borderRadius: 12,
                        backgroundColor: on ? theme.primary : theme.surface,
                        borderWidth: 1.5,
                        borderColor: on ? theme.primary : theme.border,
                      }}
                    >
                      <Txt w={700} size={13.5} color={on ? theme.onPrimary : theme.ink}>
                        {m.label}
                      </Txt>
                    </Pressable>
                  );
                })}
              </View>
              {recipe.calories > 0 && (
                <Txt w={600} size={13} color={theme.inkSec} style={{ textAlign: 'center', marginTop: 14 }}>
                  {recipe.calories} cal · {recipe.protein}p · {recipe.carbs}c · {recipe.fat}f
                </Txt>
              )}
            </View>
          </Pop>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30 }}>
            <Pop key={step}>
              <Txt w={800} size={13} color={theme.primary} style={{ textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Step {step + 1} of {total}
              </Txt>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: theme.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 18,
                  marginBottom: 22,
                }}
              >
                <Txt style={{ fontFamily: theme.headlineFamily, fontSize: 30, color: theme.primary }}>
                  {step + 1}
                </Txt>
              </View>
              <Txt w={500} size={22} color={theme.ink} style={{ lineHeight: 32 }}>
                {recipe.steps[step]}
              </Txt>
            </Pop>
          </View>
        )}

        {/* controls */}
        {finished ? (
          <View
            style={{
              paddingHorizontal: 22,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16) + 6,
              gap: 4,
            }}
          >
            <PrimaryButton onPress={handleLog} disabled={logging}>
              {logging ? 'Logging…' : 'Log this meal'}
            </PrimaryButton>
            <Pressable
              onPress={onDone}
              accessibilityRole="button"
              accessibilityLabel="Don't log this meal"
              style={{ alignItems: 'center', paddingVertical: 12 }}
            >
              <Txt w={700} size={14} color={theme.inkSec}>
                Not now
              </Txt>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 22,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16) + 6,
            }}
          >
            {step > 0 && (
              <Pressable
                onPress={() => setStep(step - 1)}
                accessibilityRole="button"
                accessibilityLabel="Previous step"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="chevronLeft" size={22} color={theme.ink} stroke={2.2} />
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              <PrimaryButton onPress={() => setStep(step + 1)}>
                {step === total - 1 ? 'Finish' : 'Next step'}
              </PrimaryButton>
            </View>
          </View>
        )}
      </View>
    </ScreenBg>
  );
}
