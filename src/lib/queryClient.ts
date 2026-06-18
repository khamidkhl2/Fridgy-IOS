/**
 * Shared TanStack Query client + the app's query keys.
 *
 * One client backs every data hook so the per-tab refetches collapse into a
 * single cached fetch (deduped within `staleTime`). Mutations invalidate the
 * relevant key so changes propagate without each screen re-fetching on focus.
 *
 * Keys are user-scoped, so signing in as a different account reads a fresh key
 * rather than the previous user's cache. Invalidating by prefix (e.g. ['logs'])
 * matches every user/day variant.
 */
import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // focusing a tab within 30s reuses the cache, no refetch
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

export const qk = {
  logs: (userId?: string | null) => ['logs', userId] as const,
  fridge: (userId?: string | null) => ['fridge', userId] as const,
  savedRecipes: (userId?: string | null) => ['savedRecipes', userId] as const,
  water: (userId?: string | null, day?: string) => ['water', userId, day] as const,
  weights: (userId?: string | null) => ['weights', userId] as const,
};

/** Invalidate every variant of a key family (any user/day). */
export const invalidate = {
  logs: () => queryClient.invalidateQueries({ queryKey: ['logs'] }),
  fridge: () => queryClient.invalidateQueries({ queryKey: ['fridge'] }),
  savedRecipes: () => queryClient.invalidateQueries({ queryKey: ['savedRecipes'] }),
  water: () => queryClient.invalidateQueries({ queryKey: ['water'] }),
  weights: () => queryClient.invalidateQueries({ queryKey: ['weights'] }),
};

// React Native has no window 'focus' event, so feed AppState into TanStack's
// focus manager: returning to the foreground refetches stale queries.
AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});
