import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/ui/header';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, space } from '@/design/tokens';
import { fetchAnnouncement, markAnnouncementRead } from '@/features/announcements/api';
import { useIsSignedIn } from '@/features/auth/use-require-auth';
import { formatDate } from '@/lib/datetime';
import { safeInAppPath } from '@/lib/deep-links';
import { joinMeta } from '@/lib/format';

export default function AnnouncementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const signedIn = useIsSignedIn();

  const announcement = useQuery({
    queryKey: queryKeys.announcement(id),
    queryFn: ({ signal }) => fetchAnnouncement(id, signal),
    enabled: Boolean(id),
  });

  const markRead = useMutation({
    mutationFn: () => markAnnouncementRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.announcements() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });

  // Opening an announcement is what marks it read; a failure here is silent
  // because it changes nothing the member asked for.
  useEffect(() => {
    if (signedIn && announcement.data && !announcement.data.read && markRead.isIdle) {
      markRead.mutate();
    }
  }, [announcement.data, markRead, signedIn]);

  if (announcement.isPending) {
    return (
      <Screen>
        <NavBar />
        <View style={styles.loading}>
          <Skeleton width="40%" height={12} />
          <Skeleton width="85%" height={26} />
          <Skeleton height={14} />
          <Skeleton height={14} />
          <Skeleton width="70%" height={14} />
        </View>
      </Screen>
    );
  }

  if (announcement.isError) {
    return (
      <Screen>
        <NavBar />
        <ErrorState error={announcement.error} onRetry={() => void announcement.refetch()} />
      </Screen>
    );
  }

  const data = announcement.data;
  const link = safeInAppPath(data.link);

  return (
    <Screen>
      <NavBar title="Announcement" />
      <ScreenScroll padded bottomSpace={space.giant}>
        <View style={styles.header}>
          <Eyebrow>
            {joinMeta([
              data.scope.name ?? (data.scope.type === 'church' ? 'Church-wide' : data.scope.type),
              formatDate(data.published_at),
            ])}
          </Eyebrow>
          <Text style={[styles.title, { color: colors.text }]}>{data.title}</Text>
        </View>

        <Rule style={styles.rule} />

        {data.body.split('\n\n').map((paragraph, index) => (
          <Text key={index} variant="bodyLarge" style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        {link ? (
          <Button
            label="Open what this is about"
            variant="secondary"
            icon="arrow-right"
            iconPosition="trailing"
            style={styles.action}
            onPress={() => router.push(link)}
          />
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: space.gutter,
    gap: space.md,
  },
  header: {
    paddingTop: space.lg,
    gap: space.sm,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  rule: {
    marginVertical: space.xl,
  },
  paragraph: {
    marginBottom: space.lg,
    maxWidth: 640,
    lineHeight: 27,
  },
  action: {
    marginTop: space.lg,
  },
});
