/** Small rounded sage brand mark with a leaf glyph. */
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';

export function LeafMark({ size = 26 }: { size?: number }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="leaf" size={size * 0.66} color={theme.onPrimary} stroke={2} />
    </View>
  );
}
