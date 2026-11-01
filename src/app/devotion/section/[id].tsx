import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { useToast } from '@/components/app/toast';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/chips';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, hairline, space } from '@/design/tokens';
import { fetchCurrentDecree } from '@/features/devotion/api';
import { useDevotionProgress } from '@/features/devotion/progress-store';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';

/**
 * One decree, to be prayed.
 *
 * Everything that is not the words is pushed out of the way: no artwork, no
 * cards, a long measure and a generous line height. The only control is at the
 * bottom — "Amen, I have prayed this" — and taking it moves straight to the
 * next decree, so a member can pray through without hunting for a back button.
 */
export default function DecreeSectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const toast = useToast();

  useDevotionSync();

  const decree = useQuery({
    queryKey: queryKeys.decree('current'),
    queryFn: ({ signal }) => fetchCurrentDecree(signal),
  });

  const prayedIds = useDevotionProgress((state) => state.prayedSectionIds);
  const markSectionPrayed = useDevotionProgress((state) => state.markSectionPrayed);
  const unmarkSectionPrayed = useDevotionProgress((state) => state.unmarkSectionPrayed);

  if (decree.isPending) {
    return (
      <Screen>
        <NavBar />
        <SkeletonList count={4} withThumbnail={false} />
      </Screen>
    );
  }

  if (decree.isError) {
    return (
      <Screen>
        <NavBar />
        <ErrorState error={decree.error} onRetry={() => void decree.refetch()} />
      </Screen>
    );
  }

  const sections = decree.data.sections;
  const index = sections.findIndex((section) => section.id === id);
  const section = index >= 0 ? sections[index] : undefined;

  if (!section) {
    return (
      <Screen>
        <NavBar />
        <EmptyState
          icon="book-open"
          title="That decree is not in this month"
          message="The decree is published fresh each month. Open this month's and start from the first."
          action={{ label: 'This month’s decree', onPress: () => router.replace('/devotion/decree') }}
        />
      </Screen>
    );
  }

  const prayed = prayedIds.includes(section.id);
  const next = sections[index + 1];
  const previous = sections[index - 1];

  function markAndAdvance() {
    if (!section) return;
    markSectionPrayed(section.id);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined
      );
    }

    if (next) {
      router.replace(`/devotion/section/${next.id}`);
    } else if (decree.data?.confession) {
      toast('Every decree prayed this month.', { tone: 'success', icon: 'check' });
      router.replace('/devotion/confession');
    } else {
      router.replace('/devotion');
    }
  }

  return (
    <Screen>
      <NavBar
        title={`Decree ${section.position} of ${sections.length}`}
        subtitle={decree.data.month_label}
      />

      <View style={styles.progressRail}>
        <ProgressBar
          value={(index + (prayed ? 1 : 0)) / sections.length}
          tone="accent"
          accessibilityLabel={`Decree ${section.position} of ${sections.length}`}
        />
      </View>

      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.header}>
          <Eyebrow>{decree.data.theme}</Eyebrow>
          <Text style={[styles.title, { color: colors.text }]}>{section.title}</Text>

          {section.scriptures.length > 0 ? (
            <View style={styles.tags}>
              {section.scriptures.map((reference) => (
                <Tag key={reference} label={reference} tone="accent" icon="book" />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {section.body.map((paragraph, paragraphIndex) => (
            <Text key={paragraphIndex} variant="scripture" style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={styles.actions}>
          {prayed ? (
            <>
              <View style={[styles.prayedMark, { borderColor: colors.success }]}>
                <Icon name="check-circle" size="md" color="success" />
                <Text variant="metaStrong" color="success">
                  You have prayed this decree
                </Text>
              </View>
              {next ? (
                <Button
                  label={`Next — decree ${next.position}`}
                  icon="arrow-right"
                  iconPosition="trailing"
                  fullWidth
                  onPress={() => router.replace(`/devotion/section/${next.id}`)}
                />
              ) : (
                <Button
                  label="Declare the confession"
                  icon="arrow-right"
                  iconPosition="trailing"
                  fullWidth
                  onPress={() => router.replace('/devotion/confession')}
                />
              )}
              <Button
                label="Mark as not prayed"
                variant="ghost"
                fullWidth
                onPress={() => unmarkSectionPrayed(section.id)}
              />
            </>
          ) : (
            <Button label="Amen — I have prayed this" icon="check" fullWidth onPress={markAndAdvance} />
          )}

          <View style={styles.navRow}>
            {previous ? (
              <Button
                label="Previous"
                variant="ghost"
                icon="chevron-left"
                onPress={() => router.replace(`/devotion/section/${previous.id}`)}
              />
            ) : (
              <View />
            )}
            <Button
              label="All decrees"
              variant="ghost"
              onPress={() => router.replace('/devotion/decree')}
            />
          </View>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRail: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.sm,
    borderBottomWidth: hairline,
    borderBottomColor: 'transparent',
  },
  header: {
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    gap: space.md,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  body: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    maxWidth: 680,
  },
  paragraph: {
    marginBottom: space.xl,
  },
  actions: {
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    gap: space.sm,
  },
  prayedMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space.md,
  },
});
