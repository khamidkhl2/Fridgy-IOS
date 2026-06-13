/**
 * Fridgy — design-system theme tokens (ported from the design bundle's themes.js).
 * 5 palettes: the sage spec (default) + 4 alternates varying palette / mood / headline font.
 * `headlineFamily` maps to a loaded font (see typography.ts); `appBg` is a 2-stop gradient.
 */

export type Theme = {
  id: string;
  name: string;
  mood: string;
  /** Loaded serif font family used for editorial headlines. */
  headlineFamily: string;
  bg: string;
  surface: string;
  ink: string;
  inkSec: string;
  border: string;
  primary: string;
  primaryDeep: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  protein: string;
  proteinSoft: string;
  carbs: string;
  carbsSoft: string;
  fat: string;
  fatSoft: string;
  track: string;
  /** Subtle top→bottom app background gradient. */
  appBg: [string, string];
};

export const THEMES: Theme[] = [
  {
    id: 'sage',
    name: 'Sage',
    mood: 'Warm & encouraging',
    headlineFamily: 'DMSerifDisplay_400Regular',
    bg: '#F6F1E8',
    surface: '#FFFDF9',
    ink: '#1A1A18',
    inkSec: '#6E6962',
    border: '#EBE4D7',
    primary: '#4A7C59',
    primaryDeep: '#3C6649',
    primarySoft: '#E8EEE2',
    onPrimary: '#FFFFFF',
    accent: '#E8A838',
    accentSoft: '#FBEFD6',
    protein: '#D8694B',
    proteinSoft: '#FAE7E1',
    carbs: '#E8A838',
    carbsSoft: '#FBEFD6',
    fat: '#5E7A8C',
    fatSoft: '#E5EBEF',
    track: '#ECE5D7',
    appBg: ['#FAF5ED', '#F2EBDF'],
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    mood: 'Cozy & earthy',
    headlineFamily: 'Spectral_700Bold',
    bg: '#FAF5EF',
    surface: '#FFFFFF',
    ink: '#241A14',
    inkSec: '#7A6A5E',
    border: '#ECE1D4',
    primary: '#B85C38',
    primaryDeep: '#9E4C2D',
    primarySoft: '#F6E6DC',
    onPrimary: '#FFFFFF',
    accent: '#E0A11E',
    accentSoft: '#F9ECCE',
    protein: '#C0533F',
    proteinSoft: '#F7E2DA',
    carbs: '#E0A11E',
    carbsSoft: '#F9ECCE',
    fat: '#8A7B5C',
    fatSoft: '#EFEADE',
    track: '#EFE6DB',
    appBg: ['#FCF8F2', '#F6EFE5'],
  },
  {
    id: 'charcoal',
    name: 'Charcoal & Citron',
    mood: 'Bold & modern',
    headlineFamily: 'Newsreader_600SemiBold',
    bg: '#F4F4F1',
    surface: '#FFFFFF',
    ink: '#1A1D1B',
    inkSec: '#686D69',
    border: '#E4E5E0',
    primary: '#232826',
    primaryDeep: '#141815',
    primarySoft: '#E7E8E4',
    onPrimary: '#FFFFFF',
    accent: '#9FB22F',
    accentSoft: '#EEF2D6',
    protein: '#D85A4A',
    proteinSoft: '#F7E1DD',
    carbs: '#9FB22F',
    carbsSoft: '#EEF2D6',
    fat: '#6B7A82',
    fatSoft: '#E6EAEC',
    track: '#E9E9E4',
    appBg: ['#FAFAF8', '#F1F1ED'],
  },
  {
    id: 'plum',
    name: 'Plum & Honey',
    mood: 'Elegant & calm',
    headlineFamily: 'SourceSerif4_600SemiBold',
    bg: '#F7F4F6',
    surface: '#FFFFFF',
    ink: '#20171E',
    inkSec: '#6F646C',
    border: '#EBE2E8',
    primary: '#5A3A54',
    primaryDeep: '#4A2E45',
    primarySoft: '#EFE7ED',
    onPrimary: '#FFFFFF',
    accent: '#E3A04E',
    accentSoft: '#F9ECD6',
    protein: '#D06B7E',
    proteinSoft: '#F6E3E8',
    carbs: '#E3A04E',
    carbsSoft: '#F9ECD6',
    fat: '#7E6E8A',
    fatSoft: '#EAE6EE',
    track: '#EEE8EC',
    appBg: ['#FBF8FA', '#F4EFF2'],
  },
  {
    id: 'teal',
    name: 'Teal & Amber',
    mood: 'Fresh & clean',
    headlineFamily: 'DMSerifDisplay_400Regular',
    bg: '#F2F6F5',
    surface: '#FFFFFF',
    ink: '#15201E',
    inkSec: '#5E716E',
    border: '#DCE8E5',
    primary: '#1C6E68',
    primaryDeep: '#155954',
    primarySoft: '#DCEDEB',
    onPrimary: '#FFFFFF',
    accent: '#E8A838',
    accentSoft: '#FBEFD6',
    protein: '#DC6A52',
    proteinSoft: '#F8E3DD',
    carbs: '#E8A838',
    carbsSoft: '#FBEFD6',
    fat: '#4E7E86',
    fatSoft: '#DFEAEC',
    track: '#E3EDEB',
    appBg: ['#F8FBFA', '#EFF5F3'],
  },
];

/** rgba() string from a #rrggbb hex + alpha — used for fades/overlays. */
export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Relative luminance (0–1) of a #hex color. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const n = parseInt(full, 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** Shared dark neutrals (warm, near-black) used by every dark variant. */
const DARK_NEUTRALS = {
  bg: '#121311',
  surface: '#1D1F1B',
  ink: '#F2F1EC',
  inkSec: '#9EA29A',
  border: '#2D302B',
  track: '#2C2F29',
  appBg: ['#141513', '#0D0E0C'] as [string, string],
};

/**
 * Derive a dark variant of a (light) theme: swap the neutrals for dark ones,
 * keep the accent/macro hues, and rebuild the soft tints as low-alpha overlays
 * so they read correctly on dark surfaces. The primary is swapped to the accent
 * if it's too dark to show on a dark background (e.g. the Charcoal theme).
 */
export function makeDark(t: Theme): Theme {
  const primary = luminance(t.primary) > 0.18 ? t.primary : t.accent;
  const onPrimary = luminance(primary) > 0.55 ? '#15140F' : '#FFFFFF';
  return {
    ...t,
    ...DARK_NEUTRALS,
    primary,
    primaryDeep: primary,
    onPrimary,
    primarySoft: hexA(primary, 0.18),
    accentSoft: hexA(t.accent, 0.18),
    proteinSoft: hexA(t.protein, 0.18),
    carbsSoft: hexA(t.carbs, 0.18),
    fatSoft: hexA(t.fat, 0.2),
  };
}
