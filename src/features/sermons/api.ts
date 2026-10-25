import { z } from 'zod';

import { apiDelete, apiGet, apiPost } from '@/api/client';
import {
  askConversationSchema,
  messageResponseSchema,
  paginated,
  savedContentSchema,
  sermonFiltersSchema,
  sermonSchema,
  studyNotesSchema,
  transcriptSchema,
  type AskConversation,
  type Paginated,
  type SavedContent,
  type Sermon,
  type SermonFilters,
  type StudyNotes,
  type Transcript,
} from '@/api/schemas';

export type SermonQuery = {
  search?: string;
  speaker?: string | null;
  series?: string | null;
  topic?: string | null;
  scripture?: string | null;
  from?: string | null;
  to?: string | null;
  sort?: 'newest' | 'oldest';
  page?: number;
};

export function fetchSermons(query: SermonQuery, signal?: AbortSignal): Promise<Paginated<Sermon>> {
  return apiGet(paginated(sermonSchema), '/sermons', {
    allowAnonymous: true,
    signal,
    query: {
      search: query.search,
      speaker: query.speaker,
      series: query.series,
      topic: query.topic,
      scripture: query.scripture,
      from: query.from,
      to: query.to,
      sort: query.sort,
      page: query.page ?? 1,
    },
  });
}

export function fetchSermonFilters(): Promise<SermonFilters> {
  return apiGet(sermonFiltersSchema, '/sermons/filters', { allowAnonymous: true });
}

export function fetchSermon(id: string, signal?: AbortSignal): Promise<Sermon> {
  return apiGet(sermonSchema, `/sermons/${id}`, { allowAnonymous: true, signal });
}

export function fetchTranscript(id: string, signal?: AbortSignal): Promise<Transcript> {
  return apiGet(transcriptSchema, `/sermons/${id}/transcript`, { allowAnonymous: true, signal });
}

export function fetchStudyNotes(id: string, signal?: AbortSignal): Promise<StudyNotes> {
  return apiGet(studyNotesSchema, `/sermons/${id}/study-notes`, { allowAnonymous: true, signal });
}

export function fetchRelatedSermons(id: string): Promise<Sermon[]> {
  return apiGet(z.object({ data: z.array(sermonSchema) }), `/sermons/${id}/related`, {
    allowAnonymous: true,
  }).then((response) => response.data);
}

export function saveSermon(id: string) {
  return apiPost(messageResponseSchema, `/sermons/${id}/save`);
}

export function unsaveSermon(id: string) {
  return apiDelete(messageResponseSchema, `/sermons/${id}/save`);
}

export const progressSchema = z.object({
  position_seconds: z.number(),
  duration_seconds: z.number().nullable().optional(),
  completed: z.boolean(),
  updated_at: z.string().optional(),
});

/**
 * Reports the listening position. Called on a timer and when playback stops, so
 * a member can resume on another device. The server is the record of truth.
 */
export function reportSermonProgress(input: {
  id: string;
  positionSeconds: number;
  durationSeconds?: number | null;
  completed?: boolean;
}) {
  return apiPost(progressSchema, `/sermons/${input.id}/progress`, {
    position_seconds: Math.round(input.positionSeconds),
    duration_seconds: input.durationSeconds == null ? null : Math.round(input.durationSeconds),
    completed: input.completed ?? false,
  });
}

export function fetchAskConversation(sermonId: string): Promise<AskConversation> {
  return apiGet(askConversationSchema, `/sermons/${sermonId}/ask`);
}

export function askSermon(input: { sermonId: string; question: string }): Promise<AskConversation> {
  return apiPost(askConversationSchema, `/sermons/${input.sermonId}/ask`, {
    question: input.question,
  });
}

export function fetchSavedContent(): Promise<SavedContent> {
  return apiGet(savedContentSchema, '/saved');
}
