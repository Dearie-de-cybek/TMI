import { apiDelete, apiGet, apiPost, idempotencyKey } from '@/api/client';
import {
  messageResponseSchema,
  paginated,
  pastoralCareSchema,
  prayerRequestSchema,
  type Paginated,
  type PastoralCare,
  type PrayerRequest,
  type PrayerVisibility,
} from '@/api/schemas';

/**
 * Prayer requests are sensitive personal information.
 *
 * `/prayer-requests` returns only the signed-in member's own requests. Requests
 * are never read into search results, the announcement feed or notifications,
 * and visibility is enforced by the backend - the app only states what the
 * member chose.
 */
export function fetchMyPrayerRequests(signal?: AbortSignal): Promise<Paginated<PrayerRequest>> {
  return apiGet(paginated(prayerRequestSchema), '/prayer-requests', { signal });
}

export function submitPrayerRequest(input: {
  body: string;
  visibility: PrayerVisibility;
  isAnonymous: boolean;
}): Promise<PrayerRequest> {
  return apiPost(
    prayerRequestSchema,
    '/prayer-requests',
    {
      body: input.body.trim(),
      visibility: input.visibility,
      is_anonymous: input.isAnonymous,
    },
    // A retry after a dropped connection must not create a second request.
    { idempotencyKey: idempotencyKey('prayer') }
  );
}

export function withdrawPrayerRequest(id: string) {
  return apiDelete(messageResponseSchema, `/prayer-requests/${id}`);
}

export function addPrayerFollowUp(input: { id: string; body: string }): Promise<PrayerRequest> {
  return apiPost(prayerRequestSchema, `/prayer-requests/${input.id}/follow-ups`, {
    body: input.body.trim(),
  });
}

export function fetchPastoralCare(): Promise<PastoralCare> {
  return apiGet(pastoralCareSchema, '/pastoral-care', { allowAnonymous: true });
}
