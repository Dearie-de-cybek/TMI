import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/design/theme';

/**
 * Small pieces of motion that make the app feel awake without ever getting in
 * the way. Every one of them is switched off when the member has asked for
 * reduced motion.
 */

/** Content that rises into place when it first appears. */
export function Rise({
  children,
  delay = 0,
  style,
}: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const { reduceMotion } = useTheme();

  return (
    <Animated.View
      entering={
        reduceMotion ? undefined : FadeInDown.delay(delay).springify().damping(18).stiffness(140)
      }
      style={style}
    >
      {children}
    </Animated.View>
  );
}

const PIECES = 28;

/**
 * A burst of confetti for the moments the church would clap — a month of
 * decrees prayed, a milestone reached. Square pieces in the app's own colours,
 * one fall and done.
 */
export function Confetti({ height = 420 }: { height?: number }) {
  const { colors, reduceMotion } = useTheme();
  if (reduceMotion) return null;

  const palette = [colors.accentFill, colors.primary, colors.success, colors.accent, colors.danger];

  return (
    <View pointerEvents="none" style={[styles.confetti, { height }]}>
      {Array.from({ length: PIECES }).map((_, index) => (
        <Piece key={index} index={index} height={height} color={palette[index % palette.length]!} />
      ))}
    </View>
  );
}

function Piece({ index, height, color }: { index: number; height: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 35,
      withTiming(1, { duration: 1700 + (index % 5) * 260, easing: Easing.out(Easing.quad) })
    );
  }, [index, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value < 0.75 ? 1 : 1 - (progress.value - 0.75) / 0.25,
    transform: [
      { translateY: progress.value * height },
      { translateX: Math.sin(progress.value * 7 + index) * 20 },
      { rotate: `${progress.value * 540}deg` },
    ],
  }));

  const size = 6 + (index % 3) * 3;

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: `${(index * 37) % 96}%`, width: size, height: size, backgroundColor: color },
        animated,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  piece: {
    position: 'absolute',
    top: -16,
  },
});
