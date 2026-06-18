/**
 * Keeps scheduled notifications in sync with app state. Mounted once (in the root
 * layout, inside the auth/profile providers) and renders nothing.
 *
 * Re-runs each category's sync whenever its inputs change, and re-runs all three
 * when the app returns to the foreground (so reminders stay fresh as items/logs
 * change, the day rolls over, and the win-back timer is pushed forward).
 */
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from './auth';
import { groupByMeal, logsForDay, useRecentLogs, useToday, type MealType } from './food';
import { useFridgeItems } from './fridge';
import {
  syncExpiryReminders,
  syncLifecycleReminders,
  syncMealReminders,
  useNotifPref,
} from './notifications';

/** Meals that already have at least one log on `dayISO`. */
function loggedMealsFor(logs: ReturnType<typeof useRecentLogs>['logs'], dayISO: string): Set<MealType> {
  const grouped = groupByMeal(logsForDay(logs, dayISO));
  const set = new Set<MealType>();
  (Object.keys(grouped) as MealType[]).forEach((m) => {
    if (grouped[m].length > 0) set.add(m);
  });
  return set;
}

export function NotificationSync() {
  const { session } = useAuth();
  const { items } = useFridgeItems();
  const { logs } = useRecentLogs();
  const today = useToday();

  // Only schedule for a signed-in user. When signed out, the flags resolve to
  // false so every sync cancels its pending reminders (no stray nudges after
  // logout or during onboarding).
  const signedIn = !!session?.user;
  const [expiryPref] = useNotifPref('expiry');
  const [mealPref] = useNotifPref('meal');
  const [lifecyclePref] = useNotifPref('lifecycle');
  const expiryOn = expiryPref && signedIn;
  const mealOn = mealPref && signedIn;
  const lifecycleOn = lifecyclePref && signedIn;

  // expiry — depends on fridge contents
  useEffect(() => {
    void syncExpiryReminders(items, expiryOn);
  }, [items, expiryOn]);

  // meal — depends on which of today's meals are logged
  useEffect(() => {
    const loggedToday = loggedMealsFor(logs, today);
    void syncMealReminders({ todayISO: today, loggedToday, enabled: mealOn });
  }, [logs, today, mealOn]);

  // lifecycle — depends only on whether the fridge is empty
  useEffect(() => {
    void syncLifecycleReminders({ fridgeEmpty: items.length === 0, enabled: lifecycleOn });
  }, [items.length, lifecycleOn]);

  // foreground — refresh everything (rolls win-back forward, re-checks the day)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s !== 'active') return;
      void syncExpiryReminders(items, expiryOn);
      void syncMealReminders({ todayISO: today, loggedToday: loggedMealsFor(logs, today), enabled: mealOn });
      void syncLifecycleReminders({ fridgeEmpty: items.length === 0, enabled: lifecycleOn });
    });
    return () => sub.remove();
  }, [items, logs, today, expiryOn, mealOn, lifecycleOn]);

  return null;
}
