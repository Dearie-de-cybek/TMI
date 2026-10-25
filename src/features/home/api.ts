import { apiGet } from '@/api/client';
import { devotionalSchema, homeFeedSchema, type Devotional, type HomeFeed } from '@/api/schemas';

/**
 * Home is composed by the backend.
 *
 * The server decides what deserves attention given recency, the member's
 * enrolments and what is coming up; the app renders what it is sent and adapts
 * to whichever sections are empty. That keeps "what is important" out of the
 * client, where it would drift from what the church actually wants to surface.
 */
export function fetchHomeFeed(signal?: AbortSignal): Promise<HomeFeed> {
  return apiGet(homeFeedSchema, '/home', { allowAnonymous: true, signal });
}

export function fetchTodayDevotional(): Promise<Devotional> {
  return apiGet(devotionalSchema, '/devotionals/today', { allowAnonymous: true });
}
