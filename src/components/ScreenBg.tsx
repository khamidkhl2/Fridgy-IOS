/** Themed screen background: subtle vertical gradient (light) or a flat dark fill. */
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

export function ScreenBg({
  children,
  dark = false,
  bg,
}: {
  children: React.ReactNode;
  dark?: boolean;
  bg?: string;
}) {
  const { theme } = useTheme();
  if (dark) {
    return <View style={{ flex: 1, backgroundColor: bg ?? '#141513' }}>{children}</View>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient colors={theme.appBg} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}
