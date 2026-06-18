/** Notifications settings — per-category master switches for local reminders. */
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useNav } from '@/lib/nav';
import {
  ensurePermission,
  hasPermission,
  REMINDER_LEAD_DAYS,
  useNotifPref,
  type NotifCategory,
} from '@/lib/notifications';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/themes';

const CATEGORIES: { cat: NotifCategory; icon: IconName; title: string; desc: string }[] = [
  {
    cat: 'expiry',
    icon: 'bell',
    title: 'Expiry reminders',
    desc: `A heads-up ${REMINDER_LEAD_DAYS} days before a fridge item is set to expire.`,
  },
  {
    cat: 'meal',
    icon: 'drumstick',
    title: 'Meal reminders',
    desc: "Nudges at breakfast, lunch and dinner for meals you haven't logged yet.",
  },
  {
    cat: 'lifecycle',
    icon: 'sparkle',
    title: 'Check-ins',
    desc: "Occasional nudges when your fridge is empty or you've been away for a few days.",
  },
];

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const nav = useNav();
  const insets = useSafeAreaInsets();

  return (
    <ScreenBg>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 6, paddingHorizontal: 22 }}>
        <Pressable
          onPress={() => nav.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.surface,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0px 2px 8px rgba(30,28,24,0.06)',
          }}
        >
          <Icon name="chevronLeft" size={20} color={theme.ink} stroke={2.2} />
        </Pressable>
        <Txt w={800} size={18} color={theme.ink}>
          Notifications
        </Txt>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: Math.max(insets.bottom, 20) + 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 12 }}>
          {CATEGORIES.map((c) => (
            <NotifRow key={c.cat} theme={theme} {...c} />
          ))}
        </View>

        <Txt w={500} size={12.5} color={theme.inkSec} style={{ marginTop: 16, lineHeight: 18 }}>
          Reminders are scheduled privately on your device — nothing is sent to a server. Adjust an
          item&apos;s expiry date any time from My fridge.
        </Txt>
      </ScrollView>
    </ScreenBg>
  );
}

function NotifRow({
  theme,
  cat,
  icon,
  title,
  desc,
}: {
  theme: Theme;
  cat: NotifCategory;
  icon: IconName;
  title: string;
  desc: string;
}) {
  const [enabled, setEnabled] = useNotifPref(cat);
  const [denied, setDenied] = useState(false);

  // Surface the case where the user enabled this but the OS permission is off.
  // (The banner is gated on `enabled` in render, so no reset is needed here.)
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void (async () => {
      const ok = await hasPermission();
      if (active) setDenied(!ok);
    })();
    return () => {
      active = false;
    };
  }, [enabled]);

  const toggle = async (next: boolean) => {
    if (!next) {
      setEnabled(false);
      setDenied(false);
      return;
    }
    const granted = await ensurePermission();
    setEnabled(granted);
    setDenied(!granted);
  };

  return (
    <View
      style={{
        padding: 16,
        backgroundColor: theme.surface,
        borderRadius: 18,
        boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: theme.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={19} color={theme.primary} stroke={1.9} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt w={800} size={15.5} color={theme.ink}>
            {title}
          </Txt>
          <Txt w={500} size={13} color={theme.inkSec} style={{ marginTop: 2, lineHeight: 18 }}>
            {desc}
          </Txt>
        </View>
        <Switch
          value={enabled && !denied}
          onValueChange={toggle}
          trackColor={{ true: theme.primary, false: theme.track }}
          thumbColor={theme.onPrimary}
        />
      </View>

      {enabled && denied && (
        <Pressable
          onPress={() => Linking.openSettings().catch(() => {})}
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: theme.proteinSoft,
            borderWidth: 1.5,
            borderColor: theme.protein,
          }}
        >
          <Txt w={700} size={13} color={theme.protein}>
            Notifications are off for Fridgy in your device settings. Tap to open Settings and allow
            them.
          </Txt>
        </Pressable>
      )}
    </View>
  );
}
