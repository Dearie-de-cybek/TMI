import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { dayKey } from '@/features/devotion/progress-store';

/**
 * The streak ribbon.
 *
 * Seven dots for the last seven days, filled where the member prayed or read.
 * It is deliberately quiet: this is a church, not a fitness app, and a broken
 * streak should read as an invitation rather than a failure — so there is no
 * red, no scolding, and the copy for zero is "start today".
 */
export function StreakRibbon({
  streakDays,
  lastActiveOn,
  longestStreakDays,
}: {
  streakDays: number;
  lastActiveOn: string | null;
  longestStreakDays: number;
}) {
  const colors = useColors();

  // Walk back seven days and mark the ones the streak covers.
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    const key = dayKey(date);
    const daysBeforeLast =
      lastActiveOn === null
        ? Number.POSITIVE_INFINITY
        : Math.round(
            (new Date(`${lastActiveOn}T00:00:00`).getTime() - new Date(`${key}T00:00:00`).getTime()) /
              86_400_000
          );
    return { key, filled: daysBeforeLast >= 0 && daysBeforeLast < streakDays };
  });

  return (
    <View style={[styles.ribbon, { backgroundColor: colors.bandAccent }]}>
      <View style={styles.ribbonText}>
        <Eyebrow color="accentOnSoft">
          {streakDays === 0 ? 'Begin' : streakDays === 1 ? 'Day one' : `${streakDays} days running`}
        </Eyebrow>
        <Text variant="metaStrong" color="text">
          {streakDays === 0
            ? 'Pray a decree or read today’s word to start'
            : `You have kept the altar ${streakDays === 1 ? 'today' : `${streakDays} days in a row`}`}
        </Text>
        {longestStreakDays > streakDays ? (
          <Text variant="caption" color="textTertiary">
            Your longest run so far is {longestStreakDays} days
          </Text>
        ) : null}
      </View>

      <View style={styles.dots}>
        {days.map((day) => (
          <View
            key={day.key}
            style={[
              styles.dot,
              {
                backgroundColor: day.filled ? colors.accent : 'transparent',
                borderColor: day.filled ? colors.accent : colors.borderStrong,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/** How far through this month's decree the member has prayed. */
export function DecreeProgress({
  prayed,
  total,
  label = 'Decrees prayed this month',
}: {
  prayed: number;
  total: number;
  label?: string;
}) {
  return (
    <View style={styles.progress}>
      <ProgressBar
        value={total === 0 ? 0 : prayed / total}
        label={`${label} — ${prayed} of ${total}`}
        tone="accent"
      />
    </View>
  );
}

/** A single decree in the list, with its prayed state. */
export function DecreeRow({
  position,
  title,
  scriptures,
  prayed,
}: {
  position: number;
  title: string;
  scriptures: string[];
  prayed: boolean;
}) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.marker,
          {
            backgroundColor: prayed ? colors.accent : 'transparent',
            borderColor: prayed ? colors.accent : colors.borderStrong,
          },
        ]}
      >
        {prayed ? (
          <Icon name="check" size="xs" color="onAccentFill" />
        ) : (
          <Text variant="caption" color="textSecondary">
            {position}
          </Text>
        )}
      </View>

      <View style={styles.rowText}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {title}
        </Text>
        {scriptures.length > 0 ? (
          <Text variant="caption" color="textTertiary" numberOfLines={1}>
            {scriptures.join(' · ')}
          </Text>
        ) : null}
      </View>

      <Icon name="chevron-right" size="sm" color="textTertiary" />
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.sm,
  },
  ribbonText: {
    flex: 1,
    gap: 2,
  },
  dots: {
    flexDirection: 'row',
    gap: space.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  progress: {
    paddingTop: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
