import { apiDelete, apiGet, apiPost } from '@/api/client';
import { groupSchema, paginated, type Group, type Paginated } from '@/api/schemas';

export function fetchGroups(
  options: { type?: string | null; search?: string; page?: number } = {},
  signal?: AbortSignal
): Promise<Paginated<Group>> {
  return apiGet(paginated(groupSchema), '/groups', {
    allowAnonymous: true,
    signal,
    query: { type: options.type, search: options.search, page: options.page ?? 1 },
  });
}

export function fetchGroup(id: string, signal?: AbortSignal): Promise<Group> {
  return apiGet(groupSchema, `/groups/${id}`, { allowAnonymous: true, signal });
}

/**
 * Asks to join. Group leaders approve requests, so the result is normally
 * `pending` — the app never shows a member as joined before the server says so.
 */
export function requestGroupMembership(id: string): Promise<Group> {
  return apiPost(groupSchema, `/groups/${id}/membership`);
}

export function leaveGroup(id: string): Promise<Group> {
  return apiDelete(groupSchema, `/groups/${id}/membership`);
}
