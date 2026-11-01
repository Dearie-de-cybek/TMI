import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { Button } from '@/components/ui/button';

import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { fetchCurrentDecree } from '@/features/devotion/api';
import { type Milestone } from '@/features/devotion/milestones';
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
 * Home-screen entry to the month's decree. It answers "where did I stop?" in
 * one glance — the streak, how many decrees are prayed — and its single button
 * resumes at the next unprayed decree.
 */
export function DevotionCard() {
  const router = useRouter();
  const colors = useColors();
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
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Eyebrow>
        {decree.data.month_label} · {streakDays > 0 ? `${streakDays} days running` : 'prophetic decree'}
      </Eyebrow>
      <Text variant="headline">{decree.data.theme}</Text>
      <DecreeProgress prayed={prayedCount} total={sections.length} />
      <View style={styles.cardAction}>
        <Button
          label={
            !next
              ? 'Open this month’s decree'
              : prayedCount === 0
                ? 'Begin the first decree'
                : `Continue — decree ${next.position}`
          }
          icon="arrow-right"
          iconPosition="trailing"
          fullWidth
          onPress={() => router.push(next ? `/devotion/section/${next.id}` : '/devotion')}
        />
      </View>
    </View>
  );
}

const badgeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  first: 'heart',
  half: 'flame',
  all: 'trophy',
  confession: 'mic',
  week: 'flash',
  month: 'ribbon',
};

/** Badges in a row: solid maroon-on-soft when earned, a grey lock when not. */
export function BadgeRow({ milestones }: { milestones: Milestone[] }) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.badgeRow}
    >
      {milestones.map((milestone) => (
        <View
          key={milestone.id}
          accessible
          accessibilityLabel={`${milestone.title}. ${milestone.reached ? 'Earned' : milestone.hint}`}
          style={styles.badge}
        >
          <View
            style={[
              styles.badgeArt,
              { backgroundColor: milestone.reached ? colors.primarySoft : colors.surfaceMuted },
            ]}
          >
            <Ionicons
              name={milestone.reached ? (badgeIcons[milestone.id] ?? 'ribbon') : 'lock-closed-outline'}
              size={30}
              color={milestone.reached ? colors.primary : colors.textTertiary}
            />
          </View>
          <Text
            variant="caption"
            color={milestone.reached ? 'text' : 'textTertiary'}
            style={styles.badgeLabel}
            numberOfLines={2}
          >
            {milestone.title}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

/** The markers a member has reached, and the ones still ahead. */
export function MilestoneGrid({ milestones }: { milestones: Milestone[] }) {
  const colors = useColors();

  return (
    <View style={styles.grid}>
      {milestones.map((milestone) => (
        <View
          key={milestone.id}
          accessible
          accessibilityLabel={`${milestone.title}. ${milestone.reached ? 'Reached' : milestone.hint}`}
          style={[
            styles.tile,
            {
              backgroundColor: milestone.reached ? colors.accentSoft : 'transparent',
              borderColor: milestone.reached ? colors.accent : colors.border,
            },
          ]}
        >
          <Icon
            name={milestone.reached ? 'award' : 'lock'}
            size="sm"
            color={milestone.reached ? 'accentOnSoft' : 'textTertiary'}
          />
          <Text variant="metaStrong" color={milestone.reached ? 'accentOnSoft' : 'textSecondary'}>
            {milestone.title}
          </Text>
          <Text variant="caption" color="textTertiary" numberOfLines={2}>
            {milestone.reached ? 'Reached' : milestone.hint}
          </Text>
        </View>
      ))}
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
  badgeRow: {
    gap: space.lg,
    padding: space.lg,
  },
  badge: {
    width: 76,
    alignItems: 'center',
    gap: space.sm,
  },
  badgeArt: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    textAlign: 'center',
  },
  card: {
    gap: space.xs,
    padding: space.lg,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  cardAction: {
    paddingTop: space.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  tile: {
    width: '48.5%',
    gap: 2,
    padding: space.md,
    borderWidth: 1,
    borderRadius: radius.sm,
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
