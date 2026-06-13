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
  /** Sets of mutually-exclusive ids: picking one swaps out any sibling already
   *  chosen (e.g. only one primary diet at a time). */
  exclusiveGroups?: readonly (readonly string[])[];
  /** Max number of (non-exclusive) options selectable. Further picks are blocked. */
  maxSelect?: number;
  /** Selecting this reveals the custom text field. */
  otherId?: string;
  otherPlaceholder?: string;
  selected: string[];
  custom: string;
  /** Optional inline note (e.g. flagging a conflict with an earlier answer). */
  notice?: string | null;
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
  exclusiveGroups,
  maxSelect,
  otherId,
  otherPlaceholder,
  selected,
  custom,
  notice,
  onSelectedChange,
  onCustomChange,
  onBack,
  onContinue,
  onSkip,
}: Props) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const colW = (Math.min(width, 520) - 22 * 2 - 12) / 2;

  const pickCount = selected.filter((x) => x !== exclusiveId).length;
  const atCap = maxSelect != null && pickCount >= maxSelect;

  // True when selecting `id` would replace an already-chosen sibling in its
  // exclusive group — such a pick keeps the count flat, so it's allowed at cap.
  const replacesSibling = (id: string) => {
    const group = exclusiveGroups?.find((g) => g.includes(id));
    return !!group && selected.some((s) => s !== id && group.includes(s));
  };

  const toggle = (id: string) => {
    onSelectedChange((sel) => {
      if (id === exclusiveId) return sel.includes(id) ? [] : [id];
      let next = sel.filter((x) => x !== exclusiveId); // any pick clears the exclusive one
      if (next.includes(id)) {
        next = next.filter((x) => x !== id); // deselect is always allowed
      } else {
        // mutually-exclusive group: a new pick replaces any sibling already chosen
        const group = exclusiveGroups?.find((g) => g.includes(id));
        if (group) next = next.filter((x) => !group.includes(x));
        if (maxSelect != null && next.length >= maxSelect) return sel; // at cap — ignore
        next = [...next, id];
      }
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
        {maxSelect != null && (
          <Txt w={700} size={13} color={atCap ? theme.primary : theme.inkSec} style={{ marginTop: 9 }}>
            {pickCount} of {maxSelect} selected{atCap ? ' · max reached' : ''}
          </Txt>
        )}
        {notice && (
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: theme.primarySoft,
            }}
          >
            <Icon name="bell" size={16} color={theme.primary} stroke={2} />
            <Txt w={600} size={13} color={theme.ink} style={{ flex: 1, lineHeight: 18 }}>
              {notice}
            </Txt>
          </View>
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
            const blocked = !on && atCap && o.id !== exclusiveId && !replacesSibling(o.id);
            return (
              <Pressable
                key={o.id}
                onPress={() => toggle(o.id)}
                disabled={blocked}
                style={{
                  width: colW,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  opacity: blocked ? 0.4 : 1,
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
