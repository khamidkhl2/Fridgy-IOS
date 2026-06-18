/**
 * Font registry + helpers.
 * Body/UI font is Plus Jakarta Sans (5 weights); headlines use Fredoka, a soft
 * rounded display sans (friendly, matches the logo). RN doesn't synthesize
 * weights for custom fonts, so we map a numeric weight to the matching loaded
 * family via `jakarta()`.
 */
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';

/** Soft rounded display sans used for every headline (see <H>). */
export const HEADLINE_FONT = 'Fredoka_600SemiBold';

/** Passed to useFonts() in the root layout. */
export const FONT_MAP = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
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
