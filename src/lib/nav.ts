/**
 * Thin wrapper over expo-router that mirrors the prototype's `nav.go(route)` API,
 * so screen code reads the same as the design source.
 */
import { useRouter, type Href } from 'expo-router';

export type Dest =
  | 'welcome'
  | 'home'
  | 'scan'
  | 'scanMeal'
  | 'recipes'
  | 'profile'
  | 'settings'
  | 'fridge'
  | 'savedRecipes'
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
      case 'scanMeal':
        // cast: typed-routes cache may lag a freshly-added route file
        router.push('/scan-meal' as Href);
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
