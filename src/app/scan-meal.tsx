/** Meal scan — photograph a plate, AI estimates nutrition, log it to the day. */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, Image, Keyboard, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Blink, Scanline } from '@/components/anim';
import { Field } from '@/components/Field';
import { GlassBtn } from '@/components/GlassBtn';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { capturePhoto } from '@/lib/camera';
import { addFoodLog, localDateISO, MEALS, type MealType } from '@/lib/food';
import { useKeyboardHeight } from '@/lib/keyboard';
import { scanMeal, type MealItem } from '@/lib/meal';
import { useNav } from '@/lib/nav';
import { useTheme } from '@/theme/ThemeProvider';

type Phase = 'idle' | 'scanning' | 'done';

/** Sensible default meal for the current time of day. */
function defaultMeal(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export default function ScanMealScreen() {
  const { theme } = useTheme();
  const nav = useNav();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  // Launched from add-food with a target meal/date; otherwise fall back to today
  // and a time-of-day default.
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const paramMeal = MEALS.find((m) => m.key === params.meal)?.key;

  const cameraRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [items, setItems] = useState<MealItem[]>([]);
  const [meal, setMeal] = useState<MealType>(() => paramMeal ?? defaultMeal());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const kb = useKeyboardHeight();
  const sheetLift = kb > 0 ? -Math.max(0, kb - insets.bottom) : 0;

  // keep the description on rescan (so a hint can be tweaked, not retyped)
  const reset = () => {
    setPhase('idle');
    setCapturedUri(null);
    setCapturedBase64(null);
    setItems([]);
    setError(null);
  };

  const shoot = async () => {
    if (phase === 'scanning' || !cameraRef.current || !ready) return;
    Keyboard.dismiss();
    setError(null);
    setPhase('scanning');
    try {
      const { previewUri, base64 } = await capturePhoto(cameraRef.current);
      // Freeze the captured shot — no need to keep holding the camera still.
      setCapturedUri(previewUri);
      setCapturedBase64(base64);
      const detected = await scanMeal(base64, note);
      setItems(detected);
      setPhase('done');
    } catch (e) {
      setCapturedUri(null);
      setCapturedBase64(null);
      setError(e instanceof Error ? e.message : 'Could not analyze your meal. Try again.');
      setPhase('idle');
    }
  };

  // Re-run the estimate on the same photo with the edited description — lets the
  // user correct the AI's read without taking a new picture.
  const refine = async () => {
    if (!capturedBase64 || refining) return;
    Keyboard.dismiss();
    setRefining(true);
    setError(null);
    try {
      setItems(await scanMeal(capturedBase64, note));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the estimate. Try again.');
    } finally {
      setRefining(false);
    }
  };

  const logMeal = async () => {
    if (!session?.user || items.length === 0) return;
    setSaving(true);
    const userId = session.user.id;
    const loggedOn = params.date ?? localDateISO();
    const results = await Promise.all(
      items.map((it) =>
        addFoodLog({
          userId,
          loggedOn,
          mealType: meal,
          name: it.name,
          macros: { calories: it.calories, protein: it.protein, carbs: it.carbs, fat: it.fat },
          grams: it.grams || 1,
          source: 'scan',
        })
      )
    );
    setSaving(false);
    if (results.every((r) => r === null)) {
      Alert.alert('Could not log meal', 'Please check your connection and try again.');
      return;
    }
    nav.go('home');
  };

  // ── permission gate ────────────────────────────────────────────────────────
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#141513' }} />;
  }
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#141513', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 }}>
        <StatusBar style="light" />
        <View style={{ position: 'absolute', top: insets.top + 4, left: 20, zIndex: 20 }}>
          <GlassBtn icon="close" label="Close" onPress={() => nav.back()} />
        </View>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 22,
          }}
        >
          <Icon name="camera" size={32} color="#fff" stroke={1.7} />
        </View>
        <H size={26} style={{ textAlign: 'center', color: '#fff' }}>
          Camera access needed
        </H>
        <Txt w={500} size={15} color="rgba(255,255,255,0.7)" style={{ textAlign: 'center', marginTop: 12, marginBottom: 28, lineHeight: 22 }}>
          Fridgy uses your camera to estimate the calories and macros in your meal.
        </Txt>
        <View style={{ width: '100%' }}>
          <PrimaryButton onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}>
            {permission.canAskAgain ? 'Allow camera' : 'Open settings'}
          </PrimaryButton>
        </View>
      </View>
    );
  }

  // ── camera + review UI ─────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#141513', overflow: 'hidden' }}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }} onCameraReady={() => setReady(true)} />
      {/* frozen captured frame shown over the live feed once a shot is taken */}
      {capturedUri && (
        <Image source={{ uri: capturedUri }} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
        locations={[0, 0.22, 0.6, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* top controls */}
      <View style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 20 }}>
        <GlassBtn icon="close" label="Close" onPress={() => nav.back()} />
        <GlassBtn
          icon="help"
          label="Scanning tips"
          onPress={() =>
            Alert.alert(
              'Scanning tips',
              '• Frame the whole plate from above\n• Make sure the food is well lit\n• Get close enough to see each item\n• Add a description for anything hard to see — portion size, hidden ingredients, how it was cooked\n\nEstimates are approximate — you can edit any item after logging.'
            )
          }
        />
      </View>

      {/* status pill while framing / analyzing */}
      {phase !== 'done' && (
        <View style={{ position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22, backgroundColor: 'rgba(20,20,18,0.55)' }}>
            <Blink style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent }} />
            <Txt w={700} size={13} color="#fff">
              {phase === 'scanning' ? 'Analyzing…' : 'Center your meal in frame'}
            </Txt>
          </View>
        </View>
      )}
      {phase === 'scanning' && (
        <View style={{ position: 'absolute', top: '30%', left: '10%', right: '10%', height: '34%', zIndex: 10 }}>
          <Scanline color={theme.primary} duration={1400} thickness={3} />
        </View>
      )}

      {/* bottom sheet */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          backgroundColor: theme.surface,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          paddingTop: 12,
          paddingHorizontal: 22,
          paddingBottom: Math.max(insets.bottom, 16) + 14,
          boxShadow: '0px -14px 40px -10px rgba(0,0,0,0.3)',
          transform: [{ translateY: sheetLift }],
        }}
      >
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: theme.track, alignSelf: 'center', marginBottom: 16 }} />

        {phase === 'done' ? (
          <ReviewSheet
            items={items}
            meal={meal}
            setMeal={setMeal}
            saving={saving}
            note={note}
            setNote={setNote}
            refining={refining}
            onRefine={refine}
            onLog={logMeal}
            onRescan={reset}
            onRemove={(i) => setItems((d) => d.filter((_, idx) => idx !== i))}
          />
        ) : (
          <View style={{ alignItems: 'center' }}>
            <H size={25}>{phase === 'scanning' ? 'Analyzing…' : 'Scan your meal'}</H>
            <Txt w={500} size={14} color={theme.inkSec} style={{ marginTop: 5, marginBottom: 18, textAlign: 'center' }}>
              {phase === 'scanning'
                ? 'Estimating calories and macros — one moment'
                : 'Point at your plate, then tap'}
            </Txt>
            {phase === 'idle' && (
              <Field
                value={note}
                onChangeText={setNote}
                placeholder="Describe it for a better estimate (optional)"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                maxLength={300}
                style={{ width: '100%', height: 50, fontSize: 14.5, backgroundColor: theme.bg, marginBottom: 18 }}
              />
            )}
            {error && (
              <Txt w={600} size={13.5} color={theme.protein} style={{ marginBottom: 14, textAlign: 'center', lineHeight: 19 }}>
                {error}
              </Txt>
            )}
            <Pressable
              onPress={shoot}
              disabled={phase === 'scanning' || !ready}
              accessibilityRole="button"
              accessibilityLabel={phase === 'scanning' ? 'Analyzing your meal' : 'Take photo of your meal'}
              accessibilityState={{ disabled: phase === 'scanning' || !ready, busy: phase === 'scanning' }}
              style={{
                width: 78,
                height: 78,
                borderRadius: 39,
                borderWidth: 4,
                borderColor: theme.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: phase === 'scanning' || !ready ? 0.6 : 1,
              }}
            >
              <View style={{ width: 60, height: 60, borderRadius: phase === 'scanning' ? 16 : 30, backgroundColor: theme.primary, boxShadow: `0px 6px 16px -6px ${theme.primary}` }} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

/** Description field + "Update estimate" button — re-runs the AI on the same
 *  photo with the typed hint. Shown in both the normal and empty review states. */
function RefineRow({
  note,
  setNote,
  refining,
  onRefine,
  placeholder,
}: {
  note: string;
  setNote: (v: string) => void;
  refining: boolean;
  onRefine: () => void;
  placeholder: string;
}) {
  const { theme } = useTheme();
  return (
    <>
      <Field
        value={note}
        onChangeText={setNote}
        placeholder={placeholder}
        returnKeyType="done"
        onSubmitEditing={onRefine}
        maxLength={300}
        style={{ height: 48, fontSize: 14, backgroundColor: theme.bg, marginBottom: 8 }}
      />
      <Pressable
        onPress={onRefine}
        disabled={refining || !note.trim()}
        accessibilityRole="button"
        accessibilityLabel="Update estimate from your description"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          height: 46,
          borderRadius: 14,
          marginBottom: 14,
          backgroundColor: theme.primarySoft,
          opacity: refining || !note.trim() ? 0.5 : 1,
        }}
      >
        <Icon name="sparkle" size={15} color={theme.primary} stroke={1.6} fill={theme.primary} />
        <Txt w={700} size={14} color={theme.primary}>
          {refining ? 'Updating…' : 'Update estimate'}
        </Txt>
      </Pressable>
    </>
  );
}

function ReviewSheet({
  items,
  meal,
  setMeal,
  saving,
  note,
  setNote,
  refining,
  onRefine,
  onLog,
  onRescan,
  onRemove,
}: {
  items: MealItem[];
  meal: MealType;
  setMeal: (m: MealType) => void;
  saving: boolean;
  note: string;
  setNote: (v: string) => void;
  refining: boolean;
  onRefine: () => void;
  onLog: () => void;
  onRescan: () => void;
  onRemove: (index: number) => void;
}) {
  const { theme } = useTheme();
  const empty = items.length === 0;
  const totalCal = items.reduce((s, it) => s + it.calories, 0);
  const mealLabel = MEALS.find((m) => m.key === meal)?.label ?? 'meal';

  if (empty) {
    return (
      <View>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <H size={25}>No food detected</H>
          <Txt w={500} size={14} color={theme.inkSec} style={{ marginTop: 5, textAlign: 'center', lineHeight: 20 }}>
            Describe the meal below to try again, or rescan with the whole plate in frame.
          </Txt>
        </View>
        <RefineRow
          note={note}
          setNote={setNote}
          refining={refining}
          onRefine={onRefine}
          placeholder="Describe the meal (optional)"
        />
        <PrimaryButton onPress={onRescan}>Scan again</PrimaryButton>
      </View>
    );
  }

  return (
    <View>
      <View style={{ alignItems: 'center', marginBottom: 14 }}>
        <Txt w={800} size={40} color={theme.ink} style={{ letterSpacing: -1.2, fontVariant: ['tabular-nums'] }}>
          {totalCal.toLocaleString()}
        </Txt>
        <Txt w={600} size={13.5} color={theme.inkSec} style={{ marginTop: 2 }}>
          calories · {items.length} item{items.length > 1 ? 's' : ''}
        </Txt>
      </View>

      {/* meal picker */}
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
        {MEALS.map((m) => {
          const on = meal === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMeal(m.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 13,
                borderRadius: 11,
                backgroundColor: on ? theme.primary : theme.bg,
                borderWidth: 1.5,
                borderColor: on ? theme.primary : theme.border,
              }}
            >
              <Txt w={700} size={12.5} color={on ? theme.onPrimary : theme.ink}>
                {m.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {/* detected items */}
      <ScrollView style={{ maxHeight: 188 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8, marginBottom: 18 }}>
          {items.map((it, i) => (
            <View
              key={`${it.name}-${i}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.bg, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 13 }}
            >
              <View style={{ flex: 1 }}>
                <Txt w={700} size={14.5} color={theme.ink} numberOfLines={1}>
                  {it.name}
                </Txt>
                <Txt w={500} size={12.5} color={theme.inkSec} style={{ marginTop: 2 }}>
                  {it.grams > 0 ? `${it.grams} g · ` : ''}
                  {it.protein}p · {it.carbs}c · {it.fat}f
                </Txt>
              </View>
              <Txt w={700} size={14} color={theme.ink} style={{ fontVariant: ['tabular-nums'] }}>
                {it.calories}
              </Txt>
              <Pressable
                onPress={() => onRemove(i)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${it.name}`}
                hitSlop={8}
                style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface }}
              >
                <Icon name="close" size={13} color={theme.inkSec} stroke={2.4} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* refine the estimate with a description — no need to re-shoot */}
      <RefineRow
        note={note}
        setNote={setNote}
        refining={refining}
        onRefine={onRefine}
        placeholder="Not quite right? Describe it (optional)"
      />

      <Txt w={500} size={11.5} color={theme.inkSec} style={{ textAlign: 'center', marginBottom: 12, lineHeight: 16 }}>
        Calorie and macro values are AI estimates. You can edit any item after logging.
      </Txt>
      <PrimaryButton onPress={onLog} disabled={saving || refining}>
        {saving ? 'Logging…' : `Log to ${mealLabel}`}
      </PrimaryButton>
      <Pressable onPress={onRescan} style={{ paddingVertical: 8, marginTop: 12 }}>
        <Txt w={700} size={14.5} color={theme.inkSec} style={{ textAlign: 'center' }}>
          Scan again
        </Txt>
      </Pressable>
    </View>
  );
}
