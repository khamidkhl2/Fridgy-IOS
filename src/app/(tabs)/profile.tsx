/** Profile tab — identity + grouped settings (see photos #7.1 / #7.2). */
import { useRouter, type Href } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { haptics } from '@/lib/haptics';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/lib/links';
import { useNav } from '@/lib/nav';
import { useProfile } from '@/lib/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { THEMES } from '@/theme/themes';

type Row = { emoji: string; label: string; detail?: string; onPress: () => void };

export default function ProfileScreen() {
  const { theme, themeIndex } = useTheme();
  const { signOut, deleteAccount } = useAuth();
  const profile = useProfile();
  const router = useRouter();
  const nav = useNav();
  const insets = useSafeAreaInsets();

  const push = (path: string) => {
    haptics.light();
    router.push(path as Href);
  };

  const logout = async () => {
    await signOut();
    nav.go('welcome');
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

  const account: Row[] = [
    { emoji: '👤', label: 'Personal Details', onPress: () => push('/personal-details') },
    { emoji: '🎯', label: 'Goals & Body', onPress: () => push('/goals-body') },
  ];
  const preferences: Row[] = [
    { emoji: '📏', label: 'Units', onPress: () => { haptics.light(); nav.go('units'); } },
    { emoji: '🎨', label: 'Appearance', detail: THEMES[themeIndex].name, onPress: () => { haptics.light(); nav.go('settings'); } },
    { emoji: '🔔', label: 'Notifications', onPress: () => { haptics.light(); nav.go('notifications'); } },
    { emoji: '📖', label: 'Saved recipes', onPress: () => { haptics.light(); nav.go('savedRecipes'); } },
  ];
  const support: Row[] = [
    { emoji: '💬', label: 'Help & feedback', onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Fridgy%20feedback`).catch(() => {}) },
    { emoji: '🔒', label: 'Privacy Policy', onPress: () => Linking.openURL(PRIVACY_URL).catch(() => {}) },
    { emoji: '📄', label: 'Terms of Service', onPress: () => Linking.openURL(TERMS_URL).catch(() => {}) },
  ];

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <H size={32} style={{ paddingHorizontal: 22, letterSpacing: -0.3 }}>
          Profile
        </H>

        {/* identity */}
        <Pressable
          onPress={() => push('/personal-details')}
          accessibilityRole="button"
          accessibilityLabel="Personal details"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            marginHorizontal: 22,
            marginTop: 16,
            padding: 16,
            borderRadius: 20,
            backgroundColor: theme.surface,
            boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={30} color={theme.primary} stroke={1.9} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt w={800} size={19} color={theme.ink} numberOfLines={1} style={{ letterSpacing: -0.3 }}>
              {profile.displayName}
            </Txt>
            {profile.email ? (
              <Txt w={500} size={13} color={theme.inkSec} numberOfLines={1} style={{ marginTop: 2 }}>
                {profile.email}
              </Txt>
            ) : null}
          </View>
          <View style={{ transform: [{ scaleX: -1 }] }}>
            <Icon name="chevronLeft" size={18} color={theme.inkSec} stroke={2} />
          </View>
        </Pressable>

        <Section title="Account" rows={account} />
        <Section title="Preferences" rows={preferences} />
        <Section title="Support" rows={support} />

        {/* account actions */}
        <View style={{ marginTop: 24, marginHorizontal: 22, gap: 12 }}>
          <Pressable
            onPress={() => { haptics.light(); logout(); }}
            style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border }}
          >
            <Txt w={800} size={15.5} color={theme.protein}>
              Log out
            </Txt>
          </Pressable>
          <Pressable onPress={confirmDelete} style={{ paddingVertical: 12, alignItems: 'center' }}>
            <Txt w={700} size={13.5} color={theme.inkSec} style={{ textDecorationLine: 'underline' }}>
              Delete account
            </Txt>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  const { theme } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <Txt w={800} size={12.5} color={theme.inkSec} style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginLeft: 26, marginBottom: 10 }}>
        {title}
      </Txt>
      <View
        style={{
          marginHorizontal: 22,
          backgroundColor: theme.surface,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
        }}
      >
        {rows.map((r, i) => (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            accessibilityRole="button"
            accessibilityLabel={r.label}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 13,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: theme.border,
              backgroundColor: pressed ? theme.bg : 'transparent',
            })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={18}>{r.emoji}</Txt>
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
    </View>
  );
}
