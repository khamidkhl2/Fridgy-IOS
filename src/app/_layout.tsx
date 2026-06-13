import 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/auth';
import { OnboardingProvider } from '@/lib/onboarding';
import { PreferenceSync } from '@/lib/preferences';
import { ProfileProvider } from '@/lib/profile';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { FONT_MAP } from '@/theme/typography';

SplashScreen.preventAutoHideAsync();

/** Navigator that follows the active theme for its background + status bar. */
function RootNavigator() {
  const { theme, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scan"
          options={{ animation: 'fade', contentStyle: { backgroundColor: '#141513' } }}
        />
        <Stack.Screen
          name="scan-meal"
          options={{ animation: 'fade', contentStyle: { backgroundColor: '#141513' } }}
        />
        <Stack.Screen name="add-food" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="fridge" />
        <Stack.Screen name="saved-recipes" />
        <Stack.Screen name="recipe" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="units" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts(FONT_MAP);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ProfileProvider>
                <PreferenceSync />
                <OnboardingProvider>
                  <RootNavigator />
                </OnboardingProvider>
              </ProfileProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
