import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { safeInAppPath } from '@/lib/deep-links';

import { configureNotificationHandler } from './push';

/**
 * Routes a tapped notification to its destination.
 *
 * The `link` in a notification payload is server-supplied, so it is checked
 * against the in-app allowlist before it reaches the router. Anything else is
 * ignored and the member simply lands on the notification centre.
 */
export function useNotificationRouting(): void {
  const router = useRouter();

  useEffect(() => {
    // Push is a native capability; the web build has no notification module to
    // query and would throw on the cold-start lookup below.
    if (Platform.OS === 'web') return;

    configureNotificationHandler();

    function handle(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      const link = typeof data?.link === 'string' ? data.link : null;
      const safe = safeInAppPath(link);
      router.push(safe ?? '/notifications');
    }

    // A notification that launched the app from cold start.
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handle(response);
      })
      .catch(() => undefined);

    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, [router]);
}
