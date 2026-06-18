/** Personal Details — name, sex, date of birth. Each row opens a single-field
 *  editor (see photo #5). */
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { haptics } from '@/lib/haptics';
import { useProfile, useProfileRow } from '@/lib/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { DetailCard, type DetailRow } from '@/components/DetailCard';

function formatDOB(iso: string | null | undefined): string {
  if (!iso) return 'Not set';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'Not set';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export default function PersonalDetailsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { row } = useProfileRow();
  const profile = useProfile();

  const rows: DetailRow[] = [
    { label: 'Name', value: row?.name || profile.displayName || 'Not set', field: 'name' },
    { label: 'Sex', value: row?.gender || 'Not set', field: 'gender' },
    { label: 'Date of birth', value: formatDOB(row?.birth_date), field: 'birthdate' },
  ];

  return (
    <ScreenBg>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 6, paddingHorizontal: 22 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 2px 8px rgba(30,28,24,0.06)' }}
        >
          <Icon name="chevronLeft" size={20} color={theme.ink} stroke={2.2} />
        </Pressable>
        <Txt w={800} size={18} color={theme.ink}>
          Personal Details
        </Txt>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <DetailCard
          rows={rows}
          onPressRow={(r) => {
            haptics.light();
            router.push(`/edit-field?field=${r.field}` as Href);
          }}
        />
      </ScrollView>
    </ScreenBg>
  );
}
