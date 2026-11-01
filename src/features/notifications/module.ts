import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import type * as NotificationsModule from 'expo-notifications';

/**
 * Safe, lazy access to `expo-notifications`.
 *
 * The package cannot be imported at module scope. Its entry point re-exports
 * `topicSubscription`, which calls `requireNativeModule('ExpoTopicSubscriptionModule')`
 * while the module is being evaluated - so in any runtime without that native
 * module (Expo Go, and web) the *import itself* throws. Because the root layout
 * sits above everything, that failure took the whole app down rather than
 * disabling one feature.
 *
 * Everything here therefore loads the package on demand, behind a try/catch, and
 * returns `null` when push is not available. Callers degrade to an explanation
 * instead of a crash.
 */

export type Notifications = typeof NotificationsModule;

export type PushEnvironment =
  /** A development or production build with the native module present. */
  | 'supported'
  /** Expo Go: remote push and several native modules are not included. */
  | 'expo_go'
  /** Web: this app does not implement browser push. */
  | 'web'
  /** The module is present but failed to load. */
  | 'unavailable';

let cachedModule: Notifications | null | undefined;
let cachedEnvironment: PushEnvironment | undefined;

function detectEnvironment(): PushEnvironment {
  if (Platform.OS === 'web') return 'web';
  if (isRunningInExpoGo()) return 'expo_go';
  return 'supported';
}

export function pushEnvironment(): PushEnvironment {
  cachedEnvironment ??= detectEnvironment();
  if (cachedEnvironment === 'supported' && loadNotifications() === null) {
    cachedEnvironment = 'unavailable';
  }
  return cachedEnvironment;
}

/** The notifications module, or null when it cannot be used in this runtime. */
export function loadNotifications(): Notifications | null {
  if (cachedModule !== undefined) return cachedModule;

  if (detectEnvironment() !== 'supported') {
    cachedModule = null;
    return cachedModule;
  }

  try {
    // Deliberately a runtime require: a static import would be hoisted and
    // would throw while this file is being evaluated, which is the bug above.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-notifications') as Notifications;
  } catch (error) {
    if (__DEV__) {
      console.warn('[notifications] expo-notifications could not be loaded', error);
    }
    cachedModule = null;
  }

  return cachedModule;
}

/** Member-facing explanation for why push is off in this runtime. */
export function pushUnavailableReason(environment: PushEnvironment): string {
  switch (environment) {
    case 'expo_go':
      return 'Expo Go cannot receive push notifications. Install a development build of TwainMan Ministry to test them.';
    case 'web':
      return 'Push notifications are not available in the web version of the app.';
    case 'unavailable':
      return 'The notification module is missing from this build. Rebuild the app to enable push.';
    case 'supported':
      return '';
  }
}

/** Test seam: clears the cached module so each test starts from a clean state. */
export function resetNotificationModuleCache(): void {
  cachedModule = undefined;
  cachedEnvironment = undefined;
}
