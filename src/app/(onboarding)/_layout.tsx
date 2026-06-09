/** Onboarding stack: linear flow from name → … → auth. */
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8F7F4' },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="loading" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
