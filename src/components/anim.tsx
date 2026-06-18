/**
 * Small motion helpers ported from the prototype's CSS keyframes
 * (fdg-pulse / fdg-blink / fdg-scanY / fdg-pop) using the RN Animated API.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** A 0→1→0 looping value (eased in/out), one half-cycle = `duration` ms. */
function useOscillate(duration: number, enabled = true) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!enabled) {
      v.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, enabled, v]);
  return v;
}

/** Wrapper that gently pulses opacity (0.62 ↔ 1). */
export function Pulse({
  enabled = true,
  style,
  children,
}: {
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const v = useOscillate(950, enabled);
  const opacity = enabled ? v.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1] }) : 1;
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

/** A small dot/element that blinks (1 ↔ 0.2). */
export function Blink({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const v = useOscillate(500, true);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] });
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

/** Horizontal laser line that sweeps top→bottom across its (relative) parent. */
export function Scanline({
  color,
  duration = 2600,
  thickness = 2,
}: {
  color: string;
  duration?: number;
  thickness?: number;
}) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, v]);
  const top = v.interpolate({ inputRange: [0, 1], outputRange: ['3%', '93%'] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 6,
        right: 6,
        top,
        height: thickness,
        boxShadow: `0px 0px 10px ${color}`,
      }}
    >
      <LinearGradient
        colors={['transparent', color, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, borderRadius: thickness }}
      />
    </Animated.View>
  );
}

/** Mount entrance: rise + scale + fade in, with optional delay (ms). */
export function Pop({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 460,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, v]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [9, 0] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
