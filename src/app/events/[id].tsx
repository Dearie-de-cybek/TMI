import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { describeError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type ChurchEvent } from '@/api/schemas';
import { useToast } from '@/components/app/toast';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ContentImage } from '@/components/ui/content-image';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { addEventToCalendar } from '@/features/events/calendar';
import { cancelEventRegistration, fetchEvent, registerForEvent } from '@/features/events/api';
import { formatDate, formatTimeRange, isPast } from '@/lib/datetime';
import { isSafeExternalUrl } from '@/lib/deep-links';
import { eventFormatLabel } from '@/lib/format';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();
  const [calendarBusy, setCalendarBusy] = useState(false);

  const event = useQuery({
    queryKey: queryKeys.event(id),
    queryFn: ({ signal }) => fetchEvent(id, signal),
    enabled: Boolean(id),
  });

  function onMutationSuccess(updated: ChurchEvent, message: string) {
    queryClient.setQueryData(queryKeys.event(id), updated);
    void queryClient.invalidateQueries({ queryKey: queryKeys.events('upcoming') });
    void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    toast(message, { tone: 'success', icon: 'check' });
  }

  const register = useMutation({
    mutationFn: () => registerForEvent(id),
    onSuccess: (updated) =>
      onMutationSuccess(
        updated,
        updated.registration.my_status === 'waitlisted'
          ? 'You are on the waiting list.'
          : 'You are registered.'
      ),
  });

  const cancel = useMutation({
    mutationFn: () => cancelEventRegistration(id),
    onSuccess: (updated) => onMutationSuccess(updated, 'Your registration is cancelled.'),
  });

  if (event.isPending) {
    return (
      <Screen>
        <NavBar />
        <View style={styles.loading}>
          <Skeleton height={140} />
          <Skeleton width="70%" height={26} />
          <Skeleton width="50%" height={14} />
          <Skeleton height={80} />
        </View>
      </Screen>
    );
  }

  if (event.isError) {
    return (
      <Screen>
        <NavBar />
        <ErrorState error={event.error} onRetry={() => void event.refetch()} />
      </Screen>
    );
  }

  const data = event.data;
  const past = isPast(data.ends_at ?? data.starts_at);
  const registration = data.registration;
  const registered = registration.my_status === 'registered' || registration.my_status === 'waitlisted';
  const full =
    registration.capacity != null && (registration.registered_count ?? 0) >= registration.capacity;
  const actionError = register.error ?? cancel.error;
  const described = actionError ? describeError(actionError) : null;

  async function addToCalendar() {
    setCalendarBusy(true);
    try {
      const result = await addEventToCalendar(data);
      if (result.status === 'added') {
        toast(`Added to ${result.calendarTitle}.`, { tone: 'success', icon: 'calendar' });
      } else if (result.status === 'denied') {
        toast('Calendar access was declined, so nothing was added.', { tone: 'warning' });
      } else {
        toast(result.reason, { tone: 'warning' });
      }
    } catch (error) {
      toast(describeError(error).message, { tone: 'warning' });
    } finally {
      setCalendarBusy(false);
    }
  }

  return (
    <Screen>
      <NavBar
        title={data.title}
        actions={[
          {
            icon: 'share',
            label: 'Share this event',
            onPress: () => {
              void Share.share({
                title: data.title,
                message: `${data.title} — ${formatDate(data.starts_at, data.timezone)}, TwainMan Ministry`,
              }).catch(() => undefined);
            },
          },
        ]}
      />

      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.hero}>
          <ContentImage
            uri={data.artwork_url}
            seed={data.title}
            height={150}
            label={`Artwork for ${data.title}`}
            style={{ borderRadius: radius.sm }}
          />
          <View style={styles.heroText}>
            <Eyebrow>{eventFormatLabel(data.format)}</Eyebrow>
            <Text style={[styles.title, { color: colors.text }]}>{data.title}</Text>
          </View>

          <View style={styles.facts}>
            <Fact icon="calendar" label={formatDate(data.starts_at, data.timezone)} />
            <Fact
              icon="clock"
              label={formatTimeRange(data.starts_at, data.ends_at, data.timezone)}
              hint={`Times shown in the church’s time zone (${data.timezone}).`}
            />
            {data.venue_name || data.address ? (
              <Fact
                icon="map-pin"
                label={[data.venue_name, data.address].filter(Boolean).join(', ')}
              />
            ) : null}
            {data.organizer ? <Fact icon="users" label={data.organizer} /> : null}
            {registration.capacity != null ? (
              <Fact
                icon="user-check"
                label={`${registration.registered_count ?? 0} of ${registration.capacity} places taken`}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          {described ? <Banner tone="danger" title={described.title} message={described.message} /> : null}

          {past ? (
            <Banner
              tone="info"
              icon="clock"
              title="This event has finished"
              message={
                data.replay_url
                  ? 'A recording is available below.'
                  : 'No recording has been published for it.'
              }
            />
          ) : registered ? (
            <>
              <Banner
                tone="success"
                icon="check-circle"
                title={
                  registration.my_status === 'waitlisted'
                    ? 'You are on the waiting list'
                    : 'You are registered'
                }
                message={
                  registration.my_status === 'waitlisted'
                    ? 'The church will contact you if a place opens.'
                    : 'The church has your registration. You can cancel it here if your plans change.'
                }
              />
              <Button
                label="Cancel my registration"
                variant="secondary"
                fullWidth
                loading={cancel.isPending}
                onPress={() => cancel.mutate()}
              />
            </>
          ) : registration.required && registration.open ? (
            <Button
              label={full ? 'Join the waiting list' : 'Register'}
              fullWidth
              loading={register.isPending}
              onPress={() => {
                if (!requireAuth({ reason: 'register', next: `/events/${id}` })) return;
                register.mutate();
              }}
            />
          ) : registration.required ? (
            <Banner
              tone="info"
              title="Registration is closed"
              message="Contact the church office if you still want to come."
            />
          ) : (
            <Banner
              tone="info"
              icon="info"
              message="No registration needed — come along."
            />
          )}

          {!past ? (
            <Button
              label="Add to my calendar"
              variant="ghost"
              icon="calendar"
              fullWidth
              loading={calendarBusy}
              onPress={() => void addToCalendar()}
            />
          ) : null}
        </View>

        {data.description ? (
          <View style={styles.description}>
            <Rule />
            <Text variant="bodyLarge" style={styles.descriptionText}>
              {data.description}
            </Text>
          </View>
        ) : null}

        {!past && data.online_url && isSafeExternalUrl(data.online_url) ? (
          <View style={styles.actions}>
            <Button
              label="Open the joining link"
              variant="secondary"
              icon="external-link"
              iconPosition="trailing"
              fullWidth
              onPress={() => void WebBrowser.openBrowserAsync(data.online_url!)}
            />
          </View>
        ) : null}

        {data.replay_url && isSafeExternalUrl(data.replay_url) ? (
          <View style={styles.actions}>
            <Button
              label="Watch the recording"
              variant="secondary"
              icon="play-circle"
              fullWidth
              onPress={() => void WebBrowser.openBrowserAsync(data.replay_url!)}
            />
          </View>
        ) : null}

        {past ? (
          <View style={styles.actions}>
            <Button
              label="See what is coming up"
              variant="ghost"
              fullWidth
              onPress={() => router.replace('/events')}
            />
          </View>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

function Fact({
  icon,
  label,
  hint,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  hint?: string;
}) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size="sm" color="textSecondary" />
      <View style={styles.factText}>
        <Text variant="body">{label}</Text>
        {hint ? (
          <Text variant="caption" color="textTertiary">
            {hint}
          </Text>
        ) : null}
      </View>
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
    fontFamily: fonts.serifSemiBold,
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  facts: {
    gap: space.md,
  },
  fact: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
  },
  factText: {
    flex: 1,
    gap: 2,
  },
  actions: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    gap: space.md,
  },
  description: {
    paddingTop: space.xxl,
    gap: space.xl,
  },
  descriptionText: {
    paddingHorizontal: space.gutter,
    maxWidth: 640,
  },
});
