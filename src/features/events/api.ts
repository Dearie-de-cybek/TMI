import { apiDelete, apiGet, apiPost, idempotencyKey } from '@/api/client';
import { eventSchema, paginated, type ChurchEvent, type Paginated } from '@/api/schemas';

export type EventScope = 'upcoming' | 'past';

export function fetchEvents(
  scope: EventScope,
  page = 1,
  signal?: AbortSignal
): Promise<Paginated<ChurchEvent>> {
  return apiGet(paginated(eventSchema), '/events', {
    allowAnonymous: true,
    signal,
    query: { scope, page },
  });
}

export function fetchEvent(id: string, signal?: AbortSignal): Promise<ChurchEvent> {
  return apiGet(eventSchema, `/events/${id}`, { allowAnonymous: true, signal });
}

/**
 * Registration is idempotent: a retry after a dropped connection returns the
 * existing registration rather than creating a second one.
 */
export function registerForEvent(id: string): Promise<ChurchEvent> {
  return apiPost(eventSchema, `/events/${id}/registration`, undefined, {
    idempotencyKey: idempotencyKey(`event-${id}`),
  });
}

export function cancelEventRegistration(id: string): Promise<ChurchEvent> {
  return apiDelete(eventSchema, `/events/${id}/registration`);
}
