/**
 * Profile state for the app.
 *
 * `ProfileProvider` is the single owner of the authenticated user's `profiles`
 * row: it fetches the row, caches the local onboarding answers (AsyncStorage),
 * and runs the one-time onboarding → profile sync after sign-in. Screens read
 * derived views through `useProfile` (UI identity) and `useTargets` (nutrition
 * goals); `useProfileRow` exposes the raw row for anything else.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { IconName } from '@/components/Icon';
import { useAuth } from './auth';
import {
  fetchProfile,
  fetchProfileOutcome,
  onboardingTargets,
  rowTargets,
  saveOnboardingToProfile,
  type ProfileRow,
} from './db';
import type { OnboardingData } from './onboarding';
import type { Targets } from './targets';

const GOAL_ICON: Record<string, IconName> = {
  'Lose weight': 'trendDown',
  'Build muscle': 'dumbbell',
  'Maintain weight': 'scale',
  'Eat healthier': 'leaf',
};

export type UserProfile = {
  displayName: string;
  firstName: string;
  initials: string;
  email?: string;
  goal?: string;
  goalIcon: IconName;
};

type ProfileCtx = {
  /** Authoritative profile row, or null while loading / unreachable. */
  row: ProfileRow | null;
  /** Locally-cached onboarding answers (offline fallback). */
  local: Record<string, unknown>;
  loading: boolean;
  /** True when the last row fetch failed (offline / flaky), as opposed to
   *  succeeding with no row. Lets the launch gate avoid a wrongful re-onboard. */
  loadFailed: boolean;
  /** Re-fetch the row from the DB. */
  refresh: () => void;
};

const Context = createContext<ProfileCtx | null>(null);

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [row, setRow] = useState<ProfileRow | null>(null);
  const [local, setLocal] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // authoritative profile row (all state updates happen inside the async runner,
  // never synchronously in the effect body)
  useEffect(() => {
    let active = true;
    (async () => {
      if (!userId) {
        if (active) {
          setRow(null);
          setLoadFailed(false);
          setLoading(false);
        }
        return;
      }
      if (active) setLoading(true);
      const outcome = await fetchProfileOutcome(userId).catch(() => ({ row: null, ok: false }));
      if (active) {
        setRow(outcome.row);
        setLoadFailed(!outcome.ok);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, nonce]);

  // local onboarding cache (drives the UI before the row loads / offline).
  // Re-reads on refresh() too, so freshly-saved onboarding answers are picked up
  // immediately after finishing the flow (not just on the next user change).
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('userData').then((v) => {
      if (!active || !v) return;
      try {
        setLocal(JSON.parse(v));
      } catch {
        /* ignore malformed cache */
      }
    });
    return () => {
      active = false;
    };
  }, [userId, nonce]);

  // one-time onboarding → profile sync (skips if already onboarded elsewhere)
  const syncedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || syncedFor.current === userId) return;
    syncedFor.current = userId;
    (async () => {
      const cached = await AsyncStorage.getItem('userData');
      if (!cached) return; // this device didn't onboard — DB is source of truth
      const existing = await fetchProfile(userId);
      if (existing?.onboarded) return;
      const data = JSON.parse(cached) as OnboardingData;
      await saveOnboardingToProfile(userId, data);
      refresh();
    })().catch(() => {
      /* best-effort; the local copy still drives the UI */
    });
  }, [userId, refresh]);

  const value = useMemo<ProfileCtx>(
    () => ({ row, local, loading, loadFailed, refresh }),
    [row, local, loading, loadFailed, refresh]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useProfileRow(): ProfileCtx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useProfileRow must be used within <ProfileProvider>');
  return ctx;
}

/** Derived identity for the UI (name/initials/email/goal). */
export function useProfile(): UserProfile {
  const { session } = useAuth();
  const { row, local } = useProfileRow();

  const meta = (session?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const email = session?.user?.email ?? undefined;

  const remoteName = row?.name?.trim() || '';
  const localName = typeof local.name === 'string' ? local.name.trim() : '';
  const providerName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    '';
  const displayName =
    remoteName || localName || providerName || (email ? email.split('@')[0] : '') || 'there';

  const localGoal = typeof local.goal === 'string' && local.goal ? local.goal : undefined;
  const goal = row?.goal || localGoal || undefined;

  return {
    displayName,
    firstName: displayName.split(/\s+/)[0],
    initials: initialsOf(displayName),
    email,
    goal,
    goalIcon: (goal && GOAL_ICON[goal]) || 'leaf',
  };
}

/** Daily nutrition targets: stored row values, else computed from row/local data. */
export function useTargets(): Targets | null {
  const { row, local } = useProfileRow();
  return rowTargets(row) ?? onboardingTargets(local as unknown as OnboardingData);
}
