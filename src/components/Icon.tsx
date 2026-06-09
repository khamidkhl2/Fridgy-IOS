/**
 * Fridgy line-icon set (ported from the bundle's icons.jsx) on react-native-svg.
 * Monochrome strokes; pass `color`, `size`, `stroke` (width) and optional `fill`.
 */
import { type ReactNode } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'flame' | 'trendDown' | 'dumbbell' | 'scale' | 'leaf' | 'drumstick'
  | 'wheat' | 'droplet' | 'plus' | 'home' | 'scan' | 'book' | 'user'
  | 'chevronLeft' | 'close' | 'help' | 'check' | 'bell' | 'sparkle'
  | 'image' | 'pencil' | 'grid' | 'fridge' | 'bolt' | 'apple' | 'camera';

const PATHS: Record<IconName, (color: string) => ReactNode> = {
  flame: () => (
    <>
      <Path d="M12 3c.6 3 3.4 4.3 3.4 7.5A3.4 3.4 0 0 1 12 14a3.4 3.4 0 0 1-3.4-3.5C8.6 7.3 11.4 6 12 3Z" />
      <Path d="M6.5 13.5C6.5 17.6 9 21 12 21s5.5-3.4 5.5-7.5c0-1.7-.6-3.2-1.5-4.4.1 4-2 5.4-4 5.4-1.4 0-2.6-1-2.7-2.8-1.4 1-2.8 2.6-2.8 4.3Z" />
    </>
  ),
  trendDown: () => (
    <>
      <Path d="M4 7l7 7 3-3 6 6" />
      <Path d="M20 12v5h-5" />
    </>
  ),
  dumbbell: () => <Path d="M6.5 8.5v7M3.5 10v4M17.5 8.5v7M20.5 10v4M6.5 12h11" />,
  scale: () => (
    <>
      <Path d="M12 4v15M7 19h10" />
      <Path d="M5 8h14l-2.2 5.2a3 3 0 0 1-5.6 0L9 8" />
      <Path d="M5 8 7 4l5 1 5-1 2 4" />
    </>
  ),
  leaf: () => (
    <>
      <Path d="M5 19c0-7 4-12 14-13 0 9-4 14-11 14-2 0-3-1-3-1Z" />
      <Path d="M9 16c2-3 4-5 8-7" />
    </>
  ),
  drumstick: () => (
    <>
      <Path d="M14.5 4.2a4.5 4.5 0 0 1 1.4 7.2c-1.3 1.3-2.9 1.3-4 2.4-1.2 1.2-1.1 3-2.6 3.6a2.4 2.4 0 0 1-3-3c.6-1.5 2.4-1.4 3.6-2.6 1.1-1.1 1.1-2.7 2.4-4a4.5 4.5 0 0 1 2.2-3.2Z" />
      <Path d="M8.3 14.7 5.6 17.4M7 13.4 4.3 16.1" />
    </>
  ),
  wheat: () => (
    <>
      <Path d="M12 21V9" />
      <Path d="M12 9c-2-1-3-3-2.5-5C11.5 5 12.5 7 12 9ZM12 9c2-1 3-3 2.5-5C12.5 5 11.5 7 12 9ZM12 14c-2-1-3-3-2.5-5C11.5 10 12.5 12 12 14ZM12 14c2-1 3-3 2.5-5C12.5 10 11.5 12 12 14ZM12 19c-2-1-3-3-2.5-5C11.5 15 12.5 17 12 19ZM12 19c2-1 3-3 2.5-5C12.5 15 11.5 17 12 19Z" />
    </>
  ),
  droplet: () => <Path d="M12 3.5c3 4 5.5 6.6 5.5 9.8A5.5 5.5 0 0 1 12 19a5.5 5.5 0 0 1-5.5-5.7C6.5 10.1 9 7.5 12 3.5Z" />,
  plus: () => <Path d="M12 5v14M5 12h14" />,
  home: () => (
    <>
      <Path d="M4 11 12 4l8 7" />
      <Path d="M6 9.5V20h12V9.5" />
      <Path d="M10 20v-5h4v5" />
    </>
  ),
  scan: () => (
    <>
      <Path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16" />
      <Circle cx="12" cy="12" r="3.2" />
    </>
  ),
  book: () => (
    <>
      <Path d="M5 5.5A2 2 0 0 1 7 4h11v14H7a2 2 0 0 0-2 2V5.5Z" />
      <Path d="M5 18.5A2 2 0 0 1 7 20h11" />
    </>
  ),
  user: () => (
    <>
      <Circle cx="12" cy="8.5" r="3.5" />
      <Path d="M5.5 20c.6-3.3 3.2-5 6.5-5s5.9 1.7 6.5 5" />
    </>
  ),
  chevronLeft: () => <Path d="M14.5 5 8 12l6.5 7" />,
  close: () => <Path d="M6 6l12 12M18 6 6 18" />,
  help: (color) => (
    <>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M9.5 9.5a2.5 2.5 0 0 1 4.8.8c0 1.7-2.3 2-2.3 3.7" />
      <Circle cx="12" cy="17" r="0.9" fill={color} stroke="none" />
    </>
  ),
  check: () => <Path d="M5 12.5 10 17l9-10" />,
  bell: () => (
    <>
      <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <Path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  sparkle: () => (
    <>
      <Path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z" />
      <Path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </>
  ),
  image: () => (
    <>
      <Rect x="4" y="5" width="16" height="14" rx="2.5" />
      <Circle cx="9" cy="10" r="1.6" />
      <Path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
    </>
  ),
  pencil: () => (
    <>
      <Path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" />
      <Path d="M14 7l3 3" />
    </>
  ),
  grid: () => (
    <>
      <Rect x="4.5" y="4.5" width="6" height="6" rx="1.5" />
      <Rect x="13.5" y="4.5" width="6" height="6" rx="1.5" />
      <Rect x="4.5" y="13.5" width="6" height="6" rx="1.5" />
      <Rect x="13.5" y="13.5" width="6" height="6" rx="1.5" />
    </>
  ),
  fridge: () => (
    <>
      <Rect x="6" y="3" width="12" height="18" rx="2.5" />
      <Path d="M6 10h12" />
      <Path d="M9 6.5v1.5M9 12.5v3" />
    </>
  ),
  bolt: () => <Path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />,
  apple: () => (
    <>
      <Path d="M12 7c-1.5-1.3-4-1.6-5.6.2-1.7 2-1.2 5.4.6 7.8C8 16.6 9.4 18 11 18c.7 0 1.3-.3 1-1M12 7c1.5-1.3 4-1.6 5.6.2 1.7 2 1.2 5.4-.6 7.8C16 16.6 14.6 18 13 18" />
      <Path d="M12 7c0-1.5.5-3 2-3.6" />
    </>
  ),
  camera: () => (
    <>
      <Path d="M4 8.5A2 2 0 0 1 6 6.5h1.5l1-1.8h5l1 1.8H21a2 2 0 0 1 2 2" />
      <Rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <Circle cx="12" cy="13" r="3.4" />
    </>
  ),
};

type IconProps = {
  name: IconName;
  size?: number;
  /** stroke width */
  stroke?: number;
  color?: string;
  fill?: string;
};

export function Icon({ name, size = 24, stroke = 1.8, color = '#000', fill = 'none' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      >
        {PATHS[name](color)}
      </G>
    </Svg>
  );
}
