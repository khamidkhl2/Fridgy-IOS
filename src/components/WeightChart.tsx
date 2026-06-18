/** Minimal weight trend line chart (SVG): line + soft area fill, point dots, and
 *  a dashed goal line. Pure presentation — pass values already in display units. */
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { View } from 'react-native';
import { Txt } from './Txt';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  values: number[];
  goal?: number | null;
  width: number;
  height?: number;
  unit: string;
};

export function WeightChart({ values, goal, width, height = 150, unit }: Props) {
  const { theme } = useTheme();
  const padX = 14;
  const padY = 16;
  const w = Math.max(0, width);
  const h = height;

  // include the goal in the vertical range so its line is on-screen
  const pool = goal != null ? [...values, goal] : values;
  let lo = Math.min(...pool);
  let hi = Math.max(...pool);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  }
  if (hi - lo < 2) {
    lo -= 1;
    hi += 1;
  }
  const span = hi - lo;

  const x = (i: number) => (values.length <= 1 ? w / 2 : padX + (i / (values.length - 1)) * (w - padX * 2));
  const y = (v: number) => padY + (1 - (v - lo) / span) * (h - padY * 2);

  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const areaPath =
    values.length > 0
      ? `M ${x(0)},${y(values[0])} ` + values.map((v, i) => `L ${x(i)},${y(v)}`).join(' ') + ` L ${x(values.length - 1)},${h - padY} L ${x(0)},${h - padY} Z`
      : '';

  return (
    <View>
      <Svg width={w} height={h}>
        {goal != null && (
          <Line x1={padX} y1={y(goal)} x2={w - padX} y2={y(goal)} stroke={theme.accent} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.9} />
        )}
        {values.length > 1 && <Path d={areaPath} fill={theme.primary} opacity={0.08} />}
        {values.length > 1 && <Polyline points={pts} fill="none" stroke={theme.primary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />}
        {values.map((v, i) => (
          <Circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={i === values.length - 1 ? 5 : 3}
            fill={i === values.length - 1 ? theme.primary : theme.surface}
            stroke={theme.primary}
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Txt w={600} size={11} color={theme.inkSec}>
          {Math.round(lo)} {unit}
        </Txt>
        {goal != null && (
          <Txt w={700} size={11} color={theme.accent}>
            Goal {Math.round(goal)} {unit}
          </Txt>
        )}
        <Txt w={600} size={11} color={theme.inkSec}>
          {Math.round(hi)} {unit}
        </Txt>
      </View>
    </View>
  );
}
