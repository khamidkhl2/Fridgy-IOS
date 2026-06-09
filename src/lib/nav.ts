/**
 * Thin wrapper over expo-router that mirrors the prototype's `nav.go(route)` API,
 * so screen code reads the same as the design source.
 */
import { useRouter } from 'expo-router';

export type Dest =
  | 'welcome'
  | 'home'
  | 'scan'
  | 'recipes'
  | 'profile'
  | 'settings'
  | 'fridge'
  | 'savedRecipes'
  | 'dailyTargets'
  | 'editProfile'
  | 'units';

export function useNav() {
  const router = useRouter();
  const go = (dest: Dest) => {
    switch (dest) {
      case 'welcome':
        router.replace('/');
        break;
      case 'home':
        router.navigate('/home');
        break;
      case 'recipes':
        router.navigate('/recipes');
        break;
      case 'profile':
        router.navigate('/profile');
        break;
      case 'scan':
        router.push('/scan');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'fridge':
        router.push('/fridge');
        break;
      case 'savedRecipes':
        router.push('/saved-recipes');
        break;
      case 'dailyTargets':
        router.push('/daily-targets');
        break;
      case 'editProfile':
        router.push('/edit-profile');
        break;
      case 'units':
        router.push('/units');
        break;
    }
  };
  return { go, back: () => router.back() };
}
