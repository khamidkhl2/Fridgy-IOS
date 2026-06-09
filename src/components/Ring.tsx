/** Circular progress ring (react-native-svg). Rotated -90° so it fills from 12 o'clock. */
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type RingProps = {
  size?: number;
  stroke?: number;
  progress?: number;
  color: string;
  track: string;
  rounded?: boolean;
  children?: React.ReactNode;
};

export function Ring({
  size = 120,
  stroke = 12,
  progress = 0,
  color,
  track,
  rounded = true,
  children,
}: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - clamped);
  const half = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle cx={half} cy={half} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={half}
          cy={half}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap={rounded ? 'round' : 'butt'}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
