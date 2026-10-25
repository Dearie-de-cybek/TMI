import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import type { NotificationResponse } from 'expo-notifications';

import { safeInAppPath } from '@/lib/deep-links';

import { loadNotifications } from './module';
import { configureNotificationHandler } from './push';

/**
 * Routes a tapped notification to its destination.
 *
 * The `link` in a notification payload is server-supplied, so it is checked
 * against the in-app allowlist before it reaches the router. Anything else is
 * ignored and the member simply lands on the notification centre.
 *
 * `expo-notifications` is loaded through `./module`, never imported at the top
 * of this file: a static import throws during evaluation in runtimes without
 * the native module, and this hook is used by the root layout.
 */
export function useNotificationRouting(): void {
  const router = useRouter();

  useEffect(() => {
    const notifications = loadNotifications();
    if (!notifications) return;

    configureNotificationHandler();

    function handle(response: NotificationResponse) {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      const link = typeof data?.link === 'string' ? data.link : null;
      const safe = safeInAppPath(link);
      router.push(safe ?? '/notifications');
    }

    // A notification that launched the app from cold start.
    void notifications
      .getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handle(response);
      })
      .catch(() => undefined);

    const subscription = notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, [router]);
}
