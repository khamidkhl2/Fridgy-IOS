/** Headline — soft rounded display sans (Fredoka, via the active theme). */
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
          lineHeight: size * 1.18,
          color: color ?? theme.ink,
          letterSpacing: -0.4,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
