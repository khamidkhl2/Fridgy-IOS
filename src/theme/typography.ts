/**
 * Font registry + helpers.
 * Body/UI font is Plus Jakarta Sans (5 weights); headlines use per-theme serifs.
 * RN doesn't synthesize weights for custom fonts, so we map a numeric weight to
 * the matching loaded family via `jakarta()`.
 */
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { Spectral_700Bold } from '@expo-google-fonts/spectral';
import { Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';
import { SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4';

/** Passed to useFonts() in the root layout. */
export const FONT_MAP = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  DMSerifDisplay_400Regular,
  Spectral_700Bold,
  Newsreader_600SemiBold,
  SourceSerif4_600SemiBold,
};

export type Weight = 400 | 500 | 600 | 700 | 800;

/** Resolve a numeric weight to the matching Plus Jakarta Sans family. */
export function jakarta(weight: Weight = 500): string {
  switch (weight) {
    case 400:
      return 'PlusJakartaSans_400Regular';
    case 500:
      return 'PlusJakartaSans_500Medium';
    case 600:
      return 'PlusJakartaSans_600SemiBold';
    case 700:
      return 'PlusJakartaSans_700Bold';
    case 800:
      return 'PlusJakartaSans_800ExtraBold';
  }
}
