/** Themed single-line text input with a focus-highlight border. */
import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { jakarta } from '@/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';

export function Field({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...rest}
      placeholderTextColor={theme.inkSec}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        {
          backgroundColor: theme.surface,
          borderWidth: 1.5,
          borderColor: focused ? theme.primary : theme.border,
          borderRadius: 16,
          paddingHorizontal: 16,
          height: 58,
          fontFamily: jakarta(600),
          fontSize: 17,
          color: theme.ink,
        },
        style,
      ]}
    />
  );
}
