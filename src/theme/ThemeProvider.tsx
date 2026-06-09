/**
 * App-wide theme context.
 *
 * Two independent choices, both persisted:
 *  - `themeIndex` — the colour palette (Sage, Terracotta, …).
 *  - `mode` — 'system' | 'light' | 'dark'. Resolves to an effective scheme; in
 *    dark the active palette is run through `makeDark()`. We also push the choice
 *    to the OS via `Appearance.setColorScheme` so native chrome (keyboard,
 *    alerts, status bar) matches.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { makeDark, THEMES, type Theme } from './themes';

const KEY_THEME = 'fridgy_theme';
const KEY_MODE = 'fridgy_mode';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  themeIndex: number;
  setThemeIndex: (i: number) => void;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  /** Resolved scheme after applying `mode` (+ system setting). */
  scheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeIndex, setThemeIndexState] = useState(0);
  const [mode, setModeState] = useState<ThemeMode>('system');

  // hydrate persisted choices
  useEffect(() => {
    AsyncStorage.multiGet([KEY_THEME, KEY_MODE]).then((pairs) => {
      const map = Object.fromEntries(pairs);
      const i = map[KEY_THEME] == null ? NaN : Number(map[KEY_THEME]);
      if (Number.isFinite(i) && THEMES[i]) setThemeIndexState(i);
      const m = map[KEY_MODE];
      if (m === 'light' || m === 'dark' || m === 'system') setModeState(m);
    });
  }, []);

  // mirror the chosen mode to the OS so native UI matches ('unspecified' = follow
  // system). Native only — react-native-web has no setColorScheme.
  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
    }
  }, [mode]);

  const setThemeIndex = (i: number) => {
    setThemeIndexState(i);
    AsyncStorage.setItem(KEY_THEME, String(i)).catch(() => {});
  };

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY_MODE, m).catch(() => {});
  };

  const scheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(() => {
    const base = THEMES[themeIndex];
    return {
      theme: scheme === 'dark' ? makeDark(base) : base,
      themeIndex,
      setThemeIndex,
      mode,
      setMode,
      scheme,
    };
  }, [themeIndex, mode, scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
