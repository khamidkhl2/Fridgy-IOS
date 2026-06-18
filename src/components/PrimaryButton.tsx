/** Full-width primary pill button with press + haptic feedback. */
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { Txt } from './Txt';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Screen-reader label; defaults to the text when `children` is a string. */
  accessibilityLabel?: string;
};

export function PrimaryButton({ children, onPress, disabled = false, style, accessibilityLabel }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={
        onPress &&
        (() => {
          haptics.light();
          onPress();
        })
      }
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      style={({ pressed }) => [
        {
          width: '100%',
          height: 60,
          borderRadius: 18,
          backgroundColor: disabled ? theme.track : theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: disabled ? undefined : `0px 10px 22px -10px ${theme.primary}`,
          transform: [{ scale: pressed && !disabled ? 0.975 : 1 }],
          opacity: pressed && !disabled ? 0.94 : 1,
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Txt w={700} size={18} color={disabled ? theme.inkSec : theme.onPrimary} style={{ letterSpacing: 0.1 }}>
          {children}
        </Txt>
      ) : (
        children
      )}
    </Pressable>
  );
}
