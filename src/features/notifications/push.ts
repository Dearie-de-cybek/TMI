import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
// Imported by name: the enum reaches the package root through `export *`, which
// the import plugin cannot follow on a namespace access.
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { isDemoMode } from '@/config/runtime';
import { preferences, storageKeys } from '@/lib/storage';

import { registerDevice, unregisterDevice } from './api';

/**
 * Push registration.
 *
 * The permission prompt is never shown on first launch: `settings/notifications`
 * explains what the church sends and the member asks for it. Everything that
 * could fail — no device support, a denied prompt, a missing EAS project id —
 * returns a reason the UI can show instead of throwing.
 */

export type PushRegistrationResult =
  | { status: 'registered'; token: string }
  | { status: 'denied' }
  | { status: 'unsupported'; reason: string }
  | { status: 'unavailable'; reason: string };

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.status;
}

/** True once the member has seen the explanation screen at least once. */
export async function hasBeenPrompted(): Promise<boolean> {
  return (await preferences.getString(storageKeys.notificationsPrompted)) === 'true';
}

export async function registerForPush(appVersion: string): Promise<PushRegistrationResult> {
  await preferences.setString(storageKeys.notificationsPrompted, 'true');

  if (!Device.isDevice) {
    return {
      status: 'unsupported',
      reason: 'Push notifications need a physical device — a simulator cannot receive them.',
    };
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return { status: 'denied' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Church notifications',
      importance: AndroidImportance.DEFAULT,
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
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
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
