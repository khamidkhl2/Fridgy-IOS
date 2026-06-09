/** Editorial serif headline — uses the active theme's per-theme headline font. */
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type HProps = {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function H({ children, size = 34, color, style, numberOfLines }: HProps) {
  const { theme } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: theme.headlineFamily,
          fontSize: size,
          // serif display fonts have tall ascenders — needs headroom or the tops clip
          lineHeight: size * 1.2,
          color: color ?? theme.ink,
          letterSpacing: -0.2,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
