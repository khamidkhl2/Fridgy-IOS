/** Screen 7 — Appearance. In-app theme picker; the whole app re-tints instantly. */
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useNav } from '@/lib/nav';
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { THEMES } from '@/theme/themes';

const MODES: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { theme, themeIndex, setThemeIndex, mode, setMode } = useTheme();
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
          Appearance
        </Txt>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: Math.max(insets.bottom, 20) + 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* light / dark / system */}
        <Txt w={800} size={12.5} color={theme.inkSec} style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
          Mode
        </Txt>
        <View style={{ flexDirection: 'row', backgroundColor: theme.bg, borderRadius: 14, padding: 4, marginBottom: 26 }}>
          {MODES.map((m) => {
            const on = mode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 11,
                  borderRadius: 11,
                  backgroundColor: on ? theme.surface : 'transparent',
                  boxShadow: on ? '0px 2px 6px rgba(0,0,0,0.10)' : undefined,
                }}
              >
                <Txt w={on ? 800 : 600} size={14} color={on ? theme.ink : theme.inkSec}>
                  {m.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        <Txt w={800} size={12.5} color={theme.inkSec} style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
          Theme
        </Txt>

        <View style={{ gap: 11 }}>
          {THEMES.map((th, i) => {
            const on = i === themeIndex;
            return (
              <Pressable
                key={th.id}
                onPress={() => setThemeIndex(i)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 15,
                  borderRadius: 16,
                  backgroundColor: on ? theme.primarySoft : theme.surface,
                  borderWidth: 1.5,
                  borderColor: on ? theme.primary : theme.border,
                  boxShadow: on ? undefined : '0px 2px 8px rgba(30,28,24,0.03)',
                }}
              >
                {/* swatch trio */}
                <View style={{ flexDirection: 'row' }}>
                  <Swatch color={th.primary} />
                  <Swatch color={th.accent} overlap />
                  <Swatch color={th.protein} overlap />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Txt w={800} size={16} color={theme.ink}>
                      {th.name}
                    </Txt>
                    {i === 0 && (
                      <View style={{ marginLeft: 7, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8, backgroundColor: theme.bg }}>
                        <Txt w={700} size={11} color={theme.inkSec}>
                          Default
                        </Txt>
                      </View>
                    )}
                  </View>
                  <Txt w={500} size={13} color={theme.inkSec} style={{ marginTop: 2 }}>
                    {th.mood}
                  </Txt>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: on ? 0 : 2,
                    borderColor: theme.border,
                    backgroundColor: on ? theme.primary : 'transparent',
                  }}
                >
                  {on && <Icon name="check" size={14} color={theme.onPrimary} stroke={3} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

function Swatch({ color, overlap = false }: { color: string; overlap?: boolean }) {
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: color,
        marginLeft: overlap ? -9 : 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    />
  );
}
