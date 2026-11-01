import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { describeError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type Group } from '@/api/schemas';
import { useToast } from '@/components/app/toast';
import { useDialog } from '@/components/ui/dialog';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ContentImage } from '@/components/ui/content-image';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { fetchGroup, leaveGroup, requestGroupMembership } from '@/features/community/api';
import { formatDateTimeWithZone } from '@/lib/datetime';
import { isSafeExternalUrl } from '@/lib/deep-links';
import { groupTypeLabel, pluralise } from '@/lib/format';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();
  const { confirm } = useDialog();

  const group = useQuery({
    queryKey: queryKeys.group(id),
    queryFn: ({ signal }) => fetchGroup(id, signal),
    enabled: Boolean(id),
  });

  function onSuccess(updated: Group, message: string) {
    queryClient.setQueryData(queryKeys.group(id), updated);
    void queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    toast(message, { tone: 'success', icon: 'check' });
  }

  const join = useMutation({
    mutationFn: () => requestGroupMembership(id),
    onSuccess: (updated) =>
      onSuccess(
        updated,
        updated.membership.status === 'member'
          ? 'You have joined the group.'
          : 'Your request has gone to the group leader.'
      ),
  });

  const leave = useMutation({
    mutationFn: () => leaveGroup(id),
    onSuccess: (updated) => onSuccess(updated, 'You have left the group.'),
  });

  if (group.isPending) {
    return (
      <Screen>
        <NavBar />
        <View style={styles.loading}>
          <Skeleton height={120} />
          <Skeleton width="60%" height={24} />
          <Skeleton height={60} />
        </View>
      </Screen>
    );
  }

  if (group.isError) {
    return (
      <Screen>
        <NavBar />
        <ErrorState error={group.error} onRetry={() => void group.refetch()} />
      </Screen>
    );
  }

  const data = group.data;
  const actionError = join.error ?? leave.error;
  const described = actionError ? describeError(actionError) : null;

  return (
    <Screen>
      <NavBar title={data.name} />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.hero}>
          <ContentImage
            uri={data.artwork_url}
            seed={data.name}
            height={130}
            label={`Artwork for ${data.name}`}
            style={{ borderRadius: radius.sm }}
          />
          <View style={styles.heroText}>
            <Eyebrow>{groupTypeLabel(data.type)}</Eyebrow>
            <Text style={[styles.title, { color: colors.text }]}>{data.name}</Text>
            {data.summary ? (
              <Text variant="bodyLarge" color="textSecondary">
                {data.summary}
              </Text>
            ) : null}
          </View>

          <View style={styles.facts}>
            {data.meeting_schedule ? (
              <Fact icon="clock" label={data.meeting_schedule} />
            ) : null}
            {data.meeting_location ? <Fact icon="map-pin" label={data.meeting_location} /> : null}
            {data.leader_name ? <Fact icon="user" label={`Led by ${data.leader_name}`} /> : null}
            {data.member_count != null ? (
              <Fact icon="users" label={pluralise(data.member_count, 'member')} />
            ) : null}
            {data.requirements ? <Fact icon="info" label={data.requirements} /> : null}
          </View>
        </View>

        <View style={styles.actions}>
          {described ? <Banner tone="danger" title={described.title} message={described.message} /> : null}

          {data.membership.status === 'member' ? (
            <Banner tone="success" icon="check-circle" message="You are part of this group." />
          ) : data.membership.status === 'pending' ? (
            <Banner
              tone="warning"
              icon="clock"
              title="Your request is with the leader"
              message="A group leader reviews requests. You will hear from the church, not from this app."
            />
          ) : data.membership.status === 'declined' ? (
            <Banner
              tone="info"
              title="Not accepted at the moment"
              message="Speak to the ministry lead if you would like to be considered again."
            />
          ) : null}

          {data.membership.can_request ? (
            <Button
              label="Ask to join"
              fullWidth
              loading={join.isPending}
              onPress={() => {
                if (!requireAuth({ reason: 'member', next: `/community/${id}` })) return;
                join.mutate();
              }}
            />
          ) : null}

          {data.membership.can_leave ? (
            <Button
              label="Leave this group"
              variant="secondary"
              fullWidth
              loading={leave.isPending}
              onPress={() =>
                void confirm({
                  eyebrow: data.name,
                  icon: 'log-out',
                  title: 'Leave this group?',
                  message: 'The group leader will be notified that you have left.',
                  confirmLabel: 'Leave',
                  cancelLabel: 'Stay',
                  destructive: true,
                }).then((confirmed) => {
                  if (confirmed) leave.mutate();
                })
              }
            />
          ) : null}
        </View>

        {data.description ? (
          <View style={styles.block}>
            <Rule />
            <Text variant="bodyLarge" style={styles.description}>
              {data.description}
            </Text>
          </View>
        ) : null}

        {data.communication_url ? (
          <View style={styles.blockPadded}>
            <SectionHeader eyebrow="Members only" title="Group chat" />
            <Text variant="body" color="textSecondary">
              The group chat is run by its leaders outside this app.
            </Text>
            <Button
              label="Open the group invite"
              variant="secondary"
              icon="external-link"
              iconPosition="trailing"
              onPress={() => {
                const url = data.communication_url!;
                if (!isSafeExternalUrl(url)) {
                  toast('That link is not valid.', { tone: 'warning' });
                  return;
                }
                void Linking.openURL(url).catch(() =>
                  toast('That app could not be opened on this device.', { tone: 'warning' })
                );
              }}
            />
            <Text variant="caption" color="textTertiary">
              Joining happens in the other app, not here.
            </Text>
          </View>
        ) : null}

        {data.upcoming_activities.length > 0 ? (
          <>
            <View style={styles.blockPadded}>
              <SectionHeader title="Coming up" />
            </View>
            {data.upcoming_activities.map((activity, index) => (
              <View key={activity.id}>
                {index > 0 ? <Rule inset={space.gutter} /> : null}
                <View style={styles.activityRow}>
                  <View style={styles.activityText}>
                    <Text variant="body">{activity.title}</Text>
                    <Text variant="caption" color="textTertiary">
                      {formatDateTimeWithZone(activity.starts_at)}
                    </Text>
                  </View>
                  <Button
                    label="Open"
                    size="sm"
                    variant="ghost"
                    onPress={() => router.push(`/events/${activity.id}`)}
                  />
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

function Fact({ icon, label }: { icon: Parameters<typeof Icon>[0]['name']; label: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size="sm" color="textSecondary" />
      <Text variant="body" style={styles.factText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: space.gutter,
    gap: space.md,
  },
  hero: {
    paddingHorizontal: space.gutter,
    gap: space.lg,
  },
  heroText: {
    gap: space.xs,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.5,
  },
  facts: {
    gap: space.sm,
  },
  fact: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
  },
  factText: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    gap: space.md,
  },
  block: {
    paddingTop: space.xxl,
    gap: space.xl,
  },
  blockPadded: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    gap: space.md,
  },
  description: {
    paddingHorizontal: space.gutter,
    maxWidth: 640,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  activityText: {
    flex: 1,
    gap: 2,
  },
});
