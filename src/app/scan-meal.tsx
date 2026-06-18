/** Meal scan — photograph a plate, AI estimates nutrition, log it to the day. */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Animated, Dimensions, Image, Keyboard, Linking, PanResponder, Pressable, ScrollView, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Blink, Scanline } from '@/components/anim';
import { Brackets } from '@/components/Brackets';
import { Field } from '@/components/Field';
import { GlassBtn } from '@/components/GlassBtn';
import { GalleryButton, ScanModeSelector, Shutter, TorchButton } from '@/components/ScanControls';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { capturePhoto, pickFromLibrary } from '@/lib/camera';
import { addFoodLog, localDateISO, MEALS, type MealType } from '@/lib/food';
import { useKeyboardHeight } from '@/lib/keyboard';
import { scanMeal, type MealItem } from '@/lib/meal';
import { useNav } from '@/lib/nav';
import { useTheme } from '@/theme/ThemeProvider';

type Phase = 'idle' | 'review' | 'scanning' | 'done';

// How far the review sheet can be dragged down to peek at the captured photo.
const SCREEN_H = Dimensions.get('window').height;
const SHEET_PEEK = Math.min(380, SCREEN_H * 0.45);
const clampPeek = (y: number) => Math.min(SHEET_PEEK, Math.max(0, y));

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
  const isFocused = useIsFocused();

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
  const [torch, setTorch] = useState(false);
  const kb = useKeyboardHeight();
  const sheetLift = kb > 0 ? -Math.max(0, kb - insets.bottom) : 0;

  // Drag-to-peek: pulling the sheet's handle down slides it off-screen to reveal
  // the photo behind it; releasing snaps it back open or to the peeked position.
  const [dragY] = useState(() => new Animated.Value(0));
  // `peeked` is the sheet's settled state; the drag starts from its position.
  const [peeked, setPeeked] = useState(false);
  const settle = (next: boolean) => {
    setPeeked(next);
    Animated.spring(dragY, { toValue: next ? SHEET_PEEK : 0, useNativeDriver: true, bounciness: 3, speed: 14 }).start();
  };
  // Recreated each render so the closures capture the current `peeked` base.
  const base = peeked ? SHEET_PEEK : 0;
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => dragY.setValue(clampPeek(base + g.dy)),
    onPanResponderRelease: (_, g) => settle(clampPeek(base + g.dy) > SHEET_PEEK * 0.4 || g.vy > 0.6),
  });

  // back to the live camera (keeps the description so a hint can be tweaked)
  const reset = () => {
    setPhase('idle');
    setCapturedUri(null);
    setCapturedBase64(null);
    setItems([]);
    setError(null);
    settle(false);
  };

  // Capture (camera) or pick (library) → freeze the photo and let the user add a
  // description before the AI runs (the 'review' step).
  const capture = async (source: 'camera' | 'library') => {
    if (phase === 'scanning') return;
    Keyboard.dismiss();
    setError(null);
    try {
      const shot =
        source === 'camera'
          ? cameraRef.current && ready
            ? await capturePhoto(cameraRef.current)
            : null
          : await pickFromLibrary();
      if (!shot) return; // camera not ready, or user cancelled the picker
      setCapturedUri(shot.previewUri);
      setCapturedBase64(shot.base64);
      setPhase('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load that photo. Try again.');
    }
  };

  const analyze = async () => {
    if (!capturedBase64 || phase === 'scanning') return;
    Keyboard.dismiss();
    setError(null);
    setPhase('scanning');
    try {
      setItems(await scanMeal(capturedBase64, note));
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not analyze your meal. Try again.');
      setPhase('review');
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
          micros: it.micros,
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
      <CameraView ref={cameraRef} facing="back" enableTorch={torch} active={isFocused && phase === 'idle'} style={{ flex: 1 }} onCameraReady={() => setReady(true)} />
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

      {/* brackets framing the plate, over the live camera */}
      {phase === 'idle' && (
        <View style={{ position: 'absolute', top: '20%', left: '12%', right: '12%', height: '42%', zIndex: 10 }}>
          <Brackets color={theme.primary} glow animate len={40} w={4} r={18} />
        </View>
      )}

      {/* status pill while framing / analyzing */}
      {(phase === 'idle' || phase === 'scanning') && (
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

      {/* review sheet — slides up after capture */}
      {phase === 'done' && (
        <Animated.View
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
            transform: [{ translateY: sheetLift }, { translateY: dragY }],
          }}
        >
          {/* drag handle — pull down to peek at the photo */}
          <View
            {...pan.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Drag down to see your photo"
            style={{ alignItems: 'center', marginTop: -12, marginHorizontal: -22, paddingTop: 12, paddingBottom: 16 }}
          >
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: theme.track }} />
          </View>

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
        </Animated.View>
      )}

      {/* describe step — after capture, before analyzing (photo stays frozen behind) */}
      {phase === 'review' && (
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            backgroundColor: theme.surface,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 22,
            paddingHorizontal: 22,
            paddingBottom: Math.max(insets.bottom, 16) + 14,
            boxShadow: '0px -14px 40px -10px rgba(0,0,0,0.3)',
            transform: [{ translateY: sheetLift }],
          }}
        >
          <H size={23} style={{ textAlign: 'center' }}>
            Add a description?
          </H>
          <Txt w={500} size={14} color={theme.inkSec} style={{ marginTop: 6, marginBottom: 16, textAlign: 'center', lineHeight: 20 }}>
            Optional — mention portion size or anything hard to see for a better estimate.
          </Txt>
          <Field
            value={note}
            onChangeText={setNote}
            placeholder="e.g. grilled chicken, about 200g"
            returnKeyType="done"
            onSubmitEditing={analyze}
            maxLength={300}
            style={{ height: 50, fontSize: 14.5, backgroundColor: theme.bg, marginBottom: 14 }}
          />
          {error && (
            <Txt w={600} size={13.5} color={theme.protein} style={{ marginBottom: 12, textAlign: 'center', lineHeight: 19 }}>
              {error}
            </Txt>
          )}
          <PrimaryButton onPress={analyze}>Analyze meal</PrimaryButton>
          <Pressable onPress={reset} style={{ paddingVertical: 10, marginTop: 10 }}>
            <Txt w={700} size={14.5} color={theme.inkSec} style={{ textAlign: 'center' }}>
              Retake
            </Txt>
          </Pressable>
        </Animated.View>
      )}

      {/* capture controls — over the live camera (photo #4.x) */}
      {phase === 'idle' && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: Math.max(insets.bottom, 16) + 12,
            zIndex: 20,
            alignItems: 'center',
            gap: 18,
          }}
        >
          {error && (
            <View style={{ maxWidth: '82%', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 16, backgroundColor: 'rgba(28,28,26,0.72)' }}>
              <Txt w={600} size={13} color="#fff" style={{ textAlign: 'center', lineHeight: 18 }}>
                {error}
              </Txt>
            </View>
          )}
          <ScanModeSelector active="meal" />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 44 }}>
            <TorchButton on={torch} onPress={() => setTorch((t) => !t)} />
            <Shutter onPress={() => capture('camera')} busy={false} disabled={!ready} />
            <GalleryButton onPress={() => capture('library')} />
          </View>
        </View>
      )}
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
