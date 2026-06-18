/**
 * iOS-style scroll "drum" picker. `Wheel` is a single column; wrap one or more
 * in `WheelGroup` to get the shared centre selection band + edge fades.
 *
 * Built on a plain ScrollView (works on native + web): snap interval keeps items
 * aligned, and we settle to the nearest row when scrolling goes idle.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hexA } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { Txt } from './Txt';

export const ITEM_H = 42;
const VISIBLE = 5; // odd, so one row is dead-centre
export const WHEEL_H = ITEM_H * VISIBLE;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

type WheelProps<T extends string | number> = {
  items: T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
};

export function Wheel<T extends string | number>({ items, value, onChange, format }: WheelProps<T>) {
  const { theme } = useTheme();
  const ref = useRef<FlatList<T>>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [center, setCenter] = useState(() => Math.max(0, items.indexOf(value)));

  // Centering item i means scrolling to offset i*ITEM_H (the PAD top inset puts
  // item 0 in the centre slot at offset 0).
  const offsetFor = (i: number) => i * ITEM_H;

  // align to the incoming value on mount / when it changes from outside
  useEffect(() => {
    const idx = items.indexOf(value);
    if (idx < 0) return;
    requestAnimationFrame(() => {
      setCenter(idx);
      ref.current?.scrollToOffset({ offset: offsetFor(idx), animated: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items.length]);

  const nearest = (y: number) => Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setCenter(nearest(y));
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => settle(y), 140);
  };

  const settle = (y: number) => {
    const idx = nearest(y);
    ref.current?.scrollToOffset({ offset: offsetFor(idx), animated: true });
    if (items[idx] !== value) onChange(items[idx]);
  };

  return (
    <FlatList
      ref={ref}
      data={items}
      keyExtractor={(it) => String(it)}
      extraData={center}
      // Virtualized: only the visible window mounts, so a 300+ row weight wheel
      // scrolls smoothly. getItemLayout (fixed row height incl. the PAD inset)
      // lets scrollToOffset jump anywhere without measuring.
      getItemLayout={(_, index) => ({ length: ITEM_H, offset: PAD + index * ITEM_H, index })}
      style={{ flex: 1, height: WHEEL_H }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={onScroll}
      onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
      contentContainerStyle={{ paddingVertical: PAD }}
      initialNumToRender={VISIBLE + 2}
      maxToRenderPerBatch={VISIBLE + 2}
      windowSize={5}
      renderItem={({ item, index }) => {
        const dist = Math.abs(index - center);
        const on = dist === 0;
        return (
          <View style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <Txt
              w={on ? 800 : 600}
              size={on ? 20 : 17}
              color={on ? theme.ink : theme.inkSec}
              style={{ opacity: on ? 1 : dist === 1 ? 0.5 : 0.28, fontVariant: ['tabular-nums'] }}
            >
              {format ? format(item) : String(item)}
            </Txt>
          </View>
        );
      }}
    />
  );
}

/** Surface card that frames one or more `Wheel`s with a centre band + top/bottom fades. */
export function WheelGroup({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0px 8px 22px -14px rgba(30,28,24,0.2)',
      }}
    >
      <View style={{ height: WHEEL_H }}>
        {/* centre selection band */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: PAD,
            height: ITEM_H,
            borderRadius: 13,
            backgroundColor: theme.track,
          }}
        />
        <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>{children}</View>
        {/* edge fades */}
        <LinearGradient
          colors={[theme.surface, hexA(theme.surface, 0)]}
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: PAD }}
        />
        <LinearGradient
          colors={[hexA(theme.surface, 0), theme.surface]}
          pointerEvents="none"
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: PAD }}
        />
      </View>
    </View>
  );
}
