import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { DecreeProgress, StreakRibbon } from '@/components/content/devotion';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Band } from '@/components/ui/band';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { fetchCurrentDecree, fetchTodayDevotional } from '@/features/devotion/api';
import { useDevotionProgress } from '@/features/devotion/progress-store';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';
import { resolveArtwork } from '@/lib/artwork';
import { formatDate } from '@/lib/datetime';

/**
 * Devotion.
 *
 * One place for the two rhythms the church keeps: the word for today, and the
 * decree for the month. The screen's job is to answer "where did I stop?" in
 * the first second — the streak, how far through the decrees you are, and a
 * single button that takes you to the next one you have not prayed.
 */
export default function DevotionScreen() {
  const router = useRouter();
  const colors = useColors();

  useDevotionSync();

  const decree = useQuery({
    queryKey: queryKeys.decree('current'),
    queryFn: ({ signal }) => fetchCurrentDecree(signal),
  });

  const devotional = useQuery({
    queryKey: queryKeys.devotional,
    queryFn: ({ signal }) => fetchTodayDevotional(signal),
  });

  const progress = useDevotionProgress();
  const setPeriod = useDevotionProgress((state) => state.setPeriod);

  // Opening a decree for a new month resets that month's section progress.
  useEffect(() => {
    if (decree.data) setPeriod(decree.data.period);
  }, [decree.data, setPeriod]);

  const sections = decree.data?.sections ?? [];
  const prayedCount = sections.filter((section) =>
    progress.prayedSectionIds.includes(section.id)
  ).length;
  const nextSection = sections.find((section) => !progress.prayedSectionIds.includes(section.id));
  const allPrayed = sections.length > 0 && prayedCount === sections.length;
  const devotionalRead = devotional.data
    ? progress.readDevotionalIds.includes(devotional.data.id)
    : false;

  const artwork = resolveArtwork(decree.data?.artwork_url);

  return (
    <Screen>
      <NavBar
        title="Devotion"
        actions={[
          {
            icon: 'bell',
            label: 'Prayer reminders',
            onPress: () => router.push('/settings/notifications'),
          },
        ]}
      />

      {decree.isPending ? (
        <View style={styles.loading}>
          <Skeleton height={200} />
          <Skeleton width="55%" height={14} />
          <Skeleton height={80} />
        </View>
      ) : decree.isError ? (
        <ErrorState error={decree.error} onRetry={() => void decree.refetch()} />
      ) : (
        <ScreenScroll bottomSpace={space.giant}>
          {/* The month's theme, over the church at prayer. */}
          <View style={styles.hero}>
            {artwork ? (
              <Image
                source={'local' in artwork ? artwork.local : { uri: artwork.uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="top center"
                accessibilityLabel="Members of the church at prayer"
                accessibilityRole="image"
                accessible
                transition={200}
              />
            ) : null}
            <LinearGradient
              colors={['transparent', colors.scrim, colors.scrimStrong]}
              locations={[0.2, 0.6, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.heroText}>
              <Eyebrow style={{ color: colors.accentFill }}>
                {decree.data.month_label} · prophetic decree
              </Eyebrow>
              <Text style={[styles.theme, { color: colors.textOnInverse }]}>
                {decree.data.theme}
              </Text>
              {decree.data.year_theme ? (
                <Text variant="caption" color="textOnInverseSecondary">
                  {decree.data.year_theme.year}: {decree.data.year_theme.theme}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.gutter}>
            <View style={styles.block}>
              <StreakRibbon
                streakDays={progress.streakDays}
                longestStreakDays={progress.longestStreakDays}
                lastActiveOn={progress.lastActiveOn}
              />
            </View>

            <View style={styles.block}>
              <DecreeProgress prayed={prayedCount} total={sections.length} />
              <View style={styles.actions}>
                {nextSection ? (
                  <Button
                    label={
                      prayedCount === 0
                        ? 'Begin the first decree'
                        : `Continue — decree ${nextSection.position}`
                    }
                    icon="arrow-right"
                    iconPosition="trailing"
                    fullWidth
                    onPress={() => router.push(`/devotion/section/${nextSection.id}`)}
                  />
                ) : (
                  <Button
                    label="Declare the confession"
                    icon="arrow-right"
                    iconPosition="trailing"
                    fullWidth
                    onPress={() => router.push('/devotion/confession')}
                  />
                )}
                <Button
                  label="All eleven decrees"
                  variant="secondary"
                  fullWidth
                  onPress={() => router.push('/devotion/decree')}
                />
              </View>
            </View>

            {allPrayed ? (
              <View style={styles.block}>
                <Banner
                  tone="success"
                  icon="check-circle"
                  title="You have prayed every decree this month"
                  message="Keep returning to them — the month is not over, and a decree prayed once is not a decree prayed through."
                />
              </View>
            ) : null}
          </View>

          {/* Today's word. */}
          <Band tone="accent" style={styles.todayBand}>
            <View style={styles.gutter}>
              <SectionHeader
                eyebrow="Today"
                title="The word for today"
                action={{ label: 'Earlier days', onPress: () => router.push('/devotion/devotionals') }}
              />
            </View>

            {devotional.isPending ? (
              <View style={styles.gutter}>
                <Skeleton height={80} />
              </View>
            ) : devotional.isError || !devotional.data ? (
              <View style={styles.gutter}>
                <Banner
                  tone="info"
                  message="Today’s devotional has not been published yet. It usually arrives in the morning."
                />
              </View>
            ) : (
              <Pressable
                onPress={() => router.push(`/devotion/devotional/${devotional.data.id}`)}
                accessibilityLabel={`Read today's devotional: ${devotional.data.title}`}
                style={styles.devotionalRow}
              >
                <View style={styles.devotionalText}>
                  <Text variant="caption" color="accentOnSoft">
                    {formatDate(devotional.data.date)}
                  </Text>
                  <Text variant="headline">{devotional.data.title}</Text>
                  <Text variant="quote" color="textSecondary" numberOfLines={2}>
                    “{devotional.data.scripture_text}”
                  </Text>
                  <Text variant="caption" color="textTertiary">
                    {devotional.data.scripture_reference}
                  </Text>
                </View>
                <Icon
                  name={devotionalRead ? 'check-circle' : 'chevron-right'}
                  size="md"
                  color={devotionalRead ? 'success' : 'textTertiary'}
                />
              </Pressable>
            )}
          </Band>

          <View style={styles.gutter}>
            <SectionHeader eyebrow="From the desk" title={decree.data.author} />
            {decree.data.closing_word ? (
              <Text variant="bodyLarge" style={styles.closing}>
                {decree.data.closing_word}
              </Text>
            ) : null}
            <Text variant="caption" color="textTertiary" style={styles.byline}>
              {decree.data.author}
              {decree.data.author_role ? ` · ${decree.data.author_role}` : ''}
            </Text>
          </View>

          <Rule style={styles.footerRule} />
          <View style={styles.gutter}>
            <Pressable
              onPress={() => router.push('/settings/notifications')}
              accessibilityLabel="Set a prayer reminder"
              style={[styles.reminderRow, { borderColor: colors.border }]}
            >
              <Icon name="bell" size="md" color="primary" />
              <View style={styles.devotionalText}>
                <Text variant="labelStrong">Remind me to pray</Text>
                <Text variant="caption" color="textSecondary">
                  A daily nudge to come back to the decree and the day’s word.
                </Text>
              </View>
              <Icon name="chevron-right" size="sm" color="textTertiary" />
            </Pressable>
          </View>
        </ScreenScroll>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: space.gutter,
    gap: space.md,
  },
  gutter: {
    paddingHorizontal: space.gutter,
  },
  hero: {
    height: 240,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroText: {
    padding: space.gutter,
    gap: space.xs,
  },
  theme: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.6,
  },
  block: {
    paddingTop: space.xl,
  },
  actions: {
    paddingTop: space.lg,
    gap: space.sm,
  },
  todayBand: {
    marginTop: space.xxxl,
  },
  devotionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  devotionalText: {
    flex: 1,
    gap: 3,
  },
  closing: {
    paddingTop: space.sm,
    maxWidth: 620,
  },
  byline: {
    paddingTop: space.md,
  },
  footerRule: {
    marginVertical: space.xxl,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
});
