/** Recipe summary card — taps through to the full recipe page; ＋ toggles saved. */
import { Pressable, View } from 'react-native';
import { foodEmoji } from '@/lib/foodEmoji';
import { useTheme } from '@/theme/ThemeProvider';
import type { RecipeView } from '@/lib/recipes';
import { Icon } from './Icon';
import { Txt } from './Txt';

export function RecipeCard({
  recipe,
  saved,
  onPress,
  onSave,
}: {
  recipe: RecipeView;
  saved: boolean;
  onPress: () => void;
  onSave: () => void;
}) {
  const { theme } = useTheme();
  const emoji = foodEmoji(recipe.title);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        backgroundColor: theme.surface,
        borderRadius: 18,
        boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt size={30}>{emoji}</Txt>
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            paddingVertical: 3,
            paddingHorizontal: 9,
            borderRadius: 8,
            backgroundColor: theme.bg,
            marginBottom: 5,
          }}
        >
          <Txt w={800} size={10.5} color={theme.inkSec} style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {recipe.mealType}
          </Txt>
        </View>
        <Txt w={800} size={16} color={theme.ink} style={{ letterSpacing: -0.2 }} numberOfLines={2}>
          {recipe.title}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          {recipe.minutes > 0 && (
            <Txt w={600} size={12.5} color={theme.inkSec}>
              {recipe.minutes} min
            </Txt>
          )}
          {recipe.calories > 0 && (
            <Txt w={600} size={12.5} color={theme.inkSec}>
              {recipe.calories} cal
            </Txt>
          )}
          {recipe.usesCount > 0 && (
            <Txt w={600} size={12.5} color={theme.primary}>
              Uses {recipe.usesCount} of yours
            </Txt>
          )}
        </View>
      </View>
      <Pressable
        onPress={onSave}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Remove from saved' : 'Save recipe'}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: saved ? theme.primary : theme.bg,
          borderWidth: saved ? 0 : 1.5,
          borderColor: theme.border,
        }}
      >
        <Icon name={saved ? 'check' : 'plus'} size={18} color={saved ? theme.onPrimary : theme.inkSec} stroke={2.4} />
      </Pressable>
    </Pressable>
  );
}
