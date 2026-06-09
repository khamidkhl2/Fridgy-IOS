/** Animated corner brackets for the scan frame. */
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Pulse } from './anim';

type Props = {
  color: string;
  glow?: boolean;
  animate?: boolean;
  inset?: number;
  len?: number;
  /** border width */
  w?: number;
  /** corner radius */
  r?: number;
};

export function Brackets({ color, glow = false, animate = false, inset = 0, len = 30, w = 3, r = 10 }: Props) {
  const glowStyle: ViewStyle = glow ? { boxShadow: `0px 0px 7px ${color}` } : {};
  const corner = (key: string, extra: ViewStyle) => (
    <View key={key} style={[{ position: 'absolute', width: len, height: len }, extra, glowStyle]} />
  );
  return (
    <Pulse enabled={animate} style={StyleSheet.absoluteFill}>
      {corner('tl', { top: inset, left: inset, borderTopWidth: w, borderLeftWidth: w, borderColor: color, borderTopLeftRadius: r })}
      {corner('tr', { top: inset, right: inset, borderTopWidth: w, borderRightWidth: w, borderColor: color, borderTopRightRadius: r })}
      {corner('bl', { bottom: inset, left: inset, borderBottomWidth: w, borderLeftWidth: w, borderColor: color, borderBottomLeftRadius: r })}
      {corner('br', { bottom: inset, right: inset, borderBottomWidth: w, borderRightWidth: w, borderColor: color, borderBottomRightRadius: r })}
    </Pulse>
  );
}
