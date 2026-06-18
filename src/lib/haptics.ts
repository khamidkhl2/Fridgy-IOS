/**
 * Tiny haptics helpers — subtle, premium feedback (never a long buzz).
 *
 * Wraps expo-haptics; every call is fire-and-forget (errors swallowed) so it's
 * safe to call from any handler and no-ops on web / unsupported devices. A
 * device-local preference (default on) gates all of them, surfaced via
 * `useHapticsEnabled` for the settings toggle.
 *
 * Note: haptics only fire on a real device with the native module linked — the
 * iOS Simulator never vibrates, and they respect the system Sounds & Haptics
 * setting.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useReducer } from 'react';

const KEY = 'fridgy_haptics_enabled';
let enabled = true; // default on; persisted value loads on startup
let dirty = false; // a user toggle happened — don't let the late load clobber it
const listeners = new Set<() => void>();

// Load the saved preference once at startup so imperative haptics.* calls (which
// run outside any component) honor it even before the settings screen mounts.
AsyncStorage.getItem(KEY)
  .then((v) => {
    if (!dirty && v != null) {
      enabled = v === 'true';
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

function fire(run: () => Promise<void>) {
  if (!enabled) return;
  run().catch(() => {});
}

export const haptics = {
  /** Light tap — primary buttons, general taps. */
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Medium tap — toggles, segment switches, confirms. */
  medium: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Selection tick — picking an option, wheel / week-strip changes. */
  selection: () => fire(() => Haptics.selectionAsync()),
  /** Success — save / complete / scan finished. */
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Warning. */
  warning: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Error — failed action. */
  error: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

/** `[enabled, setEnabled]` for the haptics master switch (device-local). */
export function useHapticsEnabled(): [boolean, (v: boolean) => void] {
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);

  const setEnabled = (v: boolean) => {
    dirty = true;
    enabled = v;
    AsyncStorage.setItem(KEY, String(v)).catch(() => {});
    listeners.forEach((l) => l());
    if (v) Haptics.selectionAsync().catch(() => {}); // a confirming tick when turned on
  };

  return [enabled, setEnabled];
}
