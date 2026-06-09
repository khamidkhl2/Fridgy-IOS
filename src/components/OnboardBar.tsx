/** Onboarding top bar: round back button + segmented progress + step counter. */
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';
import { Txt } from './Txt';

type Props = {
  step?: number;
  total?: number;
  onBack?: () => void;
};

export function OnboardBar({ step = 1, total = 6, onBack }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingTop: insets.top + 6,
        paddingHorizontal: 22,
      }}
    >
      <Pressable
        onPress={onBack}
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: theme.surface,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0px 2px 8px rgba(30,28,24,0.06)',
        }}
      >
        <Icon name="chevronLeft" size={20} color={theme.ink} stroke={2.2} />
      </Pressable>
      <View style={{ flex: 1, flexDirection: 'row', gap: 5 }}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: i < step ? theme.primary : theme.track,
            }}
          />
        ))}
      </View>
      <Txt w={700} size={14} color={theme.inkSec} style={{ fontVariant: ['tabular-nums'] }}>
        {step}/{total}
      </Txt>
    </View>
  );
}
