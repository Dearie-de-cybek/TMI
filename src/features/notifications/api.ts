import { z } from 'zod';

import { apiGet, apiPost, apiPut, apiDelete } from '@/api/client';
import {
  messageResponseSchema,
  notificationPreferencesSchema,
  notificationSchema,
  paginated,
  type AppNotification,
  type NotificationPreferences,
  type Paginated,
} from '@/api/schemas';

export function fetchNotifications(page = 1): Promise<Paginated<AppNotification>> {
  return apiGet(paginated(notificationSchema), '/notifications', { query: { page } });
}

export function markNotificationRead(id: string) {
  return apiPost(messageResponseSchema, `/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return apiPost(messageResponseSchema, '/notifications/read-all');
}

export function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  return apiGet(notificationPreferencesSchema, '/notifications/preferences');
}

export function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return apiPut(notificationPreferencesSchema, '/notifications/preferences', preferences);
}

/**
 * Registers the device for push with the backend. The backend owns the push
 * credentials and the sending; the app only hands over its token.
 */
export function registerDevice(input: {
  token: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
}) {
  return apiPost(messageResponseSchema, '/devices', {
    token: input.token,
    platform: input.platform,
    app_version: input.appVersion,
  });
}

export function unregisterDevice(token: string) {
  return apiDelete(messageResponseSchema, `/devices/${encodeURIComponent(token)}`);
}

export const notificationCountSchema = z.object({ unread: z.number().int() });
