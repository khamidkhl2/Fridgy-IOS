/**
 * Reusable single-select onboarding screen: progress bar, headline, and a single
 * column of full-width option rows (emoji / icon in a soft tile + filled radio).
 * Picking a row stores it and auto-advances (no Continue button needed) with a
 * light selection haptic.
 */
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { H } from '@/components/Headline';
import { Icon, type IconName } from '@/components/Icon';
import { OnboardBar } from '@/components/OnboardBar';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { haptics } from '@/lib/haptics';
import { ONB_TOTAL } from '@/lib/onboarding';
import { useTheme } from '@/theme/ThemeProvider';
import { Pop } from '@/components/anim';

export type SingleOption = {
  id: string;
  label: string;
  icon?: IconName;
  emoji?: string;
  desc?: string;
};

type Props = {
  step: number;
  title: string;
  subtitle?: string;
  options: SingleOption[];
  value: string;
  onChange: (id: string) => void;
  onBack: () => void;
  /** Advance to the next screen. Called automatically a beat after a pick. */
  onContinue: () => void;
};

export function SingleSelectScreen({
  step,
  title,
  subtitle,
  options,
  value,
  onChange,
  onBack,
  onContinue,
}: Props) {
  const { theme } = useTheme();
  // guard against a double-tap firing two navigations during the advance delay
  const advancing = useRef(false);

  const pick = (id: string) => {
    if (advancing.current) return;
    advancing.current = true;
    onChange(id);
    haptics.selection();
    // brief beat so the selection state is visible before we move on
    setTimeout(onContinue, 200);
  };

  return (
    <ScreenBg>
      <OnboardBar step={step} total={ONB_TOTAL} onBack={onBack} />

      <View style={{ paddingHorizontal: 22, paddingTop: 22 }}>
        <H size={32}>{title}</H>
        {subtitle && (
          <Txt w={500} size={15} color={theme.inkSec} style={{ marginTop: 11, lineHeight: 21 }}>
            {subtitle}
          </Txt>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 22, paddingTop: 26, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {options.map((o, i) => {
          const on = value === o.id;
          const hasLead = !!o.icon || !!o.emoji;
          return (
            <Pop key={o.id} delay={i * 45}>
              <Pressable
                onPress={() => pick(o.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 15,
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: theme.surface,
                  borderWidth: 1.6,
                  borderColor: on ? theme.primary : theme.border,
                  boxShadow: on
                    ? `0px 10px 24px -14px ${theme.primary}`
                    : '0px 2px 10px rgba(30,28,24,0.04)',
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                })}
              >
                {hasLead && (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.primarySoft,
                    }}
                  >
                    {o.icon ? (
                      <Icon name={o.icon} size={24} color={theme.primary} stroke={1.9} />
                    ) : (
                      <Txt size={24}>{o.emoji}</Txt>
                    )}
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Txt w={800} size={17.5} color={theme.ink} style={{ letterSpacing: -0.1 }}>
                    {o.label}
                  </Txt>
                  {o.desc && (
                    <Txt w={500} size={13.5} color={theme.inkSec} style={{ marginTop: 2 }}>
                      {o.desc}
                    </Txt>
                  )}
                </View>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: on ? 0 : 2,
                    borderColor: theme.border,
                    backgroundColor: on ? theme.primary : 'transparent',
                  }}
                >
                  {on && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.onPrimary }} />}
                </View>
              </Pressable>
            </Pop>
          );
        })}
      </ScrollView>
    </ScreenBg>
  );
}
