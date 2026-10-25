import { z } from 'zod';

import { apiGet } from '@/api/client';
import { searchResponseSchema, type SearchResponse } from '@/api/schemas';
import { preferences, storageKeys } from '@/lib/storage';

export type SearchType = 'sermon' | 'course' | 'event' | 'announcement' | 'group';

/**
 * Global search runs on the server across every published content type — it is
 * not a filter over whatever a screen happens to have loaded.
 */
export function search(
  input: { query: string; types?: SearchType[]; page?: number },
  signal?: AbortSignal
): Promise<SearchResponse> {
  return apiGet(searchResponseSchema, '/search', {
    allowAnonymous: true,
    signal,
    query: {
      q: input.query,
      types: input.types && input.types.length > 0 ? input.types.join(',') : undefined,
      page: input.page ?? 1,
    },
  });
}

export function fetchSuggestions(query: string, signal?: AbortSignal): Promise<string[]> {
  return apiGet(z.object({ data: z.array(z.string()) }), '/search/suggestions', {
    allowAnonymous: true,
    signal,
    query: { q: query },
  }).then((response) => response.data);
}

const MAX_RECENT = 6;

export async function loadRecentSearches(): Promise<string[]> {
  return (await preferences.getJson<string[]>(storageKeys.recentSearches)) ?? [];
}

export async function rememberSearch(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return loadRecentSearches();
  const existing = await loadRecentSearches();
  const next = [trimmed, ...existing.filter((item) => item !== trimmed)].slice(0, MAX_RECENT);
  await preferences.setJson(storageKeys.recentSearches, next);
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  await preferences.remove(storageKeys.recentSearches);
}
