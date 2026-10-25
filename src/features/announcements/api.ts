import { apiGet, apiPost } from '@/api/client';
import {
  announcementSchema,
  messageResponseSchema,
  paginated,
  type Announcement,
  type Paginated,
} from '@/api/schemas';

export function fetchAnnouncements(
  options: { scope?: string | null; unread?: boolean; page?: number } = {},
  signal?: AbortSignal
): Promise<Paginated<Announcement>> {
  return apiGet(paginated(announcementSchema), '/announcements', {
    allowAnonymous: true,
    signal,
    query: {
      scope: options.scope,
      unread: options.unread ? 'true' : undefined,
      page: options.page ?? 1,
    },
  });
}

export function fetchAnnouncement(id: string, signal?: AbortSignal): Promise<Announcement> {
  return apiGet(announcementSchema, `/announcements/${id}`, { allowAnonymous: true, signal });
}

export function markAnnouncementRead(id: string) {
  return apiPost(messageResponseSchema, `/announcements/${id}/read`);
}
