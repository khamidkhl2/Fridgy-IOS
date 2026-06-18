/** Screen 4 — Fridge scan. Live camera, capture → AI ingredient detection → save to fridge. */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, Image, Keyboard, Linking, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brackets } from '@/components/Brackets';
import { Field } from '@/components/Field';
import { GlassBtn } from '@/components/GlassBtn';
import { GalleryButton, ScanModeSelector, Shutter, TorchButton } from '@/components/ScanControls';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Blink, Scanline } from '@/components/anim';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { capturePhoto, pickFromLibrary } from '@/lib/camera';
import { addFridgeItems, clearFridge, useFridgeItems, type DetectedItem } from '@/lib/fridge';
import { useKeyboardHeight } from '@/lib/keyboard';
import { useNav } from '@/lib/nav';
import { scanFridge } from '@/lib/scan';
import { useTheme } from '@/theme/ThemeProvider';

type Phase = 'idle' | 'review' | 'scanning' | 'done';

export default function ScanScreen() {
  const { theme } = useTheme();
  const nav = useNav();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const { items: existing } = useFridgeItems();

  const cameraRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedItem[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [torch, setTorch] = useState(false);
  const kb = useKeyboardHeight();
  const sheetLift = kb > 0 ? -Math.max(0, kb - insets.bottom) : 0;

  const reset = () => {
    setPhase('idle');
    setCapturedUri(null);
    setCapturedBase64(null);
    setDetected([]);
    setError(null);
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
      setDetected(await scanFridge(capturedBase64, note));
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed. Try again.');
      setPhase('review');
    }
  };

  // Re-run detection on the same photo with the edited description — lets the
  // user name items the AI missed without taking a new picture.
  const refine = async () => {
    if (!capturedBase64 || refining) return;
    Keyboard.dismiss();
    setRefining(true);
    setError(null);
    try {
      setDetected(await scanFridge(capturedBase64, note));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the scan. Try again.');
    } finally {
      setRefining(false);
    }
  };

  const save = async () => {
    if (!session?.user || detected.length === 0) return;
    const userId = session.user.id;

    const persist = async (replace: boolean) => {
      setSaving(true);
      if (replace) await clearFridge(userId);
      const saved = await addFridgeItems(userId, detected, 'scan');
      setSaving(false);
      if (saved.length === 0) {
        Alert.alert('Could not save', 'Please try again.');
        return;
      }
      nav.go('recipes');
    };

    // If the fridge already has items, ask whether to replace them or add on top.
    if (existing.length > 0) {
      Alert.alert(
        'Update your fridge',
        `You already have ${existing.length} item${existing.length > 1 ? 's' : ''}. Replace them with this scan, or add these on top?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add to fridge', onPress: () => persist(false) },
          { text: 'Replace all', style: 'destructive', onPress: () => persist(true) },
        ]
      );
    } else {
      persist(false);
    }
  };

  // ── permission gate ────────────────────────────────────────────────────────
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#141513' }} />;
  }
  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#141513',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 34,
        }}
      >
        <StatusBar style="light" />
        <View
          style={{
            position: 'absolute',
            top: insets.top + 4,
            left: 20,
            zIndex: 20,
          }}
        >
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
        <Txt
          w={500}
          size={15}
          color="rgba(255,255,255,0.7)"
          style={{ textAlign: 'center', marginTop: 12, marginBottom: 28, lineHeight: 22 }}
        >
          Fridgy uses your camera to scan what&apos;s inside your fridge and turn it into meals.
        </Txt>
        <View style={{ width: '100%' }}>
          <PrimaryButton
            onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
          >
            {permission.canAskAgain ? 'Allow camera' : 'Open settings'}
          </PrimaryButton>
        </View>
      </View>
    );
  }

  // ── camera + scan UI ───────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#141513', overflow: 'hidden' }}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        facing="back"
        enableTorch={torch}
        active={isFocused && phase === 'idle'}
        style={{ flex: 1 }}
        onCameraReady={() => setReady(true)}
      />
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
      <View
        style={{
          position: 'absolute',
          top: insets.top + 4,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          zIndex: 20,
        }}
      >
        <GlassBtn icon="close" label="Close" onPress={() => nav.back()} />
        <GlassBtn
          icon="help"
          label="Scanning tips"
          onPress={() =>
            Alert.alert(
              'Scanning tips',
              '• Open the fridge door fully\n• Keep the camera steady\n• Make sure items are well lit\n• Pull crowded items forward\n• Add a description to name items hidden in containers or hard to see\n\nTap the shutter and we’ll detect what’s inside.'
            )
          }
        />
      </View>

      {/* brackets framing the fridge, over the live camera */}
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
              {phase === 'scanning' ? 'Analyzing…' : 'Point at your open fridge'}
            </Txt>
          </View>
        </View>
      )}
      {phase === 'scanning' && (
        <View style={{ position: 'absolute', top: '30%', left: '10%', right: '10%', height: '34%', zIndex: 10 }}>
          <Scanline color={theme.primary} duration={1400} thickness={3} />
        </View>
      )}

      {/* review sheet — after capture */}
      {phase === 'done' && (
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
          <DoneSheet
            detected={detected}
            saving={saving}
            note={note}
            setNote={setNote}
            refining={refining}
            onRefine={refine}
            onSave={save}
            onRescan={reset}
            onRemove={(i) => setDetected((d) => d.filter((_, idx) => idx !== i))}
          />
        </View>
      )}

      {/* describe step — after capture, before analyzing (photo stays frozen behind) */}
      {phase === 'review' && (
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
            Optional — name anything hidden in containers or hard to see for a better scan.
          </Txt>
          <Field
            value={note}
            onChangeText={setNote}
            placeholder="e.g. leftover curry in the blue tub"
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
          <PrimaryButton onPress={analyze}>Scan fridge</PrimaryButton>
          <Pressable onPress={reset} style={{ paddingVertical: 10, marginTop: 10 }}>
            <Txt w={700} size={14.5} color={theme.inkSec} style={{ textAlign: 'center' }}>
              Retake
            </Txt>
          </Pressable>
        </View>
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
          <ScanModeSelector active="fridge" />
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

function DoneSheet({
  detected,
  saving,
  note,
  setNote,
  refining,
  onRefine,
  onSave,
  onRescan,
  onRemove,
}: {
  detected: DetectedItem[];
  saving: boolean;
  note: string;
  setNote: (v: string) => void;
  refining: boolean;
  onRefine: () => void;
  onSave: () => void;
  onRescan: () => void;
  onRemove: (index: number) => void;
}) {
  const { theme } = useTheme();
  const empty = detected.length === 0;

  return (
    <View>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <H size={25}>{empty ? 'Nothing detected' : `Found ${detected.length} ingredient${detected.length > 1 ? 's' : ''}`}</H>
        <Txt w={500} size={14} color={theme.inkSec} style={{ marginTop: 5, textAlign: 'center' }}>
          {empty ? 'Try again with better lighting, or describe what’s inside below.' : 'Tap a tag to remove it, then add to your fridge.'}
        </Txt>
      </View>

      {!empty && (
        <ScrollView style={{ maxHeight: 168 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {detected.map((it, i) => (
              <Pressable
                key={`${it.name}-${i}`}
                onPress={() => onRemove(i)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${it.name}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingVertical: 8,
                  paddingLeft: 12,
                  paddingRight: 9,
                  borderRadius: 20,
                  backgroundColor: theme.primarySoft,
                }}
              >
                <Txt w={700} size={13.5} color={theme.primary}>
                  {it.name}
                </Txt>
                <Icon name="close" size={13} color={theme.primary} stroke={2.4} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* refine the scan with a description — no need to re-shoot */}
      <Field
        value={note}
        onChangeText={setNote}
        placeholder={empty ? 'Describe what’s inside (optional)' : 'Missing or wrong? Describe it (optional)'}
        returnKeyType="done"
        onSubmitEditing={onRefine}
        maxLength={300}
        style={{ height: 48, fontSize: 14, backgroundColor: theme.bg, marginBottom: 8 }}
      />
      <Pressable
        onPress={onRefine}
        disabled={refining || !note.trim()}
        accessibilityRole="button"
        accessibilityLabel="Update scan from your description"
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
          {refining ? 'Updating…' : 'Update scan'}
        </Txt>
      </Pressable>

      {empty ? (
        <PrimaryButton onPress={onRescan}>Scan again</PrimaryButton>
      ) : (
        <>
          <PrimaryButton onPress={onSave} disabled={saving || refining}>
            {saving ? 'Adding…' : 'Add to fridge  →'}
          </PrimaryButton>
          <Pressable onPress={onRescan} style={{ paddingVertical: 8, marginTop: 12 }}>
            <Txt w={700} size={14.5} color={theme.inkSec} style={{ textAlign: 'center' }}>
              Scan again
            </Txt>
          </Pressable>
        </>
      )}
    </View>
  );
}
