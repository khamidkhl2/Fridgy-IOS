/** Corner brackets for the scan frame — clean outer L at each corner. */
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Pulse } from './anim';

type Props = {
  color: string;
  glow?: boolean;
  animate?: boolean;
  inset?: number;
  len?: number;
  /** arm thickness */
  w?: number;
  /** rounded cap radius on the arm ends */
  r?: number;
};

/**
 * Each corner is two bars (one horizontal, one vertical) meeting at a sharp outer
 * corner — an outer "L", with no inner squared/rounded corner.
 */
export function Brackets({ color, glow = false, animate = false, inset = 0, len = 30, w = 3, r = 0 }: Props) {
  const cap = Math.min(r, w / 2);
  const glowStyle: ViewStyle = glow ? { boxShadow: `0px 0px 7px ${color}` } : {};
  const bar = (key: string, extra: ViewStyle) => (
    <View key={key} style={[{ position: 'absolute', backgroundColor: color, borderRadius: cap }, extra, glowStyle]} />
  );
  return (
    <Pulse enabled={animate} style={StyleSheet.absoluteFill}>
      {/* top-left */}
      {bar('tl-h', { top: inset, left: inset, width: len, height: w })}
      {bar('tl-v', { top: inset, left: inset, width: w, height: len })}
      {/* top-right */}
      {bar('tr-h', { top: inset, right: inset, width: len, height: w })}
      {bar('tr-v', { top: inset, right: inset, width: w, height: len })}
      {/* bottom-left */}
      {bar('bl-h', { bottom: inset, left: inset, width: len, height: w })}
      {bar('bl-v', { bottom: inset, left: inset, width: w, height: len })}
      {/* bottom-right */}
      {bar('br-h', { bottom: inset, right: inset, width: len, height: w })}
      {bar('br-v', { bottom: inset, right: inset, width: w, height: len })}
    </Pulse>
  );
}
