/** Bottom action dock with a fade-up gradient that anchors the primary CTA. */
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { hexA } from '@/theme/themes';

type Props = {
  children: React.ReactNode;
  transparent?: boolean;
};

export function BottomDock({ children, transparent = false }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = { paddingHorizontal: 22, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 16) + 8 };

  if (transparent) {
    return <View style={pad}>{children}</View>;
  }
  return (
    <LinearGradient colors={[hexA(theme.bg, 0), theme.bg]} locations={[0, 0.28]} style={pad}>
      {children}
    </LinearGradient>
  );
}
