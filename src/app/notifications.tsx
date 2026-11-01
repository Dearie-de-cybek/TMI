import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { type AppNotification } from '@/api/schemas';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { useToast } from '@/components/app/toast';
import { NavBar } from '@/components/ui/header';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { useIsSignedIn } from '@/features/auth/use-require-auth';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/api';
import { formatRelative } from '@/lib/datetime';
import { safeInAppPath } from '@/lib/deep-links';

const categoryIcons: Record<AppNotification['category'], IconName> = {
  announcement: 'file-text',
  event: 'calendar',
  course: 'book-open',
  prayer: 'heart',
  giving: 'gift',
  sermon: 'mic',
  system: 'info',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const signedIn = useIsSignedIn();

  const notifications = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => fetchNotifications(),
    enabled: signedIn,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      toast('All caught up.', { icon: 'bell' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });

  if (!signedIn) {
    return (
      <Screen>
        <NavBar title="Notifications" />
        <ScreenScroll padded>
          <SignInPrompt
            title="Notifications follow your account"
            message="Sign in to see what the church has sent you, and to choose what you want to hear about."
            reason="notifications"
            next="/notifications"
          />
        </ScreenScroll>
      </Screen>
    );
  }

  const unread = notifications.data?.data.filter((item) => !item.read).length ?? 0;

  return (
    <Screen>
      <NavBar
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : undefined}
        actions={[
          { icon: 'settings', label: 'Notification settings', onPress: () => router.push('/settings/notifications') },
          ...(unread > 0
            ? [
                {
                  icon: 'bell' as IconName,
                  label: 'Mark all as read',
                  onPress: () => markAll.mutate(),
                },
              ]
            : []),
        ]}
      />

      {notifications.isPending ? (
        <SkeletonList count={5} withThumbnail={false} />
      ) : notifications.isError ? (
        <ErrorState error={notifications.error} onRetry={() => void notifications.refetch()} />
      ) : (
        <FlatList
          data={notifications.data.data}
          keyExtractor={(item) => item.id}
          refreshing={notifications.isRefetching}
          onRefresh={() => void notifications.refetch()}
          ItemSeparatorComponent={() => <Rule inset={space.gutter} />}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="Nothing here yet"
              message="When the church posts an announcement or a course update, it will show up here."
              action={{
                label: 'Choose what you hear about',
                onPress: () => router.push('/settings/notifications'),
              }}
            />
          }
          renderItem={({ item }) => {
            const destination = safeInAppPath(item.link);
            return (
              <Pressable
                onPress={() => {
                  if (!item.read) markRead.mutate(item.id);
                  if (destination) router.push(destination);
                }}
                accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
                style={styles.row}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: item.read ? colors.surfaceMuted : colors.primarySoft },
                  ]}
                >
                  <Icon
                    name={categoryIcons[item.category]}
                    size="sm"
                    color={item.read ? 'textTertiary' : 'primaryOnSoft'}
                  />
                </View>
                <View style={styles.text}>
                  <Text variant={item.read ? 'body' : 'bodyStrong'} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text variant="meta" color="textSecondary" numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text variant="caption" color="textTertiary">
                    {formatRelative(item.created_at)}
                  </Text>
                </View>
                {item.read ? null : <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    marginTop: 2,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.xs,
    marginTop: space.sm,
  },
});
