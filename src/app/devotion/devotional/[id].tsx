import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { useToast } from '@/components/app/toast';
import { Band } from '@/components/ui/band';
import { Button } from '@/components/ui/button';
import { ContentImage } from '@/components/ui/content-image';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, space } from '@/design/tokens';
import { fetchRecentDevotionals, fetchTodayDevotional } from '@/features/devotion/api';
import { useDevotionProgress } from '@/features/devotion/progress-store';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';
import { formatDate } from '@/lib/datetime';

/**
 * One day's devotional.
 *
 * The scripture first, then the word, then one question to sit with. Marking it
 * read is a deliberate tap at the end — reading counts toward the streak, so it
 * should be something the member chose, not something opening the page did.
 */
export default function DevotionalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const toast = useToast();

  useDevotionSync();

  // Today's comes from its own endpoint; earlier days from the recent list.
  const devotional = useQuery({
    queryKey: [...queryKeys.devotionals, id],
    queryFn: async ({ signal }) => {
      const today = await fetchTodayDevotional(signal).catch(() => null);
      if (today?.id === id) return today;
      const recent = await fetchRecentDevotionals(signal);
      return recent.find((item) => item.id === id) ?? null;
    },
  });

  const read = useDevotionProgress((state) => state.readDevotionalIds.includes(id));
  const markDevotionalRead = useDevotionProgress((state) => state.markDevotionalRead);

  if (devotional.isPending) {
    return (
      <Screen>
        <NavBar />
        <SkeletonList count={3} withThumbnail={false} />
      </Screen>
    );
  }

  if (devotional.isError) {
    return (
      <Screen>
        <NavBar />
        <ErrorState error={devotional.error} onRetry={() => void devotional.refetch()} />
      </Screen>
    );
  }

  const item = devotional.data;
  if (!item) {
    return (
      <Screen>
        <NavBar />
        <EmptyState
          icon="book-open"
          title="That devotional is not available"
          message="It may be older than the ones the app keeps. Earlier days are listed in the archive."
          action={{ label: 'Daily devotionals', onPress: () => router.replace('/devotion/devotionals') }}
        />
      </Screen>
    );
  }

  function markRead() {
    markDevotionalRead(item!.id);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined
      );
    }
    toast('Marked as read.', { tone: 'success', icon: 'check' });
  }

  return (
    <Screen>
      <NavBar title="Devotional" subtitle={formatDate(item.date)} />
      <ScreenScroll bottomSpace={space.giant}>
        {item.artwork_url ? (
          <ContentImage
            uri={item.artwork_url}
            seed={item.title}
            label={item.title}
            width="100%"
            height={200}
            rounded={false}
            contentPosition="top center"
          />
        ) : null}

        <View style={styles.header}>
          <Eyebrow>{item.scripture_reference}</Eyebrow>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        </View>

        <Band tone="accent">
          <View style={styles.gutter}>
            <Text variant="scripture">“{item.scripture_text}”</Text>
            <Text variant="caption" color="accentOnSoft" style={styles.reference}>
              {item.scripture_reference}
            </Text>
          </View>
        </Band>

        <View style={[styles.gutter, styles.body]}>
          {item.body.split(/\n{2,}/).map((paragraph, index) => (
            <Text key={index} variant="bodyLarge" style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        {item.reflection ? (
          <View style={[styles.reflection, { borderColor: colors.accent }]}>
            <Eyebrow>Sit with this</Eyebrow>
            <Text variant="quote">{item.reflection}</Text>
          </View>
        ) : null}

        <View style={[styles.gutter, styles.actions]}>
          {read ? (
            <View style={styles.readMark}>
              <Icon name="check" size="md" color="success" />
              <Text variant="metaStrong" color="success">
                You have read this word
              </Text>
            </View>
          ) : (
            <Button label="I have read this" icon="check" fullWidth onPress={markRead} />
          )}
          <Button
            label="Back to devotion"
            variant="ghost"
            fullWidth
            onPress={() => router.replace('/devotion')}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: {
    paddingHorizontal: space.gutter,
  },
  header: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.lg,
    gap: space.sm,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  reference: {
    paddingTop: space.sm,
  },
  body: {
    paddingTop: space.xl,
    maxWidth: 680,
  },
  paragraph: {
    marginBottom: space.lg,
  },
  reflection: {
    marginTop: space.lg,
    paddingVertical: space.lg,
    borderLeftWidth: 2,
    marginHorizontal: space.gutter,
    paddingLeft: space.lg,
    gap: space.sm,
  },
  actions: {
    paddingTop: space.xl,
    gap: space.sm,
  },
  readMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
  },
});
