/** Saved recipes — the user's favourited recipes from the recipes tab. */
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { RecipeCard } from '@/components/RecipeCard';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useNav } from '@/lib/nav';
import { setActiveRecipe, useSavedRecipes, viewFromRow } from '@/lib/recipes';
import { useTheme } from '@/theme/ThemeProvider';

export default function SavedRecipesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { recipes, loading, remove } = useSavedRecipes();

  const open = (row: (typeof recipes)[number]) => {
    setActiveRecipe(viewFromRow(row));
    router.push('/recipe');
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
          Saved recipes
        </Txt>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
        ) : recipes.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
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
              <Icon name="book" size={32} color={theme.primary} stroke={1.7} />
            </View>
            <H size={21} style={{ textAlign: 'center' }}>
              No saved recipes yet
            </H>
            <Txt w={500} size={14.5} color={theme.inkSec} style={{ textAlign: 'center', marginTop: 8, lineHeight: 21 }}>
              Tap ＋ on any recipe in the Recipes tab to keep it here.
            </Txt>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {recipes.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={viewFromRow(r)}
                saved
                onPress={() => open(r)}
                onSave={() => remove(r.title)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBg>
  );
}
