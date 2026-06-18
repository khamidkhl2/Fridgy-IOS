/** Goals & Body — the inputs that drive calorie/macro targets. Each row opens a
 *  single-field editor (see photo #5). Goal weight lands with the Progress phase. */
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DetailCard, type DetailRow } from '@/components/DetailCard';
import { Icon } from '@/components/Icon';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { haptics } from '@/lib/haptics';
import { useProfileRow } from '@/lib/profile';
import { useTheme } from '@/theme/ThemeProvider';

const KG_PER_LB = 0.453592;
const IN_PER_CM = 2.54;

function fmtWeight(kg: number | null | undefined, metric: boolean): string {
  if (!kg) return 'Not set';
  return metric ? `${Math.round(kg)} kg` : `${Math.round(kg / KG_PER_LB)} lb`;
}
function fmtHeight(cm: number | null | undefined, metric: boolean): string {
  if (!cm) return 'Not set';
  if (metric) return `${Math.round(cm)} cm`;
  const totalIn = Math.round(cm / IN_PER_CM);
  return `${Math.floor(totalIn / 12)}'${totalIn % 12}"`;
}
function fmtTraining(types: string[] | null | undefined): string {
  if (!types || types.length === 0) return 'Not set';
  if (types.length <= 2) return types.join(' · ');
  return `${types.length} types`;
}

export default function GoalsBodyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { row } = useProfileRow();
  const metric = (row?.unit ?? 'imperial') === 'metric';

  const rows: DetailRow[] = [
    { label: 'Goal', value: row?.goal || 'Not set', field: 'goal' },
    { label: 'Current weight', value: fmtWeight(row?.weight_kg, metric), field: 'weight' },
    { label: 'Goal weight', value: fmtWeight(row?.goal_weight_kg, metric), field: 'goalweight' },
    { label: 'Height', value: fmtHeight(row?.height_cm, metric), field: 'height' },
    { label: 'Activity level', value: row?.activity_level || 'Not set', field: 'activity' },
    { label: 'Diet', value: row?.dietary_styles?.[0] || 'Not set', field: 'diet' },
    { label: 'Training', value: fmtTraining(row?.training_types), field: 'training' },
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
          Goals & Body
        </Txt>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <Txt w={500} size={13} color={theme.inkSec} style={{ marginBottom: 14, lineHeight: 19 }}>
          These shape your daily calorie and macro targets. Update any of them and your plan recalculates.
        </Txt>
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
