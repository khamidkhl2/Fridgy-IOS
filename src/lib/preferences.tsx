/**
 * Syncs device UI preferences (color theme, light/dark mode, water unit) to the
 * user's profile so they follow the account across devices.
 *
 * First sync per user: if the profile has no saved prefs yet (NULL), upload the
 * device's current local prefs; otherwise hydrate the local stores from the
 * cloud. After that, any pref change is written back to the profile.
 *
 * Mounted inside ProfileProvider (so it can read the row) but below
 * ThemeProvider (so it can drive the theme).
 */
import { useEffect, useRef } from 'react';
import { useAuth } from './auth';
import { updateProfile } from './db';
import { useProfileRow } from './profile';
import { useWaterUnit, type WaterUnit } from './water';
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];
const UNITS: WaterUnit[] = ['glasses', 'ml', 'oz'];

export function PreferenceSync() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const { row } = useProfileRow();
  const { themeIndex, mode, setThemeIndex, setMode } = useTheme();
  const [waterUnit, setWaterUnit] = useWaterUnit();

  const hydratedFor = useRef<string | null>(null);

  // first sync per user: cloud → local, or upload local if cloud is unset
  useEffect(() => {
    if (!userId || !row || hydratedFor.current === userId) return;
    hydratedFor.current = userId;

    const hasCloudPrefs = row.theme_index != null || row.theme_mode != null || row.water_unit != null;
    if (hasCloudPrefs) {
      if (typeof row.theme_index === 'number') setThemeIndex(row.theme_index);
      if (row.theme_mode && MODES.includes(row.theme_mode as ThemeMode)) setMode(row.theme_mode as ThemeMode);
      if (row.water_unit && UNITS.includes(row.water_unit as WaterUnit)) setWaterUnit(row.water_unit as WaterUnit);
    } else {
      updateProfile(userId, { theme_index: themeIndex, theme_mode: mode, water_unit: waterUnit }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, row]);

  // ongoing: local → cloud whenever a preference changes (after first sync)
  useEffect(() => {
    if (!userId || hydratedFor.current !== userId) return;
    updateProfile(userId, { theme_index: themeIndex, theme_mode: mode, water_unit: waterUnit }).catch(() => {});
  }, [userId, themeIndex, mode, waterUnit]);

  return null;
}
