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
import { addFridgeItem, deleteFridgeItem, useFridgeItems } from '@/lib/fridge';
import { useNav } from '@/lib/nav';
import { useTheme } from '@/theme/ThemeProvider';

export default function FridgeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { session } = useAuth();
  const { items, loading, reload } = useFridgeItems();

  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

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
            {items.map((it) => (
              <View
                key={it.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 13,
                  backgroundColor: theme.surface,
                  borderRadius: 14,
                  boxShadow: '0px 4px 14px -12px rgba(30,28,24,0.14)',
                }}
              >
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
                  <Icon name={it.source === 'scan' ? 'scan' : 'leaf'} size={18} color={theme.primary} stroke={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt w={700} size={15} color={theme.ink} numberOfLines={1}>
                    {it.name}
                  </Txt>
                  {it.category ? (
                    <Txt w={500} size={12.5} color={theme.inkSec} style={{ marginTop: 1 }}>
                      {it.category}
                    </Txt>
                  ) : null}
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
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBg>
  );
}
