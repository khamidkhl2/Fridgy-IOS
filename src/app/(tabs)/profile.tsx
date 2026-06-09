/** Screen 6 — Profile. Identity, stats, and the settings list (houses Appearance). */
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { useFridgeItems } from '@/lib/fridge';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/lib/links';
import {
  currentStreak,
  loggedDays,
  localDateISO,
  logsForDay,
  sumMacros,
  useRecentLogs,
} from '@/lib/food';
import { useNav, type Dest } from '@/lib/nav';
import { useProfile, useTargets } from '@/lib/profile';
import { useSavedRecipes } from '@/lib/recipes';
import { useTheme } from '@/theme/ThemeProvider';
import { THEMES } from '@/theme/themes';

export default function ProfileScreen() {
  const { theme, themeIndex } = useTheme();
  const { signOut, deleteAccount } = useAuth();
  const profile = useProfile();
  const targets = useTargets();
  const nav = useNav();
  const insets = useSafeAreaInsets();

  const { logs } = useRecentLogs();
  const { count: recipesMade } = useSavedRecipes();
  const { items: fridgeItems } = useFridgeItems();
  const today = localDateISO();
  const kcalToday = sumMacros(logsForDay(logs, today)).calories;
  const streak = currentStreak(loggedDays(logs), today);

  const STATS = [
    { v: String(streak), l: 'Day streak' },
    { v: kcalToday.toLocaleString(), l: 'kcal today' },
    { v: String(recipesMade), l: 'Recipes made' },
  ];

  const logout = async () => {
    await signOut();
    nav.go('welcome'); // session cleared → launch gate shows the welcome/auth flow
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all your data — profile, food logs, fridge items, and saved recipes. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert('Could not delete account', 'Please try again in a moment.');
              return;
            }
            nav.go('welcome');
          },
        },
      ]
    );
  };

  // grouped: your plan & content → preferences → support & legal
  const rows: { icon: IconName; label: string; detail?: string; go?: Dest; action?: () => void }[] = [
    { icon: 'user', label: 'Edit profile', go: 'editProfile' },
    {
      icon: 'flame',
      label: 'Daily targets',
      detail: targets ? `${targets.calories.toLocaleString()} kcal` : undefined,
      go: 'dailyTargets',
    },
    {
      icon: 'fridge',
      label: 'My fridge',
      detail: fridgeItems.length ? `${fridgeItems.length} item${fridgeItems.length > 1 ? 's' : ''}` : undefined,
      go: 'fridge',
    },
    {
      icon: 'book',
      label: 'Saved recipes',
      detail: recipesMade ? String(recipesMade) : undefined,
      go: 'savedRecipes',
    },
    { icon: 'sparkle', label: 'Appearance', detail: THEMES[themeIndex].name, go: 'settings' },
    { icon: 'scale', label: 'Units', go: 'units' },
    {
      icon: 'help',
      label: 'Help & feedback',
      action: () =>
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Fridgy%20feedback`).catch(() => {}),
    },
    { icon: 'book', label: 'Privacy Policy', action: () => Linking.openURL(PRIVACY_URL).catch(() => {}) },
    { icon: 'book', label: 'Terms of Service', action: () => Linking.openURL(TERMS_URL).catch(() => {}) },
  ];

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* identity */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 22 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: theme.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt style={{ fontFamily: theme.headlineFamily, fontSize: 26, color: theme.primary }}>
              {profile.initials}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt w={800} size={21} color={theme.ink} numberOfLines={1} style={{ letterSpacing: -0.3 }}>
              {profile.displayName}
            </Txt>
            {profile.email ? (
              <Txt w={500} size={13} color={theme.inkSec} numberOfLines={1} style={{ marginTop: 1 }}>
                {profile.email}
              </Txt>
            ) : null}
            {profile.goal ? (
              <View
                style={{
                  marginTop: 6,
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 4,
                  paddingHorizontal: 11,
                  borderRadius: 20,
                  backgroundColor: theme.primarySoft,
                }}
              >
                <Icon name={profile.goalIcon} size={13} color={theme.primary} stroke={2} />
                <Txt w={700} size={12.5} color={theme.primary}>
                  {profile.goal}
                </Txt>
              </View>
            ) : null}
          </View>
        </View>

        {/* stats */}
        <View style={{ flexDirection: 'row', gap: 11, paddingHorizontal: 22, paddingTop: 20 }}>
          {STATS.map((s, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: theme.surface,
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 10,
                alignItems: 'center',
                boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
              }}
            >
              <Txt w={800} size={22} color={theme.ink} style={{ letterSpacing: -0.5 }}>
                {s.v}
              </Txt>
              <Txt w={600} size={11.5} color={theme.inkSec} style={{ marginTop: 3 }}>
                {s.l}
              </Txt>
            </View>
          ))}
        </View>

        {/* settings list */}
        <View
          style={{
            marginHorizontal: 22,
            marginTop: 20,
            backgroundColor: theme.surface,
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
          }}
        >
          {rows.map((r, i) => (
            <Pressable
              key={i}
              onPress={() => (r.action ? r.action() : r.go && nav.go(r.go))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: theme.border,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: theme.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={r.icon} size={18} color={theme.primary} stroke={1.8} />
              </View>
              <Txt w={700} size={15.5} color={theme.ink} style={{ flex: 1 }}>
                {r.label}
              </Txt>
              {r.detail && (
                <Txt w={600} size={13.5} color={theme.inkSec} style={{ marginRight: 4 }}>
                  {r.detail}
                </Txt>
              )}
              <View style={{ transform: [{ scaleX: -1 }] }}>
                <Icon name="chevronLeft" size={17} color={theme.inkSec} stroke={2} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* log out */}
        <Pressable
          onPress={logout}
          style={{
            marginHorizontal: 22,
            marginTop: 16,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            backgroundColor: theme.surface,
            borderWidth: 1.5,
            borderColor: theme.border,
          }}
        >
          <Txt w={800} size={15.5} color={theme.protein}>
            Log out
          </Txt>
        </Pressable>

        {/* delete account (App Store 5.1.1(v)) */}
        <Pressable onPress={confirmDelete} style={{ marginTop: 14, paddingVertical: 12, alignItems: 'center' }}>
          <Txt w={700} size={13.5} color={theme.inkSec} style={{ textDecorationLine: 'underline' }}>
            Delete account
          </Txt>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}
