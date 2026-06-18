/**
 * Local (on-device) notifications. Three categories, all scheduled on the phone
 * with no backend or push tokens:
 *
 *   - expiry   — a heads-up REMINDER_LEAD_DAYS before each fridge item expires.
 *   - meal     — nudges at meal times for meals not yet logged today.
 *   - lifecycle— re-engagement: win-back when away, empty-fridge nudge.
 *
 * Each category has a `sync*` entry point that cancels its own previously-
 * scheduled notifications (matched on `data.type`) and re-schedules from the
 * current app state. Callers just re-run them whenever the relevant data — or
 * the category's enabled preference — changes. Because cancellation is scoped by
 * `data.type`, the three categories never clobber each other.
 *
 * Local notifications can't run code when they fire, so anything "conditional"
 * (skip a meal you already logged, fire only if you've been away) is achieved by
 * re-computing the schedule every time the app is foregrounded.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useReducer } from 'react';
import { Platform } from 'react-native';
import type { MealType } from './food';
import type { FridgeItem } from './fridge';
import { daysUntil } from './shelfLife';

export const REMINDER_LEAD_DAYS = 2; // expiry: days before expiry to remind
export const REMINDER_HOUR = 9; // expiry reminder time (local)
export const MEAL_HOURS: Record<'breakfast' | 'lunch' | 'dinner', number> = {
  breakfast: 9,
  lunch: 13,
  dinner: 19,
};
const MEAL_LOOKAHEAD_DAYS = 2; // also pre-schedule the next 2 days as a fallback
export const WINBACK_DAYS = [3, 7]; // inactivity nudges, rolling
const WINBACK_HOUR = 11;
const EMPTY_FRIDGE_HOUR = 9;
const MAX_EXPIRY_SCHEDULED = 30; // stay well under iOS's 64 pending-notification limit
const ANDROID_CHANNEL_ID = 'fridgy-reminders';

export type NotifCategory = 'expiry' | 'meal' | 'lifecycle';

// Foreground presentation: show a banner, no sound/badge for these gentle nudges.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ── permission ───────────────────────────────────────────────────────────────

/**
 * Ensure we can post notifications: returns true if already granted or the user
 * grants when prompted, false otherwise. Also (re)creates the Android channel.
 */
export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return next.granted;
}

/** Whether the OS currently allows notifications (no prompt). */
export async function hasPermission(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

// ── shared scheduling helpers ────────────────────────────────────────────────

/** Cancel every notification we previously scheduled for one category. */
async function cancelByType(type: NotifCategory): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => (n.content.data as { type?: string } | undefined)?.type === type)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

function scheduleAt(
  date: Date,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

// ── expiry ───────────────────────────────────────────────────────────────────

/** The moment a reminder for `expiresAt` should fire, or null if it's in the past. */
function expiryReminderDate(expiresAt: string, now: Date): Date | null {
  const exp = new Date(expiresAt);
  const fire = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate() - REMINDER_LEAD_DAYS, REMINDER_HOUR, 0, 0);
  return fire.getTime() > now.getTime() ? fire : null;
}

function expiryBody(expiresAt: string, now: Date): string {
  const d = daysUntil(expiresAt, now);
  if (d <= 0) return 'It expires today — use it before it goes bad.';
  if (d === 1) return 'It expires tomorrow — use it before it goes bad.';
  return `It expires in ${d} days — use it before it goes bad.`;
}

/**
 * Reconcile expiry reminders with the current fridge. One reminder per item
 * whose lead-time is still in the future, soonest first, capped at MAX.
 */
export async function syncExpiryReminders(items: FridgeItem[], enabled: boolean): Promise<void> {
  await cancelByType('expiry');
  if (!enabled || !(await hasPermission())) return;

  const now = new Date();
  const due = items
    .filter((it) => it.expires_at)
    .map((it) => ({ it, fire: expiryReminderDate(it.expires_at as string, now) }))
    .filter((x): x is { it: FridgeItem; fire: Date } => x.fire !== null)
    .sort((a, b) => a.fire.getTime() - b.fire.getTime())
    .slice(0, MAX_EXPIRY_SCHEDULED);

  await Promise.all(
    due.map(({ it, fire }) =>
      scheduleAt(fire, `${it.name} is expiring soon 🥬`, expiryBody(it.expires_at as string, now), {
        type: 'expiry',
        itemId: it.id,
      })
    )
  );
}

// ── meal reminders ───────────────────────────────────────────────────────────

const MEALS: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];

/** Date for a meal `offset` days from `todayISO` at its configured hour. */
function mealDate(todayISO: string, offset: number, hour: number): Date {
  const d = new Date(`${todayISO}T00:00:00`);
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * Reconcile meal reminders. For today, only schedule meals not already logged
 * (and whose time hasn't passed); for the next MEAL_LOOKAHEAD_DAYS, schedule all
 * three as a fallback in case the app isn't opened those days. Re-running on each
 * foreground/log change keeps "today" accurate.
 */
export async function syncMealReminders(opts: {
  todayISO: string;
  loggedToday: Set<MealType>;
  enabled: boolean;
}): Promise<void> {
  await cancelByType('meal');
  if (!opts.enabled || !(await hasPermission())) return;

  const now = new Date();
  const jobs: Promise<string>[] = [];
  for (let offset = 0; offset <= MEAL_LOOKAHEAD_DAYS; offset++) {
    for (const meal of MEALS) {
      if (offset === 0 && opts.loggedToday.has(meal)) continue;
      const fire = mealDate(opts.todayISO, offset, MEAL_HOURS[meal]);
      if (fire.getTime() <= now.getTime()) continue;
      jobs.push(
        scheduleAt(fire, `Time to log your ${meal} 🍽️`, "Keep your streak going — add what you've eaten.", {
          type: 'meal',
          meal,
          offset,
        })
      );
    }
  }
  await Promise.all(jobs);
}

// ── lifecycle (re-engagement) ────────────────────────────────────────────────

/**
 * Reconcile lifecycle nudges. Win-back reminders are scheduled N days out and
 * pushed forward every foreground, so they only fire after a real absence. The
 * empty-fridge nudge is scheduled only while the fridge is empty.
 */
export async function syncLifecycleReminders(opts: { fridgeEmpty: boolean; enabled: boolean }): Promise<void> {
  await cancelByType('lifecycle');
  if (!opts.enabled || !(await hasPermission())) return;

  const now = new Date();
  const jobs: Promise<string>[] = [];

  for (const days of WINBACK_DAYS) {
    const fire = new Date(now);
    fire.setDate(fire.getDate() + days);
    fire.setHours(WINBACK_HOUR, 0, 0, 0);
    if (fire.getTime() <= now.getTime()) continue;
    jobs.push(
      scheduleAt(fire, 'Your fridge misses you 👋', "Come see what's fresh and plan your next meal.", {
        type: 'lifecycle',
        kind: 'winback',
        days,
      })
    );
  }

  if (opts.fridgeEmpty) {
    const fire = new Date(now);
    fire.setDate(fire.getDate() + 1);
    fire.setHours(EMPTY_FRIDGE_HOUR, 0, 0, 0);
    if (fire.getTime() > now.getTime()) {
      jobs.push(
        scheduleAt(fire, 'Your fridge is empty 🛒', 'Scan your groceries to start tracking freshness.', {
          type: 'lifecycle',
          kind: 'empty',
        })
      );
    }
  }

  await Promise.all(jobs);
}

// ── enabled preferences (per-category, AsyncStorage-backed tiny stores) ───────
// Mirrors the useFoodUnit pattern in food.ts so the settings screen and the
// background sync component share one source of truth without prop-drilling.

const PREF_KEY: Record<NotifCategory, string> = {
  expiry: 'fridgy_notifications_enabled', // legacy key — keep so existing opt-ins persist
  meal: 'fridgy_notif_meal',
  lifecycle: 'fridgy_notif_lifecycle',
};

type BoolStore = { value: boolean; loaded: boolean; dirty: boolean; listeners: Set<() => void> };
const stores: Record<NotifCategory, BoolStore> = {
  expiry: { value: false, loaded: false, dirty: false, listeners: new Set() },
  meal: { value: false, loaded: false, dirty: false, listeners: new Set() },
  lifecycle: { value: false, loaded: false, dirty: false, listeners: new Set() },
};

/** `[enabled, setEnabled]` for one notification category's master switch. */
export function useNotifPref(cat: NotifCategory): [boolean, (v: boolean) => void] {
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const store = stores[cat];
    store.listeners.add(force);
    if (!store.loaded) {
      store.loaded = true;
      AsyncStorage.getItem(PREF_KEY[cat]).then((v) => {
        if (!store.dirty && v != null) {
          store.value = v === 'true';
          store.listeners.forEach((l) => l());
        }
      });
    }
    return () => {
      store.listeners.delete(force);
    };
  }, [cat]);

  const setEnabled = (v: boolean) => {
    const store = stores[cat];
    store.dirty = true;
    store.value = v;
    AsyncStorage.setItem(PREF_KEY[cat], String(v)).catch(() => {});
    store.listeners.forEach((l) => l());
  };

  return [stores[cat].value, setEnabled];
}
