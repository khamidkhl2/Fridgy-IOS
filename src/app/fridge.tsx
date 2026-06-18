/** My fridge — inventory of detected/added ingredients, with manual add + remove. */
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field } from '@/components/Field';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/lib/auth';
import { addFridgeItem, deleteFridgeItem, updateFridgeItemExpiry, useFridgeItems } from '@/lib/fridge';
import { foodEmoji } from '@/lib/foodEmoji';
import { useNav } from '@/lib/nav';
import { daysUntil } from '@/lib/shelfLife';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/themes';

export default function FridgeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { session } = useAuth();
  const { items, loading, reload } = useFridgeItems();

  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  // inline expiry editor: which item is open + its draft date
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Date>(new Date());

  const openEditor = (id: string, expiresAt: string | null) => {
    setEditingId(id);
    setDraft(expiresAt ? new Date(expiresAt) : new Date());
  };

  const adjustDraft = (deltaDays: number) =>
    setDraft((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + deltaDays);
      const today = startOfToday();
      return next < today ? today : next;
    });

  const saveDraft = async () => {
    if (!editingId) return;
    await updateFridgeItemExpiry(editingId, draft.toISOString());
    setEditingId(null);
    reload();
  };

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed || !session?.user) return;
    setAdding(true);
    const row = await addFridgeItem(session.user.id, trimmed);
    setAdding(false);
    if (!row) {
      Alert.alert('Could not add item', 'Please try again.');
      return;
    }
    setName('');
    reload();
  };

  const remove = async (id: string) => {
    if (editingId === id) setEditingId(null);
    await deleteFridgeItem(id);
    reload();
  };

  return (
    <ScreenBg>
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
          My fridge
        </Txt>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* manual add */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          <Field
            value={name}
            onChangeText={setName}
            placeholder="Add an ingredient"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={add}
            style={{ flex: 1 }}
          />
          <Pressable
            onPress={add}
            disabled={!name.trim() || adding}
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: name.trim() ? theme.primary : theme.track,
            }}
          >
            <Icon name="plus" size={24} color={name.trim() ? theme.onPrimary : theme.inkSec} stroke={2.4} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: theme.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <Icon name="fridge" size={32} color={theme.primary} stroke={1.7} />
            </View>
            <H size={21} style={{ textAlign: 'center' }}>
              Your fridge is empty
            </H>
            <Txt w={500} size={14.5} color={theme.inkSec} style={{ textAlign: 'center', marginTop: 8, marginBottom: 22, lineHeight: 21 }}>
              Add ingredients above, or scan your fridge to detect them automatically.
            </Txt>
            <View style={{ width: '100%' }}>
              <PrimaryButton onPress={() => nav.go('scan')}>Scan your fridge</PrimaryButton>
            </View>
          </View>
        ) : (
          <View style={{ gap: 9 }}>
            <Txt w={600} size={12.5} color={theme.inkSec} style={{ marginBottom: 2 }}>
              {items.length} item{items.length > 1 ? 's' : ''}
            </Txt>
            {items.map((it) => {
              const chip = expiryChip(it.expires_at, theme);
              const editing = editingId === it.id;
              return (
                <View
                  key={it.id}
                  style={{
                    padding: 13,
                    backgroundColor: theme.surface,
                    borderRadius: 14,
                    boxShadow: '0px 4px 14px -12px rgba(30,28,24,0.14)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                      <Txt size={20}>{foodEmoji(it.name)}</Txt>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt w={700} size={15} color={theme.ink} numberOfLines={1}>
                        {it.name}
                      </Txt>
                      {/* expiry chip — tap to edit the date */}
                      <Pressable
                        onPress={() => (editing ? setEditingId(null) : openEditor(it.id, it.expires_at))}
                        hitSlop={6}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, alignSelf: 'flex-start' }}
                      >
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: chip.color }} />
                        <Txt w={600} size={12.5} color={chip.color}>
                          {chip.label}
                        </Txt>
                        <Icon name="pencil" size={11} color={theme.inkSec} stroke={2} />
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={() => remove(it.id)}
                      hitSlop={8}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.bg,
                      }}
                    >
                      <Icon name="close" size={16} color={theme.inkSec} stroke={2.4} />
                    </Pressable>
                  </View>

                  {/* inline date editor */}
                  {editing && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 13,
                        paddingTop: 13,
                        borderTopWidth: 1,
                        borderTopColor: theme.border,
                      }}
                    >
                      <Txt w={600} size={12.5} color={theme.inkSec}>
                        Expires
                      </Txt>
                      <StepBtn theme={theme} symbol="−" onPress={() => adjustDraft(-1)} label="Minus one day" />
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Txt w={800} size={14.5} color={theme.ink}>
                          {fmtDate(draft)}
                        </Txt>
                        <Txt w={500} size={11.5} color={theme.inkSec}>
                          {relativeLabel(draft)}
                        </Txt>
                      </View>
                      <StepBtn theme={theme} symbol="+" onPress={() => adjustDraft(1)} label="Plus one day" />
                      <Pressable
                        onPress={saveDraft}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                          borderRadius: 11,
                          backgroundColor: theme.primary,
                        }}
                      >
                        <Txt w={800} size={13} color={theme.onPrimary}>
                          Save
                        </Txt>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

// ── expiry helpers ───────────────────────────────────────────────────────────

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "Today" / "Tomorrow" / "in N days" for the editor preview. */
function relativeLabel(d: Date): string {
  const days = daysUntil(d.toISOString());
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

/** Color-coded chip text + dot for an item's expiry state. */
function expiryChip(expiresAt: string | null, theme: Theme): { label: string; color: string } {
  if (!expiresAt) return { label: 'No date', color: theme.inkSec };
  const d = daysUntil(expiresAt);
  if (d < 0) return { label: 'Expired', color: theme.protein };
  if (d === 0) return { label: 'Expires today', color: theme.protein };
  if (d === 1) return { label: 'Expires tomorrow', color: theme.fat };
  if (d <= 2) return { label: `${d} days left`, color: theme.fat };
  return { label: `${d} days left`, color: theme.inkSec };
}

function StepBtn({
  theme,
  symbol,
  onPress,
  label,
}: {
  theme: Theme;
  symbol: string;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={{
        width: 34,
        height: 34,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
      }}
    >
      <Txt w={800} size={19} color={theme.ink}>
        {symbol}
      </Txt>
    </Pressable>
  );
}
