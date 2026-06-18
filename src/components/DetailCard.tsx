/** Grouped detail list (label · value · pencil) used by the profile sub-screens
 *  — Personal Details and Goals & Body. See photo #5. */
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';
import { Txt } from './Txt';

export type DetailRow = { label: string; value: string; field: string };

export function DetailCard({ rows, onPressRow }: { rows: DetailRow[]; onPressRow: (row: DetailRow) => void }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0px 6px 16px -12px rgba(30,28,24,0.16)',
      }}
    >
      {rows.map((r, i) => (
        <Pressable
          key={r.field}
          onPress={() => onPressRow(r)}
          accessibilityRole="button"
          accessibilityLabel={`${r.label}: ${r.value}. Edit`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 17,
            paddingHorizontal: 16,
            borderTopWidth: i ? 1 : 0,
            borderTopColor: theme.border,
            backgroundColor: pressed ? theme.bg : 'transparent',
          })}
        >
          <Txt w={600} size={15.5} color={theme.inkSec} style={{ flex: 1 }}>
            {r.label}
          </Txt>
          <Txt w={800} size={15.5} color={theme.ink}>
            {r.value}
          </Txt>
          <Icon name="pencil" size={16} color={theme.inkSec} stroke={1.9} />
        </Pressable>
      ))}
    </View>
  );
}
