import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { describeError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type NotificationPreferences } from '@/api/schemas';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { useToast } from '@/components/app/toast';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { SettingsRow } from '@/components/ui/content-row';
import { NavBar } from '@/components/ui/header';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { space } from '@/design/tokens';
import { useIsSignedIn } from '@/features/auth/use-require-auth';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/features/notifications/api';
import { pushEnvironment, pushUnavailableReason } from '@/features/notifications/module';
import {
  getPermissionStatus,
  registerForPush,
  type PushPermissionStatus,
  type PushRegistrationResult,
} from '@/features/notifications/push';

const categories: { key: keyof NotificationPreferences; label: string; hint: string }[] = [
  { key: 'announcements', label: 'Church announcements', hint: 'Notices that affect everyone.' },
  { key: 'new_sermons', label: 'New teaching', hint: 'When a sermon is published.' },
  { key: 'events', label: 'Events', hint: 'Reminders for events you registered for.' },
  { key: 'courses', label: 'Courses', hint: 'Lesson releases and live session reminders.' },
  { key: 'prayer', label: 'Prayer', hint: 'Updates on requests you have sent.' },
  { key: 'giving', label: 'Giving', hint: 'Receipts and recurring gift reminders.' },
];

/**
 * Notification settings.
 *
 * The permission prompt is only ever raised from the button here, after the
 * member has read what the church sends — never on first launch. A denied
 * prompt is explained with the route to the OS settings, not re-asked.
 */
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const signedIn = useIsSignedIn();

  const [permission, setPermission] = useState<PushPermissionStatus | null>(null);
  const [registration, setRegistration] = useState<PushRegistrationResult | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    void getPermissionStatus().then(setPermission);
  }, []);

  const preferences = useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: fetchNotificationPreferences,
    enabled: signedIn,
  });

  const update = useMutation({
    mutationFn: (partial: Partial<NotificationPreferences>) =>
      updateNotificationPreferences(partial),
    onMutate: async (partial) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notificationPreferences });
      const previous = queryClient.getQueryData<NotificationPreferences>(
        queryKeys.notificationPreferences
      );
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(queryKeys.notificationPreferences, {
          ...previous,
          ...partial,
        });
      }
      return { previous };
    },
    onError: (error, _partial, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notificationPreferences, context.previous);
      }
      toast(describeError(error).message, { tone: 'warning' });
    },
  });

  async function enablePush() {
    setRegistering(true);
    try {
      const result = await registerForPush(
        Constants.expoConfig?.version ?? '1.0.0'
      );
      setRegistration(result);
      setPermission(await getPermissionStatus());
      if (result.status === 'registered') {
        toast('This device will now receive notifications.', { tone: 'success', icon: 'bell' });
      }
    } finally {
      setRegistering(false);
    }
  }

  if (!signedIn) {
    return (
      <Screen>
        <NavBar title="Notifications" />
        <ScreenScroll padded>
          <SignInPrompt
            title="Notification choices are per member"
            message="Sign in to choose what the church sends you."
            reason="notifications"
            next="/settings/notifications"
          />
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <NavBar title="Notifications" />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.intro}>
          <Text variant="title">What the church sends</Text>
          <Text variant="body" color="textSecondary">
            TwainMan Ministry uses notifications for announcements, reminders for what you signed up
            for, and updates on your own requests. Nothing is sent for marketing, and you can turn
            any of it off.
          </Text>
        </View>

        <View style={styles.permission}>
          {permission === 'unavailable' ? (
            <Banner
              tone="info"
              icon="bell-off"
              title="Push is not available here"
              message={pushUnavailableReason(pushEnvironment())}
            />
          ) : permission === 'granted' ? (
            <Banner
              tone="success"
              icon="bell"
              message="This device is allowed to show notifications."
            />
          ) : permission === 'denied' ? (
            <Banner
              tone="warning"
              icon="bell-off"
              title="Notifications are switched off for this app"
              message="Your device is blocking them. You can turn them back on in the system settings."
              action={{
                label: 'Open settings',
                onPress: () => {
                  void Linking.openSettings().catch(() =>
                    toast('Could not open settings on this device.', { tone: 'warning' })
                  );
                },
              }}
            />
          ) : (
            <Button
              label="Allow notifications"
              icon="bell"
              fullWidth
              loading={registering}
              onPress={() => void enablePush()}
            />
          )}

          {registration && registration.status !== 'registered' ? (
            <Banner
              tone="info"
              title={
                registration.status === 'denied'
                  ? 'You declined the prompt'
                  : 'Push is not available in this build'
              }
              message={
                registration.status === 'denied'
                  ? 'Nothing was changed. You can allow notifications later from the system settings.'
                  : registration.reason
              }
            />
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <SectionHeader
            title="Choose what you hear about"
            description={
              Platform.OS === 'ios'
                ? 'These choices apply to every device you sign in on.'
                : 'These choices apply to every device you sign in on.'
            }
          />
        </View>

        {preferences.isPending ? (
          <SkeletonList count={5} withThumbnail={false} />
        ) : preferences.isError ? (
          <ErrorState compact error={preferences.error} onRetry={() => void preferences.refetch()} />
        ) : (
          <View>
            <Rule />
            {categories.map((category, index) => (
              <View key={category.key}>
                {index > 0 ? <Rule inset={space.gutter} /> : null}
                <SettingsRow
                  label={category.label}
                  hint={category.hint}
                  toggle={{
                    value: preferences.data[category.key],
                    disabled: update.isPending,
                    onChange: (next) => update.mutate({ [category.key]: next }),
                  }}
                />
              </View>
            ))}
            <Rule />
          </View>
        )}

        <View style={styles.footer}>
          <Button
            label="See your notifications"
            variant="ghost"
            onPress={() => router.push('/notifications')}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    gap: space.sm,
  },
  permission: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    gap: space.md,
  },
  sectionHeader: {
    paddingHorizontal: space.gutter,
  },
  footer: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    alignItems: 'flex-start',
  },
});
