import { Platform } from 'react-native';

import { loadNotifications, pushEnvironment, pushUnavailableReason } from '@/features/notifications/module';
import { getPermissionStatus } from '@/features/notifications/push';
import { preferences, storageKeys } from '@/lib/storage';

/**
 * Prayer reminders.
 *
 * These are local notifications scheduled on the device, so they work without a
 * signed-in account, without a backend and without a push token. Two rhythms:
 *
 *  - a daily nudge at a time the member picks, to pray the decree and read the
 *    day's word;
 *  - a note on the first of each month, when the new decree is published.
 *
 * Every function degrades to a reason the UI can show (Expo Go and web cannot
 * schedule), and none of them throws into the screen that called it.
 */

export type ReminderSettings = {
  daily: boolean;
  hour: number;
  minute: number;
  monthly: boolean;
};

export const defaultReminders: ReminderSettings = {
  daily: false,
  hour: 6,
  minute: 0,
  monthly: false,
};

/** Times offered in the picker. Prayer happens at the edges of the day. */
export const reminderTimes: { label: string; hour: number; minute: number }[] = [
  { label: '5:30 am', hour: 5, minute: 30 },
  { label: '6:00 am', hour: 6, minute: 0 },
  { label: '12:00 pm', hour: 12, minute: 0 },
  { label: '6:00 pm', hour: 18, minute: 0 },
  { label: '9:00 pm', hour: 21, minute: 0 },
];

export function formatReminderTime(hour: number, minute: number): string {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${String(minute).padStart(2, '0')} ${suffix}`;
}

const CHANNEL_ID = 'devotion';

type Stored = ReminderSettings & { dailyId?: string | null; monthlyId?: string | null };

export async function loadReminders(): Promise<ReminderSettings> {
  const stored = await preferences.getJson<Stored>(storageKeys.prayerReminder);
  return { ...defaultReminders, ...(stored ?? {}) };
}

export type ApplyResult =
  | { ok: true }
  | { ok: false; reason: 'permission' | 'unsupported'; message: string };

/**
 * Makes the device's schedule match `settings`, replacing whatever was
 * scheduled before. Asks for permission only when a reminder is being turned on.
 */
export async function applyReminders(settings: ReminderSettings): Promise<ApplyResult> {
  const wantsAny = settings.daily || settings.monthly;
  const previous = await preferences.getJson<Stored>(storageKeys.prayerReminder);

  const notifications = loadNotifications();
  if (!notifications) {
    if (!wantsAny) {
      await preferences.setJson(storageKeys.prayerReminder, settings);
      return { ok: true };
    }
    return {
      ok: false,
      reason: 'unsupported',
      message: pushUnavailableReason(pushEnvironment()) || 'Reminders are not available here.',
    };
  }

  try {
    for (const id of [previous?.dailyId, previous?.monthlyId]) {
      if (id) await notifications.cancelScheduledNotificationAsync(id);
    }

    if (!wantsAny) {
      await preferences.setJson(storageKeys.prayerReminder, settings);
      return { ok: true };
    }

    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Prayer and devotion',
        importance: notifications.AndroidImportance.DEFAULT,
      });
    }

    let status = await getPermissionStatus();
    if (status !== 'granted') {
      await notifications.requestPermissionsAsync();
      status = await getPermissionStatus();
    }
    if (status !== 'granted') {
      await preferences.setJson(storageKeys.prayerReminder, {
        ...settings,
        daily: false,
        monthly: false,
      });
      return {
        ok: false,
        reason: 'permission',
        message: 'Notifications are switched off for this app. Turn them on in your phone’s settings to get reminders.',
      };
    }

    const types = notifications.SchedulableTriggerInputTypes;

    const dailyId = settings.daily
      ? await notifications.scheduleNotificationAsync({
          content: {
            title: 'Come back to the altar',
            body: 'Pray this month’s decree and read today’s word.',
            data: { link: '/devotion' },
          },
          trigger: {
            type: types.DAILY,
            hour: settings.hour,
            minute: settings.minute,
            channelId: CHANNEL_ID,
          },
        })
      : null;

    const monthlyId = settings.monthly
      ? await notifications.scheduleNotificationAsync({
          content: {
            title: 'A new month, a new decree',
            body: 'The Lead Pastor’s prophetic decree for this month is ready.',
            data: { link: '/devotion' },
          },
          trigger: { type: types.MONTHLY, day: 1, hour: 7, minute: 0, channelId: CHANNEL_ID },
        })
      : null;

    await preferences.setJson(storageKeys.prayerReminder, { ...settings, dailyId, monthlyId });
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'unsupported',
      message: 'Reminders could not be scheduled on this device.',
    };
  }
}
