import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { type Devotional } from '@/api/schemas';
import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';

import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { resolveArtwork } from '@/lib/artwork';
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
 * The verse of the day: a full-bleed photograph, the verse set large over it,
 * and a plain invitation to read the devotional. This is the way into the daily
 * devotional from Home.
 */
export function VerseCard({
  devotional,
  onPress,
  read,
}: {
  devotional: Devotional;
  onPress: () => void;
  read: boolean;
}) {
  const colors = useColors();
  const artwork = resolveArtwork(devotional.artwork_url);

  return (
    <Pressable
      onPress={onPress}
      feedback="opacity"
      haptic
      accessibilityLabel={`Today's devotional: ${devotional.title}. ${devotional.scripture_reference}`}
      style={[styles.verse, { backgroundColor: colors.surfaceInverse }]}
    >
      {artwork ? (
        <Image
          source={'local' in artwork ? artwork.local : { uri: artwork.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top center"
          transition={240}
        />
      ) : null}
      <LinearGradient
        colors={['rgba(27,15,36,0.15)', colors.scrim, colors.scrimStrong]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.verseText}>
        <Eyebrow style={{ color: colors.accentFill }}>Verse of the day</Eyebrow>
        <Text style={[styles.verseQuote, { color: colors.textOnInverse }]}>
          “{devotional.scripture_text}”
        </Text>
        <Text variant="metaStrong" style={{ color: colors.accentFill }}>
          {devotional.scripture_reference}
        </Text>
        <View style={styles.verseCta}>
          <Text variant="labelStrong" style={{ color: colors.textOnInverse }}>
            {read ? 'Read — open again' : `Read today’s devotional: ${devotional.title}`}
          </Text>
          <Icon name={read ? 'check' : 'arrow-right'} size="sm" color="accentFill" />
        </View>
      </View>
    </Pressable>
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
            name={milestone.reached ? 'check' : 'lock'}
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
    width: 12,
    height: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  progress: {
    paddingTop: space.md,
  },
  verse: {
    minHeight: 320,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  verseText: {
    padding: space.xl,
    gap: space.sm,
  },
  verseQuote: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.4,
  },
  verseCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.md,
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
