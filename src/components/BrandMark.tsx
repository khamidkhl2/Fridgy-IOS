/**
 * Fridgy brand mark — a vector recreation of the app icon (hand-drawn fridge +
 * sage leaves on a soft ground shadow). Transparent and theme-aware (ink outline
 * + sage leaves), so it sits cleanly on any screen and scales crisply, unlike the
 * raster app icon. Used wherever the brand shows: welcome + sign-in.
 */
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export function BrandMark({ size = 26 }: { size?: number }) {
  const { theme } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* soft sage ground shadow — the icon's signature */}
      <Ellipse cx="22" cy="44" rx="15" ry="2.2" fill={theme.primary} opacity={0.22} />

      {/* fridge — charcoal ink outline */}
      <G stroke={theme.ink} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="10" y="5" width="20" height="35" rx="5.5" />
        <Path d="M10 16.5 H30" />
        <Path d="M14.5 20 V25.5" />
      </G>

      {/* two leaves — sage, sprouting from the lower-right */}
      <G fill={theme.primary}>
        <Path d="M34 33 C 33 29, 36 25.5, 40.5 25 C 40.5 29, 38 32.5, 34 33 Z" />
        <Path d="M34 33 C 36 34.5, 39.5 35, 43 33.5 C 41.5 30.5, 37.5 30.5, 34 33 Z" />
      </G>
      <Path d="M31 36 Q 33 34 34 33" stroke={theme.primary} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
