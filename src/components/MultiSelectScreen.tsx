/**
 * Reusable multi-select onboarding screen: a 2-column grid of emoji chips with
 * support for an exclusive "none" option (clears the rest) and an "other" option
 * that reveals an inline text field. Optional Skip link under Continue.
 */
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { BottomDock } from '@/components/BottomDock';
import { Field } from '@/components/Field';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { OnboardBar } from '@/components/OnboardBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { ONB_TOTAL } from '@/lib/onboarding';
import { useTheme } from '@/theme/ThemeProvider';

export type MultiOption = { id: string; emoji: string; label: string };

type Props = {
  step: number;
  title: string;
  subtitle?: string;
  options: MultiOption[];
  /** Selecting this clears every other choice (e.g. "None"). */
  exclusiveId?: string;
  /** Selecting this reveals the custom text field. */
  otherId?: string;
  otherPlaceholder?: string;
  selected: string[];
  custom: string;
  /** Receives a reducer of the latest selection so concurrent taps don't clobber. */
  onSelectedChange: (updater: (prev: string[]) => string[]) => void;
  onCustomChange: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onSkip?: () => void;
};

export function MultiSelectScreen({
  step,
  title,
  subtitle,
  options,
  exclusiveId,
  otherId,
  otherPlaceholder,
  selected,
  custom,
  onSelectedChange,
  onCustomChange,
  onBack,
  onContinue,
  onSkip,
}: Props) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const colW = (Math.min(width, 520) - 22 * 2 - 12) / 2;

  const toggle = (id: string) => {
    onSelectedChange((sel) => {
      if (id === exclusiveId) return sel.includes(id) ? [] : [id];
      let next = sel.filter((x) => x !== exclusiveId); // any pick clears the exclusive one
      next = next.includes(id) ? next.filter((x) => x !== id) : [...next, id];
      return next;
    });
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
        contentContainerStyle={{ padding: 22, paddingTop: 18 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {options.map((o) => {
            const on = selected.includes(o.id);
            return (
              <Pressable
                key={o.id}
                onPress={() => toggle(o.id)}
                style={{
                  width: colW,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  backgroundColor: on ? theme.primary : theme.surface,
                  borderWidth: 1.5,
                  borderColor: on ? theme.primary : theme.border,
                  boxShadow: on
                    ? `0px 10px 22px -14px ${theme.primary}`
                    : '0px 2px 10px rgba(30,28,24,0.04)',
                }}
              >
                <Txt size={20}>{o.emoji}</Txt>
                <Txt
                  w={700}
                  size={14}
                  color={on ? theme.onPrimary : theme.ink}
                  numberOfLines={2}
                  style={{ flex: 1, letterSpacing: -0.1 }}
                >
                  {o.label}
                </Txt>
                {on && (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.onPrimary,
                    }}
                  >
                    <Icon name="check" size={12} color={theme.primary} stroke={3} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {otherId && selected.includes(otherId) && (
          <Field
            value={custom}
            onChangeText={onCustomChange}
            placeholder={otherPlaceholder ?? 'Type your own…'}
            autoFocus
            style={{ marginTop: 14 }}
          />
        )}
      </ScrollView>

      <BottomDock>
        <PrimaryButton onPress={onContinue}>Continue</PrimaryButton>
        {onSkip && (
          <Pressable onPress={onSkip} style={{ paddingVertical: 10, marginTop: 8 }}>
            <Txt w={700} size={15} color={theme.inkSec} style={{ textAlign: 'center' }}>
              Skip for now
            </Txt>
          </Pressable>
        )}
      </BottomDock>
    </ScreenBg>
  );
}
