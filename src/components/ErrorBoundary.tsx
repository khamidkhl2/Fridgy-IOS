/**
 * App-wide error boundary.
 *
 * Wraps the whole provider tree so a render-time throw anywhere — including in
 * ThemeProvider/AuthProvider/ProfileProvider or any screen — shows a recovery
 * screen instead of a white-screen crash. expo-router's own `ErrorBoundary`
 * export only catches errors in child *routes*, not in the layout's providers,
 * so this class component is the real safety net.
 *
 * The fallback is intentionally self-contained (hardcoded colors, system font):
 * it must render even if the theme layer is what failed, so it can't read from
 * `useTheme()`.
 */
import { Component, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { children: ReactNode };
type State = { error: Error | null };

// Neutral light palette, matching the app's default aesthetic. Hardcoded on
// purpose — see the file header.
const BG = '#FAF8F4';
const INK = '#1E1C18';
const INK_SEC = '#6B675F';
const PRIMARY = '#5B7B5A';
const SURFACE = '#FFFFFF';

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Surface in logs / TestFlight console for diagnosis.
    console.error('Uncaught render error:', error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: SURFACE,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 34 }}>🍃</Text>
          </View>

          <Text style={{ fontSize: 24, fontWeight: '800', color: INK, textAlign: 'center', letterSpacing: -0.3 }}>
            Something went wrong
          </Text>
          <Text
            style={{ fontSize: 15, fontWeight: '500', color: INK_SEC, textAlign: 'center', marginTop: 12, lineHeight: 22 }}
          >
            Fridgy hit an unexpected error. Tap below to try again — your data is safe.
          </Text>

          <Pressable
            onPress={this.reset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={({ pressed }) => ({
              marginTop: 30,
              alignSelf: 'stretch',
              height: 56,
              borderRadius: 16,
              backgroundColor: PRIMARY,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ fontSize: 16.5, fontWeight: '700', color: '#FFFFFF' }}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}
