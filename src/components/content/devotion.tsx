import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { Button } from '@/components/ui/button';

import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { fetchCurrentDecree } from '@/features/devotion/api';
import { dayKey, useDevotionProgress } from '@/features/devotion/progress-store';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';

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

/**
 * Home-screen entry to the month's decree: a maroon card with the month's theme,
 * one block per decree (gold when prayed), and a single button that resumes at
 * the next one. It answers "where did I stop?" at a glance.
 */
export function DevotionCard() {
  const router = useRouter();
  useDevotionSync();

  const decree = useQuery({
    queryKey: queryKeys.decree('current'),
    queryFn: ({ signal }) => fetchCurrentDecree(signal),
  });
  const prayedIds = useDevotionProgress((state) => state.prayedSectionIds);
  const period = useDevotionProgress((state) => state.period);
  const streakDays = useDevotionProgress((state) => state.streakDays);

  if (!decree.data) return null;

  const sections = decree.data.sections;
  // Progress belongs to a month; a stale month has nothing prayed yet.
  const prayed = period === decree.data.period ? prayedIds : [];
  const prayedCount = sections.filter((section) => prayed.includes(section.id)).length;
  const next = sections.find((section) => !prayed.includes(section.id));

  return (
    <LinearGradient
      colors={['#2A1342', '#4A2A5A', '#8A6A2A']}
      locations={[0, 0.62, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.decreeCard}
    >
      <View style={styles.decreeTop}>
        <Text variant="metaStrong" style={styles.decreeKicker} numberOfLines={1}>
          {decree.data.month_label} · Prophetic decree
        </Text>
        <View style={styles.streakChip}>
          <Ionicons name="flash" size={16} color="#E3B965" />
          <Text variant="labelStrong" style={styles.streakNumber}>
            {streakDays}
          </Text>
        </View>
      </View>

      <Text style={styles.decreeTitle} numberOfLines={3}>
        {decree.data.theme}
      </Text>

      <View style={styles.blocks} accessible accessibilityLabel={`${prayedCount} of ${sections.length} decrees prayed`}>
        {sections.map((section) => (
          <View
            key={section.id}
            style={[
              styles.block,
              { backgroundColor: prayed.includes(section.id) ? '#E3B965' : 'rgba(255,255,255,0.25)' },
            ]}
          />
        ))}
      </View>

      <Text variant="meta" style={styles.decreeMeta} numberOfLines={2}>
        {prayedCount} of {sections.length} prayed{next ? ` · Next: ${next.title}` : ''}
      </Text>

      <Button
        label={
          !next
            ? 'Open this month’s decree'
            : prayedCount === 0
              ? 'Begin the first decree'
              : `Continue — decree ${next.position}`
        }
        variant="light"
        icon="arrow-right"
        iconPosition="trailing"
        fullWidth
        style={styles.decreeButton}
        onPress={() => router.push(next ? `/devotion/section/${next.id}` : '/devotion')}
      />
    </LinearGradient>
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
          <Icon name="heart" size="xs" color="onAccentFill" />
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
    width: 12,
    height: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  progress: {
    paddingTop: space.md,
  },
  decreeCard: {
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.md,
  },
  decreeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  decreeKicker: {
    flex: 1,
    color: 'rgba(255,255,255,0.82)',
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  streakNumber: {
    color: '#FFFFFF',
  },
  decreeTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.sansExtraBold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
  },
  blocks: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: space.xs,
  },
  block: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
  },
  decreeMeta: {
    color: 'rgba(255,255,255,0.85)',
  },
  decreeButton: {
    marginTop: space.sm,
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
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
