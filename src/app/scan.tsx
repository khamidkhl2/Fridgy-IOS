/** Screen 4 — Fridge scan. Live camera, capture → AI ingredient detection → save to fridge. */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brackets } from '@/components/Brackets';
import { GlassBtn } from '@/components/GlassBtn';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Blink, Scanline } from '@/components/anim';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { addFridgeItems, type DetectedItem } from '@/lib/fridge';
import { useNav } from '@/lib/nav';
import { scanFridge } from '@/lib/scan';
import { useTheme } from '@/theme/ThemeProvider';

type Phase = 'idle' | 'scanning' | 'done';

export default function ScanScreen() {
  const { theme } = useTheme();
  const nav = useNav();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [detected, setDetected] = useState<DetectedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setPhase('idle');
    setDetected([]);
    setError(null);
  };

  const shoot = async () => {
    if (phase === 'scanning') return;
    if (phase === 'done') {
      reset();
      return;
    }
    if (!cameraRef.current) return;
    setError(null);
    setPhase('scanning');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error('Could not capture photo.');
      // downscale to ~1024px before upload — smaller payload, faster, cheaper tokens
      const rendered = await ImageManipulator.manipulate(photo.uri).resize({ width: 1024 }).renderAsync();
      const out = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
      if (!out.base64) throw new Error('Could not process photo.');
      const items = await scanFridge(out.base64);
      setDetected(items);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed. Try again.');
      setPhase('idle');
    }
  };

  const save = async () => {
    if (!session?.user || detected.length === 0) return;
    setSaving(true);
    const saved = await addFridgeItems(session.user.id, detected, 'scan');
    setSaving(false);
    if (saved.length === 0) {
      Alert.alert('Could not save', 'Please try again.');
      return;
    }
    nav.go('recipes');
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
          <GlassBtn icon="close" label="Close" onPress={() => nav.go('home')} />
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
      <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }} />
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
        <GlassBtn icon="close" label="Close" onPress={() => nav.go('home')} />
        <GlassBtn
          icon="help"
          label="Scanning tips"
          onPress={() =>
            Alert.alert(
              'Scanning tips',
              '• Open the fridge door fully\n• Keep the camera steady\n• Make sure items are well lit\n• Pull crowded items forward\n\nTap the shutter and we’ll detect what’s inside.'
            )
          }
        />
      </View>

      {/* scan frame */}
      <View style={{ position: 'absolute', top: '17%', left: '11%', right: '11%', height: '40%', zIndex: 10 }}>
        <Brackets color={theme.primary} glow animate={phase !== 'done'} len={36} w={4} r={14} />
        {phase === 'scanning' && <Scanline color={theme.primary} duration={1400} thickness={3} />}

        {/* status pill */}
        {phase !== 'done' && (
          <View style={{ position: 'absolute', top: -40, left: 0, right: 0, alignItems: 'center' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 22,
                backgroundColor: 'rgba(20,20,18,0.55)',
              }}
            >
              <Blink style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent }} />
              <Txt w={700} size={13} color="#fff">
                {phase === 'scanning' ? 'Detecting…' : 'Point at your open fridge'}
              </Txt>
            </View>
          </View>
        )}
      </View>

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
        }}
      >
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: theme.track, alignSelf: 'center', marginBottom: 16 }} />

        {phase === 'done' ? (
          <DoneSheet
            detected={detected}
            saving={saving}
            onSave={save}
            onRescan={reset}
            onRemove={(i) => setDetected((d) => d.filter((_, idx) => idx !== i))}
          />
        ) : (
          <View style={{ alignItems: 'center' }}>
            <H size={25}>{phase === 'scanning' ? 'Scanning…' : 'Scan your fridge'}</H>
            <Txt w={500} size={14} color={theme.inkSec} style={{ marginTop: 5, marginBottom: 18, textAlign: 'center' }}>
              {phase === 'scanning'
                ? 'Reading what’s inside — hold steady'
                : "Hold steady — we'll detect what's inside"}
            </Txt>
            {error && (
              <Txt w={600} size={13.5} color={theme.protein} style={{ marginBottom: 14, textAlign: 'center', lineHeight: 19 }}>
                {error}
              </Txt>
            )}
            <Pressable
              onPress={shoot}
              disabled={phase === 'scanning'}
              accessibilityRole="button"
              accessibilityLabel={phase === 'scanning' ? 'Scanning your fridge' : 'Take photo of your fridge'}
              accessibilityState={{ disabled: phase === 'scanning', busy: phase === 'scanning' }}
              style={{
                width: 78,
                height: 78,
                borderRadius: 39,
                borderWidth: 4,
                borderColor: theme.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: phase === 'scanning' ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: phase === 'scanning' ? 16 : 30,
                  backgroundColor: theme.primary,
                  boxShadow: `0px 6px 16px -6px ${theme.primary}`,
                }}
              />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function DoneSheet({
  detected,
  saving,
  onSave,
  onRescan,
  onRemove,
}: {
  detected: DetectedItem[];
  saving: boolean;
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
          {empty ? 'Try again with the fridge open and well lit.' : 'Tap a tag to remove it, then add to your fridge.'}
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

      {empty ? (
        <PrimaryButton onPress={onRescan}>Scan again</PrimaryButton>
      ) : (
        <>
          <PrimaryButton onPress={onSave} disabled={saving}>
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
