import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './errors';

/**
 * Server-state configuration.
 *
 * Retries are deliberately narrow: only failures that could plausibly succeed on
 * a second attempt are retried, so a 403 on course materials or a 422 on a form
 * surfaces immediately instead of after three silent attempts.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 15 * 60_000,
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false;
          if (ApiError.isApiError(error)) return error.retryable && error.kind !== 'offline';
          return false;
        },
        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Mutations are never retried automatically — a repeated POST could
        // double-register or double-charge. Members retry explicitly.
        retry: false,
      },
    },
  });
}

/**
 * Query keys in one place so invalidation after a mutation cannot drift from the
 * keys the screens actually use.
 */
export const queryKeys = {
  home: ['home'] as const,
  devotional: ['devotional', 'today'] as const,
  devotionals: ['devotional', 'recent'] as const,
  decree: (period: string) => ['decree', period] as const,
  devotionProgress: ['devotion', 'progress'] as const,

  session: ['session'] as const,
  profile: ['profile'] as const,
  interests: ['profile', 'interests'] as const,

  sermons: (filters: Record<string, unknown> = {}) => ['sermons', filters] as const,
  sermonFilters: ['sermons', 'filters'] as const,
  sermon: (id: string) => ['sermons', 'detail', id] as const,
  transcript: (id: string) => ['sermons', 'transcript', id] as const,
  studyNotes: (id: string) => ['sermons', 'study-notes', id] as const,
  relatedSermons: (id: string) => ['sermons', 'related', id] as const,
  askConversation: (id: string) => ['sermons', 'ask', id] as const,
  saved: ['saved'] as const,

  search: (query: string, types: string[]) => ['search', query, types] as const,
  searchSuggestions: (query: string) => ['search', 'suggestions', query] as const,

  programs: ['programs'] as const,
  courses: (filters: Record<string, unknown> = {}) => ['courses', filters] as const,
  course: (id: string) => ['courses', 'detail', id] as const,
  enrollments: ['enrollments'] as const,
  lesson: (id: string) => ['lessons', id] as const,
  quiz: (id: string) => ['quizzes', id] as const,
  courseSessions: (id: string) => ['courses', id, 'sessions'] as const,
  certificates: ['certificates'] as const,

  events: (scope: string) => ['events', scope] as const,
  event: (id: string) => ['events', 'detail', id] as const,

  prayerRequests: ['prayer-requests'] as const,
  pastoralCare: ['pastoral-care'] as const,

  groups: (filters: Record<string, unknown> = {}) => ['groups', filters] as const,
  group: (id: string) => ['groups', 'detail', id] as const,

  givingCategories: ['giving', 'categories'] as const,
  givingIntent: (reference: string) => ['giving', 'intents', reference] as const,
  transactions: ['giving', 'transactions'] as const,

  announcements: (filters: Record<string, unknown> = {}) => ['announcements', filters] as const,
  announcement: (id: string) => ['announcements', 'detail', id] as const,

  notifications: ['notifications'] as const,
  notificationPreferences: ['notifications', 'preferences'] as const,
} as const;
