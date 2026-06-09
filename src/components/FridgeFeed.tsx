/**
 * Camera-feed placeholder (a dim fridge interior with faint shelves + a
 * monospace caption). Drop in a real camera view / photo later.
 */
import { type DimensionValue, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Txt } from './Txt';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export function FridgeFeed({ radius = 0, label = true }: { radius?: number; label?: boolean }) {
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      <LinearGradient
        colors={['#2c2e2b', '#1d1f1d', '#141513']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* suggested shelves */}
      {(['28%', '52%', '76%'] as DimensionValue[]).map((p, i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: 0, right: 0, top: p, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }}
        />
      ))}
      <View
        style={{ position: 'absolute', top: '6%', bottom: '6%', left: '50%', width: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}
      />
      {label && (
        <Txt
          style={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: 1,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
          }}
        >
          fridge interior · live camera
        </Txt>
      )}
    </View>
  );
}
