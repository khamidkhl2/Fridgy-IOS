/**
 * Bottom tab bar: Kitchen · Recipes · Profile, with a raised Scan action in the
 * right corner that opens a 2×2 chooser (Scan meal / Scan fridge / Food database
 * / Saved recipes) — see photo #3.
 */
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type TabBarProps = {
  state: { index: number; routeNames: string[] };
  navigation: { navigate: (name: string) => void };
};

const FAB = 58;
const BAR_PAD_H = 14;

type ScanDest = 'meal' | 'fridge' | 'database' | 'recipes';

export function TabBar({ state, navigation }: TabBarProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const current = state.routeNames[state.index];
  const [open, setOpen] = useState(false);

  // Right-corner FAB sits over the last of five equal slots (4 tabs + FAB), so
  // the chooser's X (rendered in the modal) lines up with it.
  const slot = (width - BAR_PAD_H * 2) / 5;
  const fabRight = BAR_PAD_H + slot / 2 - FAB / 2;

  const pick = (dest: ScanDest) => {
    setOpen(false);
    haptics.light();
    const href: Record<ScanDest, string> = {
      meal: '/scan-meal',
      fridge: '/scan',
      database: '/add-food',
      recipes: '/saved-recipes',
    };
    router.push(href[dest] as Href);
  };

  const item = (name: string, icon: IconName, label: string) => {
    const on = current === name;
    return (
      <Pressable
        key={name}
        onPress={() => {
          haptics.selection();
          navigation.navigate(name);
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: on }}
        style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 }}
      >
        <Icon name={icon} size={24} color={on ? theme.primary : theme.inkSec} stroke={on ? 2.1 : 1.8} />
        <Txt w={on ? 800 : 600} size={11} color={on ? theme.primary : theme.inkSec}>
          {label}
        </Txt>
      </Pressable>
    );
  };

  return (
    <>
      <View
        style={{
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: BAR_PAD_H,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {item('home', 'home', 'Kitchen')}
          {item('recipes', 'book', 'Recipes')}
          {item('progress', 'chart', 'Progress')}
          {item('profile', 'user', 'Profile')}
          {/* spacer slot under the FAB */}
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* right-corner scan FAB */}
      <Pressable
        onPress={() => {
          haptics.light();
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Open scan menu"
        style={({ pressed }) => ({
          position: 'absolute',
          right: fabRight,
          bottom: Math.max(insets.bottom, 10) + 8,
          width: FAB,
          height: FAB,
          borderRadius: FAB / 2,
          backgroundColor: theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0px 10px 24px -8px ${theme.primary}`,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <Icon name="plus" size={28} color={theme.onPrimary} stroke={2.4} />
      </Pressable>

      <ScanMenu
        visible={open}
        onClose={() => setOpen(false)}
        onPick={pick}
        fabRight={fabRight}
        fabBottom={Math.max(insets.bottom, 10) + 8}
      />
    </>
  );
}

/** The 2×2 chooser that pops above the corner FAB. */
function ScanMenu({
  visible,
  onClose,
  onPick,
  fabRight,
  fabBottom,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (dest: ScanDest) => void;
  fabRight: number;
  fabBottom: number;
}) {
  const { theme } = useTheme();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    anim.setValue(0);
    if (visible) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const close = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && onClose());
  };

  const dim = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });
  const gridScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const gridTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  const options: { dest: ScanDest; emoji: string; label: string }[] = [
    { dest: 'meal', emoji: '🍽️', label: 'Scan meal' },
    { dest: 'fridge', emoji: '🧊', label: 'Scan fridge' },
    { dest: 'database', emoji: '🔍', label: 'Food database' },
    { dest: 'recipes', emoji: '📖', label: 'Saved recipes' },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: dim }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close scan menu" />

        {/* grid, anchored just above the FAB on the right */}
        <Animated.View
          style={{
            position: 'absolute',
            right: 18,
            bottom: fabBottom + FAB + 16,
            width: 300,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            opacity: anim,
            transform: [{ scale: gridScale }, { translateY: gridTranslate }],
          }}
        >
          {options.map((o) => (
            <Pressable
              key={o.dest}
              onPress={() => onPick(o.dest)}
              accessibilityRole="button"
              accessibilityLabel={o.label}
              style={({ pressed }) => ({
                width: 144,
                paddingVertical: 22,
                borderRadius: 22,
                alignItems: 'center',
                gap: 10,
                backgroundColor: theme.surface,
                boxShadow: '0px 12px 30px -12px rgba(0,0,0,0.4)',
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Txt size={30}>{o.emoji}</Txt>
              <Txt w={800} size={15} color={theme.ink}>
                {o.label}
              </Txt>
            </Pressable>
          ))}
        </Animated.View>

        {/* FAB turned into a close button, lined up over the real FAB */}
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close scan menu"
          style={{
            position: 'absolute',
            right: fabRight,
            bottom: fabBottom,
            width: FAB,
            height: FAB,
            borderRadius: FAB / 2,
            backgroundColor: theme.primaryDeep,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0px 10px 24px -8px ${theme.primary}`,
          }}
        >
          <Icon name="close" size={24} color={theme.onPrimary} stroke={2.4} />
        </Pressable>
      </View>
    </Modal>
  );
}
