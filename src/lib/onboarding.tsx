/**
 * Onboarding state + persistence.
 *
 * `OnboardingProvider` holds the in-progress answers for the first-launch flow,
 * hydrates the `onboardingComplete` flag from AsyncStorage on mount, and exposes
 * `finish()` which persists everything and flips the flag. The root layout wraps
 * the whole app so both the launch gate (index) and the flow screens can read it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Unit = 'imperial' | 'metric';
export type BirthDate = { month: string; day: number; year: number };

export type OnboardingData = {
  name: string;
  goal: string;
  dietaryStyles: string[];
  customDietaryStyle: string;
  allergies: string[];
  customAllergy: string;
  gender: string;
  birthDate: BirthDate;
  /** Metric: centimetres. Imperial: total inches. (See `unit`.) */
  height: number;
  /** Metric: kilograms. Imperial: pounds. (See `unit`.) */
  weight: number;
  unit: Unit;
  activityLevel: string;
  trainingTypes: string[];
  customTrainingType: string;
};

const DEFAULTS: OnboardingData = {
  name: '',
  goal: '',
  dietaryStyles: [],
  customDietaryStyle: '',
  allergies: [],
  customAllergy: '',
  gender: '',
  birthDate: { month: 'January', day: 1, year: 2000 },
  height: 68, // 5'8"
  weight: 150,
  unit: 'imperial',
  activityLevel: '',
  trainingTypes: [],
  customTrainingType: '',
};

const KEY_DATA = 'userData';
const KEY_DONE = 'onboardingComplete';

/** A flat patch, or a function of the latest state → patch (for safe concurrent merges). */
export type OnboardingPatch =
  | Partial<OnboardingData>
  | ((prev: OnboardingData) => Partial<OnboardingData>);

type Ctx = {
  data: OnboardingData;
  update: (patch: OnboardingPatch) => void;
  /** Persist all answers and mark onboarding complete. */
  finish: () => Promise<void>;
  /** `null` while hydrating from storage, then the boolean flag. */
  isOnboarded: boolean | null;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(DEFAULTS);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  // keep a live ref so finish() always persists the latest answers
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    AsyncStorage.getItem(KEY_DONE)
      .then((v) => setIsOnboarded(v === 'true'))
      .catch(() => setIsOnboarded(false));
  }, []);

  const update = useCallback((patch: OnboardingPatch) => {
    setData((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) }));
  }, []);

  const finish = useCallback(async () => {
    try {
      await AsyncStorage.multiSet([
        [KEY_DATA, JSON.stringify(dataRef.current)],
        [KEY_DONE, 'true'],
      ]);
    } catch {
      // best-effort; still advance into the app
    }
    setIsOnboarded(true);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ data, update, finish, isOnboarded }),
    [data, update, finish, isOnboarded]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): Ctx {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within <OnboardingProvider>');
  return ctx;
}

/**
 * The nine data-collecting steps, in order. Drives the progress bar; the
 * loading + auth screens sit outside this list.
 */
export const DATA_STEPS = [
  'name',
  'goal',
  'dietary',
  'allergies',
  'gender',
  'birthdate',
  'body',
  'activity',
  'training',
] as const;

export type DataStep = (typeof DATA_STEPS)[number];

export const ONB_TOTAL = DATA_STEPS.length;

/** 1-based position of a data step (for the OnboardBar). */
export function stepOf(name: DataStep): number {
  return DATA_STEPS.indexOf(name) + 1;
}

/**
 * Thin router wrapper for the flow. Route strings are resolved at runtime by
 * expo-router (typed-routes regenerate when the bundler runs), so the cast just
 * keeps the call sites readable.
 */
export function useGo() {
  const router = useRouter();
  return {
    push: (href: string) => router.push(href as Href),
    replace: (href: string) => router.replace(href as Href),
    back: () => router.back(),
  };
}
