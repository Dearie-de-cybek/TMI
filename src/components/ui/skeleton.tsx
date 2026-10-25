import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';

import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';

/**
 * Skeletons stand in for content while it loads. Full-screen spinners are only
 * used where there is genuinely nothing to outline (for example a payment
 * hand-off), because a blank spinner tells the member nothing about what is coming.
 *
 * The pulse is disabled when reduce-motion is on.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  style?: ViewStyle;
}) {
  const { colors, reduceMotion } = useTheme();
  const pulse = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (reduceMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, reduceMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius.xs,
          backgroundColor: colors.skeleton,
          opacity: reduceMotion ? 1 : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
        },
        style,
      ]}
    />
  );
}

/** Placeholder matching the shape of a content row. */
export function SkeletonRow({ withThumbnail = true }: { withThumbnail?: boolean }) {
  return (
    <View style={styles.row}>
      {withThumbnail ? <Skeleton width={64} height={64} /> : null}
      <View style={styles.rowText}>
        <Skeleton width="38%" height={10} />
        <Skeleton width="86%" height={16} />
        <Skeleton width="54%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4, withThumbnail = true }: { count?: number; withThumbnail?: boolean }) {
  return (
    <View accessibilityLabel="Loading" accessible>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index} withThumbnail={withThumbnail} />
      ))}
    </View>
  );
}

/** Placeholder for the full-bleed featured block on Home and course detail. */
export function SkeletonFeature() {
  return (
    <View style={styles.feature}>
      <Skeleton height={220} />
      <View style={styles.featureText}>
        <Skeleton width="30%" height={10} />
        <Skeleton width="75%" height={24} />
        <Skeleton width="45%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.gutter,
  },
  rowText: {
    flex: 1,
    gap: space.sm,
  },
  feature: {
    gap: space.md,
  },
  featureText: {
    gap: space.sm,
    paddingHorizontal: space.gutter,
  },
});
