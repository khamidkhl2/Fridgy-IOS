/**
 * Bottom tab bar with a raised center Scan FAB (the hero action).
 * Used as the custom `tabBar` for the (tabs) navigator: Kitchen · Recipes · [Scan] · Profile.
 */
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { H } from './Headline';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

/**
 * Minimal structural shape of the props the `tabBar` render prop hands us — only
 * what we read. Keeps us decoupled from expo-router's internal vendored types.
 */
type TabBarProps = {
  state: { index: number; routeNames: string[] };
  navigation: { navigate: (name: string) => void };
};

export function TabBar({ state, navigation }: TabBarProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const current = state.routeNames[state.index];

  // The hero scan button opens a chooser: both scanners are camera actions, so
  // grouping them here gives the meal scanner equal footing with fridge scan.
  const [chooserOpen, setChooserOpen] = useState(false);
  const pick = (dest: 'fridge' | 'meal') => {
    setChooserOpen(false);
    router.push(dest === 'fridge' ? '/scan' : ('/scan-meal' as Href));
  };

  const item = (name: string, icon: IconName, label: string) => {
    const on = current === name;
    return (
      <Pressable
        key={name}
        onPress={() => navigation.navigate(name)}
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
        borderTopWidth: 1,
        borderTopColor: theme.border,
        backgroundColor: theme.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14 }}>
        {item('home', 'home', 'Kitchen')}
        {item('recipes', 'book', 'Recipes')}
        {/* center FAB slot */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Pressable
            onPress={() => setChooserOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open scanner"
            style={({ pressed }) => ({
              width: 62,
              height: 62,
              borderRadius: 31,
              marginTop: -26,
              backgroundColor: theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 6,
              borderColor: theme.surface,
              boxShadow: `0px 12px 26px -8px ${theme.primary}`,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}
          >
            <Icon name="scan" size={28} color={theme.onPrimary} stroke={2} />
          </Pressable>
        </View>
        {item('profile', 'user', 'Profile')}
      </View>
    </View>

    <ScanChooser visible={chooserOpen} onClose={() => setChooserOpen(false)} onPick={pick} />
    </>
  );
}

/** Bottom sheet that routes the hero scan button to either scanner. */
function ScanChooser({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (dest: 'fridge' | 'meal') => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // 0 = closed, 1 = open. Drives the backdrop opacity (fade) and the sheet
  // translateY (slide) independently, so the dim darkens in place rather than
  // sliding up with the sheet.
  const [anim] = useState(() => new Animated.Value(0));
  const [sheetH, setSheetH] = useState(0);

  // Drive the backdrop fade + sheet slide off one value. The effect only touches
  // the Animated value (not React state), so it stays render-clean.
  useEffect(() => {
    anim.setValue(0);
    if (visible) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Animate the sheet down + backdrop out, then ask the parent to unmount.
  const close = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [sheetH || 600, 0] });
  const dim = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1 }}>
        {/* dim layer — fades in place to darken the screen */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: dim }]} />
        {/* tap-to-close catcher */}
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close scanner" />

        {/* sheet — slides up from the bottom */}
        <Animated.View
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, transform: [{ translateY }] }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              paddingHorizontal: 22,
              paddingBottom: Math.max(insets.bottom, 16) + 10,
            }}
          >
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: theme.track, alignSelf: 'center', marginBottom: 16 }} />
            <H size={22} style={{ marginBottom: 4 }}>
              Scan
            </H>
            <Txt w={500} size={13.5} color={theme.inkSec} style={{ marginBottom: 18 }}>
              Point your camera at your fridge or a meal.
            </Txt>
            <View style={{ gap: 12 }}>
              <ScanOption
                icon="scan"
                title="Scan your fridge"
                subtitle="Get recipe ideas from what you have"
                onPress={() => onPick('fridge')}
              />
              <ScanOption
                icon="camera"
                title="Scan a meal"
                subtitle="Log calories & macros from a photo"
                onPress={() => onPick('meal')}
              />
            </View>
            <Pressable onPress={close} style={{ paddingVertical: 14, marginTop: 8 }}>
              <Txt w={700} size={14.5} color={theme.inkSec} style={{ textAlign: 'center' }}>
                Cancel
              </Txt>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** One row in the scan chooser sheet. */
function ScanOption({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 18,
        backgroundColor: theme.bg,
        borderWidth: 1.5,
        borderColor: theme.border,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={24} color={theme.primary} stroke={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt w={800} size={16} color={theme.ink}>
          {title}
        </Txt>
        <Txt w={500} size={13} color={theme.inkSec} style={{ marginTop: 2 }}>
          {subtitle}
        </Txt>
      </View>
      <View style={{ transform: [{ scaleX: -1 }] }}>
        <Icon name="chevronLeft" size={18} color={theme.inkSec} stroke={2} />
      </View>
    </Pressable>
  );
}
