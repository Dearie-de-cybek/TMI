import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, space } from '@/design/tokens';
import { fetchCurrentDecree } from '@/features/devotion/api';
import { dayKey, useDevotionProgress } from '@/features/devotion/progress-store';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';

/**
 * The corporate confession.
 *
 * This is the one screen in the app that is meant to be spoken aloud, so it is
 * set like a page to be read from: the plum plate, large serif lines, one
 * declaration per line, nothing else on the screen competing for attention.
 *
 * It can be declared again each day - the church says it daily through the
 * month - so the button resets every morning rather than locking after once.
 */
export default function ConfessionScreen() {
  const router = useRouter();
  const colors = useColors();
  const { celebrate } = useDialog();

  useDevotionSync();

  const decree = useQuery({
    queryKey: queryKeys.decree('current'),
    queryFn: ({ signal }) => fetchCurrentDecree(signal),
  });

  const confessionDeclaredOn = useDevotionProgress((state) => state.confessionDeclaredOn);
  const declareConfession = useDevotionProgress((state) => state.declareConfession);
  const declaredToday = confessionDeclaredOn === dayKey();

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

  const confession = decree.data.confession;

  if (!confession) {
    return (
      <Screen>
        <NavBar title="Confession" />
        <EmptyState
          icon="book-open"
          title="No confession this month"
          message="The pastor has not published a corporate confession for this month."
          action={{ label: 'This month’s decree', onPress: () => router.replace('/devotion/decree') }}
        />
      </Screen>
    );
  }

  function declare() {
    declareConfession();
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined
      );
    }
    void celebrate({
      eyebrow: decree.data?.month_label,
      title: 'Declared in faith',
      message: 'Come back and say it again tomorrow. The church declares this through the month.',
    });
  }

  return (
    <Screen background="surface">
      <NavBar title={confession.title} subtitle={decree.data.month_label} />

      <ScreenScroll bottomSpace={space.giant}>
        <View style={[styles.plate, { backgroundColor: colors.surfaceInverse }]}>
          <Eyebrow style={{ color: colors.accentFill }}>Say this aloud</Eyebrow>
          <Text style={[styles.lead, { color: colors.textOnInverse }]}>{confession.lead}</Text>

          <View style={[styles.rule, { backgroundColor: colors.accentFill }]} />

          {confession.lines.map((line, index) => (
            <Text key={index} style={[styles.line, { color: colors.textOnInverse }]}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.actions}>
          {declaredToday ? (
            <>
              <View style={styles.declaredMark}>
                <Icon name="mic" size="md" color="success" />
                <Text variant="metaStrong" color="success">
                  Declared today
                </Text>
              </View>
              <Text variant="meta" color="textSecondary">
                The church declares this through the month. It will be waiting for you again
                tomorrow morning.
              </Text>
            </>
          ) : (
            <Button
              label="I have declared this"
              icon="mic"
              fullWidth
              onPress={declare}
            />
          )}

          <Button
            label="Back to the decrees"
            variant="secondary"
            fullWidth
            onPress={() => router.replace('/devotion/decree')}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  plate: {
    margin: space.gutter,
    padding: space.xxl,
    borderRadius: 4,
    gap: space.md,
  },
  lead: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    lineHeight: 31,
    letterSpacing: -0.3,
  },
  rule: {
    width: 40,
    height: 2,
    marginVertical: space.md,
  },
  line: {
    fontFamily: fonts.serifRegular,
    fontSize: 19,
    lineHeight: 31,
  },
  actions: {
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    gap: space.md,
  },
  declaredMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
