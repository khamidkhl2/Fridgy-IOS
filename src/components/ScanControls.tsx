/**
 * Shared camera-overlay controls for the two scanners (meal + fridge), styled to
 * sit over the live camera feed: a Meal↔Fridge mode selector, a white shutter,
 * and a torch toggle. See photos #4.1–4.3.
 */
import { useRouter, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { Icon } from './Icon';
import { Txt } from './Txt';

const DARK = 'rgba(28,28,26,0.55)';

/** Two pills that switch between the meal and fridge scanners (replaces the route). */
export function ScanModeSelector({ active }: { active: 'meal' | 'fridge' }) {
  const router = useRouter();
  const go = (mode: 'meal' | 'fridge') => {
    if (mode === active) return;
    haptics.selection();
    router.replace((mode === 'meal' ? '/scan-meal' : '/scan') as Href);
  };
  const pill = (mode: 'meal' | 'fridge', label: string) => {
    const on = mode === active;
    return (
      <Pressable
        onPress={() => go(mode)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        style={{ paddingVertical: 10, paddingHorizontal: 22, borderRadius: 20, backgroundColor: on ? '#fff' : DARK }}
      >
        <Txt w={800} size={14} color={on ? '#141513' : '#fff'}>
          {label}
        </Txt>
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {pill('meal', 'Meal')}
      {pill('fridge', 'Fridge')}
    </View>
  );
}

/** The big white capture button; shows a rounded-square "busy" state while scanning. */
export function Shutter({ onPress, busy, disabled }: { onPress: () => void; busy: boolean; disabled: boolean }) {
  return (
    <Pressable
      onPress={() => {
        if (busy || disabled) return;
        haptics.medium();
        onPress();
      }}
      disabled={busy || disabled}
      accessibilityRole="button"
      accessibilityLabel={busy ? 'Analyzing' : 'Take photo'}
      accessibilityState={{ disabled: busy || disabled, busy }}
      style={{
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 5,
        borderColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: busy ? 30 : 62,
          height: busy ? 30 : 62,
          borderRadius: busy ? 9 : 31,
          backgroundColor: '#fff',
        }}
      />
    </Pressable>
  );
}

/** Round glass torch toggle. */
export function TorchButton({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={on ? 'Turn flash off' : 'Turn flash on'}
      accessibilityState={{ selected: on }}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: on ? 'rgba(255,255,255,0.92)' : DARK,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="bolt" size={22} color={on ? '#141513' : '#fff'} stroke={1.8} fill={on ? '#141513' : 'none'} />
    </Pressable>
  );
}

/** Round glass button to pick a photo from the library (mirrors the torch). */
export function GalleryButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel="Choose a photo from your library"
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: DARK,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="image" size={22} color="#fff" stroke={1.8} />
    </Pressable>
  );
}
