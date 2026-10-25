import { StyleSheet, View } from 'react-native';

import { useColors } from '@/design/theme';
import { space } from '@/design/tokens';

import { Text } from './text';

/**
 * Progress is only ever rendered from a value the server confirmed. Nothing in
 * the app invents a completion percentage.
 */
export function ProgressBar({
  value,
  label,
  accessibilityLabel,
  tone = 'primary',
}: {
  /** 0–1. Values outside the range are clamped. */
  value: number;
  label?: string;
  accessibilityLabel?: string;
  tone?: 'primary' | 'accent';
}) {
  const colors = useColors();
  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const percent = Math.round(clamped * 100);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? label ?? 'Progress'}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}%` }}
      style={styles.root}
    >
      {label ? (
        <View style={styles.labelRow}>
          <Text variant="caption" color="textSecondary">
            {label}
          </Text>
          <Text variant="caption" color="textSecondary">
            {percent}%
          </Text>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percent}%`,
              backgroundColor: tone === 'primary' ? colors.primary : colors.accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  track: {
    height: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
