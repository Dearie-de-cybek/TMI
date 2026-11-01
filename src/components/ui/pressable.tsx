import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import {
  Platform,
  Pressable as RNPressable,
  type PressableProps as RNPressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/design/theme';
import { minTouchTarget } from '@/design/tokens';

export type PressableProps = Omit<RNPressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Style merged in while the press is active. Defaults to a tonal fill. */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Opacity feedback instead of a tonal fill - used over imagery. */
  feedback?: 'tonal' | 'opacity' | 'none';
  haptic?: boolean;
  /** Skips the 44pt minimum height, for inline text links inside paragraphs. */
  inline?: boolean;
};

/**
 * Base pressable. Guarantees a 44pt minimum touch target, a visible pressed
 * state that works in both schemes, and an accessibility role of `button`
 * unless the caller overrides it.
 */
export function Pressable({
  style,
  pressedStyle,
  feedback = 'tonal',
  haptic = false,
  inline = false,
  onPress,
  accessibilityRole = 'button',
  ...rest
}: PressableProps) {
  const { colors } = useTheme();

  const handlePress = useCallback<NonNullable<RNPressableProps['onPress']>>(
    (event) => {
      if (haptic && Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
      onPress?.(event);
    },
    [haptic, onPress]
  );

  return (
    <RNPressable
      accessibilityRole={accessibilityRole}
      onPress={onPress ? handlePress : undefined}
      hitSlop={inline ? 8 : undefined}
      style={({ pressed }) => [
        !inline && { minHeight: minTouchTarget, justifyContent: 'center' },
        style,
        pressed && feedback === 'tonal' ? { backgroundColor: colors.surfacePressed } : null,
        pressed && feedback === 'opacity' ? { opacity: 0.72 } : null,
        pressed ? pressedStyle : null,
      ]}
      {...rest}
    />
  );
}
