/** Translucent round control used over the camera (close / help). */
import { Pressable } from 'react-native';
import { Icon, type IconName } from './Icon';

export function GlassBtn({
  icon,
  onPress,
  label,
}: {
  icon: IconName;
  onPress?: () => void;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(20,20,18,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={20} color="#fff" stroke={2} />
    </Pressable>
  );
}
