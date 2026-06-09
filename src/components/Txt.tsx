/**
 * Plus Jakarta Sans text. `w` picks the loaded weight family (RN can't synthesize
 * weights for custom fonts), so use this everywhere instead of raw <Text>.
 */
import { Text, type TextProps } from 'react-native';
import { jakarta, type Weight } from '@/theme/typography';

type TxtProps = TextProps & {
  w?: Weight;
  size?: number;
  color?: string;
};

export function Txt({ w = 500, size = 15, color = '#1A1A18', style, children, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      style={[{ fontFamily: jakarta(w), fontSize: size, color, includeFontPadding: false }, style]}
    >
      {children}
    </Text>
  );
}
