/** Onboarding 10 — Plan loading. Animated 0→100% then auto-advances to auth. */
import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { Pulse } from '@/components/anim';
import { Ring } from '@/components/Ring';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { useGo } from '@/lib/onboarding';
import { useTheme } from '@/theme/ThemeProvider';

const MESSAGES = [
  'Calculating calorie targets…',
  'Setting your macro ratios…',
  'Prioritizing micronutrients…',
  'Matching your dietary style…',
  'Almost ready…',
];

export default function PlanLoadingScreen() {
  const { theme } = useTheme();
  const go = useGo();
  const [prog] = useState(() => new Animated.Value(0));
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = prog.addListener(({ value }) => setPct(Math.round(value * 100)));
    const anim = Animated.timing(prog, {
      toValue: 1,
      duration: 3200,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) go.replace('/auth');
    });
    return () => {
      prog.removeListener(id);
      anim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const msg = MESSAGES[Math.min(MESSAGES.length - 1, Math.floor((pct / 100) * MESSAGES.length))];
  const barWidth = prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ScreenBg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 }}>
        <Pulse>
          <Ring size={188} stroke={14} progress={pct / 100} color={theme.primary} track={theme.track}>
            <View style={{ alignItems: 'center' }}>
              <Txt w={800} size={46} color={theme.ink} style={{ letterSpacing: -1, fontVariant: ['tabular-nums'] }}>
                {pct}%
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <Icon name="sparkle" size={14} color={theme.accent} stroke={1.6} fill={theme.accent} />
                <Txt w={700} size={12.5} color={theme.inkSec}>
                  Building plan
                </Txt>
              </View>
            </View>
          </Ring>
        </Pulse>

        <H size={26} style={{ marginTop: 40, textAlign: 'center' }}>
          Crafting your plan
        </H>

        {/* progress bar */}
        <View
          style={{
            width: '100%',
            maxWidth: 320,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.track,
            overflow: 'hidden',
            marginTop: 20,
          }}
        >
          <Animated.View style={{ width: barWidth, height: '100%', backgroundColor: theme.primary, borderRadius: 4 }} />
        </View>

        <Txt w={600} size={14.5} color={theme.inkSec} style={{ marginTop: 16, textAlign: 'center' }}>
          {msg}
        </Txt>
      </View>
    </ScreenBg>
  );
}
