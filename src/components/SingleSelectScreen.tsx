/**
 * Reusable single-select onboarding screen: progress bar, headline, a list of
 * full-width option rows (icon / emoji / plain), and a Continue dock. Continue
 * stays disabled until something is picked.
 */
import { Pressable, ScrollView, View } from 'react-native';
import { BottomDock } from '@/components/BottomDock';
import { H } from '@/components/Headline';
import { Icon, type IconName } from '@/components/Icon';
import { OnboardBar } from '@/components/OnboardBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { ONB_TOTAL } from '@/lib/onboarding';
import { useTheme } from '@/theme/ThemeProvider';

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
        contentContainerStyle={{ padding: 22, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {options.map((o) => {
          const on = value === o.id;
          const hasLead = !!o.icon || !!o.emoji;
          return (
            <Pressable
              key={o.id}
              onPress={() => onChange(o.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                padding: 16,
                borderRadius: 18,
                backgroundColor: on ? theme.primary : theme.surface,
                borderWidth: 1.5,
                borderColor: on ? theme.primary : theme.border,
                boxShadow: on
                  ? `0px 12px 26px -12px ${theme.primary}`
                  : '0px 2px 10px rgba(30,28,24,0.04)',
                transform: [{ translateY: on ? -1 : 0 }],
              }}
            >
              {hasLead && (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? 'rgba(255,255,255,0.16)' : theme.primarySoft,
                  }}
                >
                  {o.icon ? (
                    <Icon name={o.icon} size={24} color={on ? theme.onPrimary : theme.primary} stroke={1.9} />
                  ) : (
                    <Txt size={24}>{o.emoji}</Txt>
                  )}
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Txt w={800} size={17.5} color={on ? theme.onPrimary : theme.ink} style={{ letterSpacing: -0.1 }}>
                  {o.label}
                </Txt>
                {o.desc && (
                  <Txt
                    w={500}
                    size={13.5}
                    color={on ? 'rgba(255,255,255,0.78)' : theme.inkSec}
                    style={{ marginTop: 2 }}
                  >
                    {o.desc}
                  </Txt>
                )}
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
                  backgroundColor: on ? theme.onPrimary : 'transparent',
                }}
              >
                {on && <Icon name="check" size={14} color={theme.primary} stroke={3} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <BottomDock>
        <PrimaryButton disabled={!value} onPress={onContinue}>
          Continue
        </PrimaryButton>
      </BottomDock>
    </ScreenBg>
  );
}
