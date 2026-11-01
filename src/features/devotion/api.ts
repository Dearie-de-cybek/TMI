import { z } from 'zod';

import { apiGet, apiPut } from '@/api/client';
import {
  devotionProgressSchema,
  devotionalSchema,
  propheticDecreeSchema,
  type Devotional,
  type DevotionProgress,
  type PropheticDecree,
} from '@/api/schemas';

import { toWireProgress, type DevotionSnapshot } from './progress-store';

/**
 * The devotional life: the day's reading, and the month's prophetic decree.
 *
 * Both are published by the church. Progress is owned by the device (see
 * `progress-store`) and mirrored here so it follows a signed-in member between
 * devices — the sync is best-effort by design, because a failed request must
 * never stop someone praying.
 */

export function fetchCurrentDecree(signal?: AbortSignal): Promise<PropheticDecree> {
  return apiGet(propheticDecreeSchema, '/devotions/decree/current', {
    allowAnonymous: true,
    signal,
  });
}

export function fetchDecree(period: string, signal?: AbortSignal): Promise<PropheticDecree> {
  return apiGet(propheticDecreeSchema, `/devotions/decree/${period}`, {
    allowAnonymous: true,
    signal,
  });
}

export function fetchTodayDevotional(signal?: AbortSignal): Promise<Devotional> {
  return apiGet(devotionalSchema, '/devotionals/today', { allowAnonymous: true, signal });
}

export function fetchRecentDevotionals(signal?: AbortSignal): Promise<Devotional[]> {
  return apiGet(z.object({ data: z.array(devotionalSchema) }), '/devotionals', {
    allowAnonymous: true,
    signal,
  }).then((response) => response.data);
}

export function fetchDevotionProgress(): Promise<DevotionProgress> {
  return apiGet(devotionProgressSchema, '/devotions/progress');
}

export function pushDevotionProgress(snapshot: DevotionSnapshot): Promise<DevotionProgress> {
  return apiPut(devotionProgressSchema, '/devotions/progress', toWireProgress(snapshot));
}
