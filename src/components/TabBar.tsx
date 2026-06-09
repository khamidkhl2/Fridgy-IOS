/**
 * Bottom tab bar with a raised center Scan FAB (the hero action).
 * Used as the custom `tabBar` for the (tabs) navigator: Kitchen · Recipes · [Scan] · Profile.
 */
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
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
            onPress={() => router.push('/scan')}
            accessibilityRole="button"
            accessibilityLabel="Scan fridge"
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
  );
}
