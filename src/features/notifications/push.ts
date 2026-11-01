import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { isDemoMode } from '@/config/runtime';
import { preferences, storageKeys } from '@/lib/storage';

import { registerDevice, unregisterDevice } from './api';
import { loadNotifications, pushEnvironment, pushUnavailableReason } from './module';

/**
 * Push registration.
 *
 * The permission prompt is never shown on first launch: `settings/notifications`
 * explains what the church sends and the member asks for it. Everything that
 * could fail - no notifications module in this runtime, no device support, a
 * denied prompt, a missing EAS project id - returns a reason the UI can show
 * instead of throwing.
 *
 * `expo-notifications` is reached only through `./module`, which loads it lazily;
 * see the note there for why a static import is unsafe.
 */

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type PushRegistrationResult =
  | { status: 'registered'; token: string }
  | { status: 'denied' }
  | { status: 'unsupported'; reason: string }
  | { status: 'unavailable'; reason: string };

export function configureNotificationHandler(): void {
  const notifications = loadNotifications();
  if (!notifications) return;

  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

export async function getPermissionStatus(): Promise<PushPermissionStatus> {
  const notifications = loadNotifications();
  if (!notifications) return 'unavailable';

  try {
    const settings = await notifications.getPermissionsAsync();
    if (settings.status === 'granted') return 'granted';
    if (settings.status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unavailable';
  }
}

/** True once the member has seen the explanation screen at least once. */
export async function hasBeenPrompted(): Promise<boolean> {
  return (await preferences.getString(storageKeys.notificationsPrompted)) === 'true';
}

export async function registerForPush(appVersion: string): Promise<PushRegistrationResult> {
  await preferences.setString(storageKeys.notificationsPrompted, 'true');

  const environment = pushEnvironment();
  if (environment !== 'supported') {
    return { status: 'unsupported', reason: pushUnavailableReason(environment) };
  }

  const notifications = loadNotifications();
  if (!notifications) {
    return { status: 'unavailable', reason: pushUnavailableReason('unavailable') };
  }

  if (!Device.isDevice) {
    return {
      status: 'unsupported',
      reason: 'Push notifications need a physical device, a simulator cannot receive them.',
    };
  }

  const existing = await notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return { status: 'denied' };

  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync('default', {
      name: 'Church notifications',
      importance: notifications.AndroidImportance.DEFAULT,
      lightColor: '#2F4A3C',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
  if (!projectId) {
    return {
      status: 'unavailable',
      reason:
        'This build has no EAS project id, so a push token cannot be issued. Run `eas init` and rebuild.',
    };
  }

  try {
    const token = await notifications.getExpoPushTokenAsync({ projectId });
    if (isDemoMode()) {
      // Demo mode has no server to register with, and must not pretend it did.
      return { status: 'unavailable', reason: 'Demo mode cannot register for push notifications.' };
    }
    await registerDevice({
      token: token.data,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
      appVersion,
    });
    return { status: 'registered', token: token.data };
  } catch (error) {
    return {
      status: 'unavailable',
      reason: error instanceof Error ? error.message : 'Could not get a push token.',
    };
  }
}

export async function deregisterPush(token: string): Promise<void> {
  if (isDemoMode()) return;
  try {
    await unregisterDevice(token);
  } catch {
    // A token the server has already dropped does not need removing.
  }
}
