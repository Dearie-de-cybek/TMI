import { ApiError } from '../errors';
import { getAuthToken } from '../session';
import { type RequestOptions, type Transport } from '../transport';

import {
  demoAccessCodes,
  demoAnnouncements,
  demoCourses,
  demoDevotionals,
  demoEvents,
  demoGivingCategories,
  demoGroups,
  demoInterests,
  demoLessons,
  demoLiveSessions,
  demoMaterials,
  demoMember,
  demoModules,
  demoPastoralCare,
  demoPrograms,
  demoQuizzes,
  demoSermons,
  demoSpeakers,
  demoStudyNotes,
  demoTranscripts,
} from './content';
import { demoId, getDemoState, mutateDemoState, type DemoState } from './state';

/**
 * Development data provider.
 *
 * Implements the same `Transport` contract as the HTTP layer so every screen is
 * exercised without the Laravel backend. It deliberately keeps the parts a real
 * server owns on the server side of the seam:
 *
 * - access codes are validated and consumed here, not in the UI;
 * - lesson progress and completion counts are returned by this layer, never
 *   derived in a component;
 * - giving intents resolve to `demo_not_processed`, because no money moves.
 *
 * Nothing it returns is presented as persisted or charged; the app renders an
 * explicit demo notice wherever an action would normally reach a server.
 */

const LATENCY_MIN = 160;
const LATENCY_MAX = 420;

function wait(signal?: AbortSignal): Promise<void> {
  const delay = LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delay);
    function onAbort() {
      clearTimeout(timer);
      reject(new ApiError('cancelled', 'Request cancelled.'));
    }
    signal?.addEventListener('abort', onAbort);
  });
}

type Query = NonNullable<RequestOptions['query']>;
type Body = Record<string, unknown>;

type Handler = (context: {
  params: string[];
  query: Query;
  body: Body;
  options: RequestOptions;
  state: DemoState;
}) => unknown | Promise<unknown>;

type Route = { method: string; pattern: RegExp; handler: Handler; anonymous?: boolean };

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paginate<T>(items: T[], query: Query) {
  const perPage = Math.max(1, Math.min(50, number(query.per_page) || 20));
  const page = Math.max(1, number(query.page) || 1);
  const start = (page - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil(items.length / perPage)),
      per_page: perPage,
      total: items.length,
    },
  };
}

function notFound(what: string): never {
  throw new ApiError('not_found', `${what} is no longer available.`, { status: 404 });
}

function validation(message: string, errors: Record<string, string[]>): never {
  throw new ApiError('validation', message, { status: 422, fieldErrors: errors });
}

/* -------------------------------------------------------------------------- */
/* Projections                                                                */
/* -------------------------------------------------------------------------- */

function sermonPayload(sermon: (typeof demoSermons)[number], state: DemoState) {
  const progress = state.sermonProgress[sermon.id] ?? null;
  return {
    ...sermon,
    series: sermon.series ?? null,
    saved: state.savedSermonIds.includes(sermon.id),
    progress,
  };
}

function enrollmentPayload(courseId: string, state: DemoState) {
  const enrollment = state.enrollments[courseId];
  if (!enrollment) return null;
  const totalLessons = demoLessons.filter((lesson) => lesson.course_id === courseId).length;
  const completed = enrollment.completedLessonIds.length;
  return {
    id: enrollment.id,
    status: enrollment.status,
    completed_lessons: completed,
    total_lessons: totalLessons,
    percent_complete: totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100),
    enrolled_at: enrollment.enrolled_at,
  };
}

function coursePayload(course: (typeof demoCourses)[number], state: DemoState) {
  const lessons = demoLessons.filter((lesson) => lesson.course_id === course.id);
  return {
    id: course.id,
    program_id: course.program_id,
    title: course.title,
    summary: course.summary,
    artwork_url: course.artwork_url,
    instructors: course.instructors,
    starts_at: course.starts_at,
    ends_at: course.ends_at,
    lesson_count: lessons.length,
    enrollment_mode: course.enrollment_mode,
    my_enrollment: enrollmentPayload(course.id, state),
  };
}

function lessonSummaryPayload(
  lesson: (typeof demoLessons)[number],
  state: DemoState,
  enrolled: boolean
) {
  const completedIds = state.enrollments[lesson.course_id]?.completedLessonIds ?? [];
  return {
    id: lesson.id,
    module_id: lesson.module_id,
    title: lesson.title,
    position: lesson.position,
    kind: lesson.kind,
    duration_minutes: lesson.duration_minutes,
    completed: completedIds.includes(lesson.id),
    // Access control belongs to the server; the demo provider models the same rule.
    locked: !enrolled,
    lock_reason: enrolled ? null : 'Enrol in this course to open its lessons.',
  };
}

function announcementPayload(
  announcement: (typeof demoAnnouncements)[number],
  state: DemoState
) {
  return { ...announcement, read: state.readAnnouncementIds.includes(announcement.id) };
}

function groupPayload(group: (typeof demoGroups)[number], state: DemoState) {
  const status = state.groupMemberships[group.id] ?? 'none';
  const upcoming = demoEvents
    .filter((event) => new Date(event.starts_at).getTime() > Date.now())
    .slice(0, 2)
    .map((event) => ({ id: event.id, title: event.title, starts_at: event.starts_at }));

  return {
    ...group,
    membership: {
      status,
      can_request: status === 'none',
      can_leave: status === 'member',
    },
    // Group chat links are only returned to members, mirroring the API's rule.
    communication_url: status === 'member' ? group.communication_url : null,
    upcoming_activities: status === 'member' ? upcoming : [],
  };
}

function eventPayload(event: (typeof demoEvents)[number], state: DemoState) {
  const registration = state.eventRegistrations[event.id];
  return {
    ...event,
    registration: {
      ...event.registration,
      my_status: registration ?? event.registration.my_status,
      registered_count:
        event.registration.registered_count == null
          ? null
          : event.registration.registered_count + (registration === 'registered' ? 1 : 0),
    },
  };
}

function requireMember(state: DemoState) {
  const member = state.member ?? (getAuthToken() ? demoMember : null);
  if (!member) {
    throw new ApiError('unauthorized', 'Sign in to continue.', { status: 401 });
  }
  return member;
}

/* -------------------------------------------------------------------------- */
/* Ask the Sermon                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Function words and framing words that must not count as a transcript match —
 * otherwise "which team should I support" matches any segment containing "which".
 */
const STOP_WORDS = new Set([
  'about', 'after', 'again', 'all', 'also', 'and', 'any', 'are', 'ask', 'because', 'been',
  'being', 'both', 'but', 'can', 'could', 'did', 'does', 'doing', 'done', 'down', 'each',
  'even', 'ever', 'every', 'for', 'from', 'further', 'had', 'has', 'have', 'her', 'here',
  'hers', 'him', 'his', 'how', 'into', 'its', 'just', 'like', 'make', 'many', 'mean', 'means',
  'more', 'most', 'much', 'must', 'not', 'now', 'only', 'other', 'our', 'out', 'over', 'own',
  'pastor', 'preacher', 'said', 'same', 'says', 'sermon', 'she', 'should', 'some', 'such',
  'take', 'teaching', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'under', 'until', 'very', 'was', 'way', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you',
  'your',
]);

/**
 * Answers a question from the sermon transcript only.
 *
 * Matching is intentionally simple keyword overlap: this is a development stand-in
 * for the backend's retrieval step, and when nothing matches it says so rather
 * than inventing a reply the pastor never gave.
 */
function answerFromTranscript(sermonId: string, question: string) {
  const transcript = demoTranscripts[sermonId];
  const notes = demoStudyNotes[sermonId];
  if (!transcript) {
    throw new ApiError('unavailable', 'This sermon has no transcript to answer from.', {
      status: 503,
    });
  }

  const terms = question
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const scored = transcript.segments
    .map((segment) => {
      const haystack = segment.text.toLowerCase();
      const score = terms.reduce((total, term) => (haystack.includes(term) ? total + 1 : total), 0);
      return { segment, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (scored.length === 0) {
    return {
      content:
        'This sermon’s transcript does not cover that. You could ask the pastoral team directly, or try a question about what was actually said in the teaching.',
      citations: [],
      unanswered_reason: 'no_matching_passage',
    };
  }

  const citations = scored.map((entry) => ({
    quote: entry.segment.text,
    start_seconds: entry.segment.start_seconds,
    scripture_reference: null,
  }));

  const summarySentence = notes?.summary ?? '';
  return {
    content:
      `In this teaching, the relevant passage is quoted below. ${summarySentence}`.trim() +
      '\n\nThis answer is assembled from the sermon transcript and the study notes for it. It is not a new statement from the pastor.',
    citations,
    unanswered_reason: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

const routes: Route[] = [
  /* ------------------------------ auth ---------------------------------- */
  {
    method: 'POST',
    pattern: /^\/auth\/login$/,
    anonymous: true,
    handler: async ({ body }) => {
      const email = text(body.email).trim().toLowerCase();
      const password = text(body.password);
      if (!email.includes('@')) {
        validation('Check the details.', { email: ['Enter a valid email address.'] });
      }
      if (password.length < 8) {
        validation('Check the details.', {
          password: ['Your password must be at least 8 characters.'],
        });
      }
      // Fixed inputs so the failure paths are reachable from the sign-in screen.
      if (password === 'wrongpass') {
        throw new ApiError('unauthorized', 'Those details do not match our records.', {
          status: 401,
        });
      }
      if (email.startsWith('locked')) {
        throw new ApiError('forbidden', 'This account has been suspended. Contact the church office.', {
          status: 403,
        });
      }

      const member = { ...demoMember, email };
      await mutateDemoState((draft) => {
        draft.member = member;
      });
      return { token: `demo.${demoId('tok')}`, member, requires_verification: null };
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/register$/,
    anonymous: true,
    handler: async ({ body }) => {
      const name = text(body.name).trim();
      const email = text(body.email).trim().toLowerCase();
      const password = text(body.password);
      const errors: Record<string, string[]> = {};
      if (name.length < 2) errors.name = ['Enter your full name.'];
      if (!email.includes('@')) errors.email = ['Enter a valid email address.'];
      if (email === demoMember.email) errors.email = ['That email is already registered.'];
      if (password.length < 8) errors.password = ['Use at least 8 characters.'];
      if (password !== text(body.password_confirmation)) {
        errors.password_confirmation = ['The passwords do not match.'];
      }
      if (Object.keys(errors).length > 0) validation('Check the details.', errors);

      const member = {
        ...demoMember,
        id: demoId('me'),
        name,
        email,
        phone: text(body.phone) || null,
        email_verified: false,
        interests: [],
        joined_at: new Date().toISOString(),
      };
      await mutateDemoState((draft) => {
        draft.member = member;
      });
      // The backend sends a verification email here; demo mode cannot.
      return { token: `demo.${demoId('tok')}`, member, requires_verification: 'email' };
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/logout$/,
    handler: async () => {
      await mutateDemoState((draft) => {
        draft.member = null;
      });
      return { message: 'Signed out.' };
    },
  },
  {
    method: 'GET',
    pattern: /^\/auth\/me$/,
    handler: ({ state }) => requireMember(state),
  },
  {
    method: 'POST',
    pattern: /^\/auth\/forgot-password$/,
    anonymous: true,
    handler: ({ body }) => {
      if (!text(body.email).includes('@')) {
        validation('Check the details.', { email: ['Enter a valid email address.'] });
      }
      return {
        message:
          'If that address belongs to a member, a reset link is on its way. Demo mode does not send email.',
      };
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/reset-password$/,
    anonymous: true,
    handler: ({ body }) => {
      if (text(body.token).length < 4) {
        validation('Check the details.', { token: ['That reset code is not valid.'] });
      }
      if (text(body.password).length < 8) {
        validation('Check the details.', { password: ['Use at least 8 characters.'] });
      }
      return { message: 'Your password has been reset. Sign in with your new password.' };
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/verify$/,
    handler: async ({ body, state }) => {
      const code = text(body.code).trim();
      if (code !== '123456') {
        validation('That code is not right.', {
          code: ['Enter the 6-digit code we sent. In demo mode the code is 123456.'],
        });
      }
      const member = requireMember(state);
      const verified = { ...member, email_verified: true };
      await mutateDemoState((draft) => {
        draft.member = verified;
      });
      return verified;
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/verify\/resend$/,
    handler: () => ({ message: 'Demo mode cannot send email. Use the code 123456.' }),
  },
  {
    method: 'PUT',
    pattern: /^\/auth\/password$/,
    handler: ({ body }) => {
      if (text(body.current_password).length < 8) {
        validation('Check the details.', { current_password: ['That is not your current password.'] });
      }
      if (text(body.password).length < 8) {
        validation('Check the details.', { password: ['Use at least 8 characters.'] });
      }
      if (text(body.password) !== text(body.password_confirmation)) {
        validation('Check the details.', { password_confirmation: ['The passwords do not match.'] });
      }
      return { message: 'Password changed.' };
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/account$/,
    handler: () => ({
      message:
        'A deletion request has been recorded for review by the church office. Demo mode does not delete anything.',
    }),
  },

  /* ----------------------------- profile -------------------------------- */
  {
    method: 'GET',
    pattern: /^\/profile$/,
    handler: ({ state }) => requireMember(state),
  },
  {
    method: 'PATCH',
    pattern: /^\/profile$/,
    handler: async ({ body, state }) => {
      const member = requireMember(state);
      const name = body.name === undefined ? member.name : text(body.name).trim();
      if (name.length < 2) {
        validation('Check the details.', { name: ['Enter your full name.'] });
      }
      const next = {
        ...member,
        name,
        phone: body.phone === undefined ? member.phone : text(body.phone) || null,
        city: body.city === undefined ? member.city : text(body.city) || null,
        interests: Array.isArray(body.interests)
          ? (body.interests as unknown[]).filter((item): item is string => typeof item === 'string')
          : member.interests,
      };
      await mutateDemoState((draft) => {
        draft.member = next;
      });
      return next;
    },
  },
  { method: 'GET', pattern: /^\/profile\/interests$/, handler: () => ({ data: demoInterests }) },
  {
    method: 'POST',
    pattern: /^\/profile\/avatar$/,
    handler: ({ state }) => {
      requireMember(state);
      // There is nowhere to upload to, and the app must not pretend otherwise.
      throw new ApiError('unavailable', 'Demo mode cannot upload a profile picture.', {
        status: 503,
      });
    },
  },

  /* ------------------------------- home --------------------------------- */
  {
    method: 'GET',
    pattern: /^\/home$/,
    anonymous: true,
    handler: ({ state }) => {
      const signedIn = Boolean(state.member ?? getAuthToken());
      const upcoming = demoEvents
        .filter((event) => new Date(event.starts_at).getTime() > Date.now())
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
        .slice(0, 3)
        .map((event) => eventPayload(event, state));

      const continueLearning = signedIn
        ? Object.keys(state.enrollments)
            .map((courseId) => demoCourses.find((course) => course.id === courseId))
            .filter((course): course is (typeof demoCourses)[number] => Boolean(course))
            .map((course) => coursePayload(course, state))
        : [];

      const saved = signedIn
        ? state.savedSermonIds
            .map((id) => demoSermons.find((sermon) => sermon.id === id))
            .filter((sermon): sermon is (typeof demoSermons)[number] => Boolean(sermon))
            .map((sermon) => sermonPayload(sermon, state))
        : [];

      const nextLive = demoLiveSessions
        .filter((session) => new Date(session.starts_at).getTime() > Date.now())
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];

      return {
        member_first_name: signedIn ? (state.member ?? demoMember).name.split(' ')[0] : null,
        featured_sermon: sermonPayload(demoSermons[0]!, state),
        devotional: demoDevotionals[0],
        continue_learning: continueLearning,
        upcoming_events: upcoming,
        announcements: demoAnnouncements
          .slice(0, 3)
          .map((announcement) => announcementPayload(announcement, state)),
        live_session: nextLive ?? null,
        recently_saved: saved,
        unread_notifications: signedIn
          ? state.notifications.filter((notification) => !notification.read).length
          : 0,
        my_prayer_summary: signedIn
          ? {
              open_count: state.prayerRequests.filter((request) => request.status !== 'closed')
                .length,
              answered_count: state.prayerRequests.filter((request) => request.status === 'answered')
                .length,
            }
          : null,
      };
    },
  },
  {
    method: 'GET',
    pattern: /^\/devotionals\/today$/,
    anonymous: true,
    handler: () => demoDevotionals[0] ?? notFound('Today’s devotional'),
  },

  /* ------------------------------ sermons ------------------------------- */
  {
    method: 'GET',
    pattern: /^\/sermons$/,
    anonymous: true,
    handler: ({ query, state }) => {
      const search = text(query.search).toLowerCase();
      let items = demoSermons.filter((sermon) => {
        if (query.speaker && sermon.speaker.id !== query.speaker) return false;
        if (query.series && sermon.series?.id !== query.series) return false;
        if (query.topic && !sermon.topics.includes(text(query.topic))) return false;
        if (query.scripture) {
          const needle = text(query.scripture).toLowerCase();
          if (!sermon.scripture_references.some((ref) => ref.toLowerCase().includes(needle))) {
            return false;
          }
        }
        if (query.from && sermon.preached_at < text(query.from)) return false;
        if (query.to && sermon.preached_at > text(query.to)) return false;
        if (search) {
          const haystack = [
            sermon.title,
            sermon.summary,
            sermon.speaker.name,
            sermon.series?.title ?? '',
            ...sermon.topics,
            ...sermon.scripture_references,
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      });

      items = [...items].sort((a, b) =>
        query.sort === 'oldest'
          ? a.preached_at.localeCompare(b.preached_at)
          : b.preached_at.localeCompare(a.preached_at)
      );

      return paginate(
        items.map((sermon) => sermonPayload(sermon, state)),
        query
      );
    },
  },
  {
    method: 'GET',
    pattern: /^\/sermons\/filters$/,
    anonymous: true,
    handler: () => ({
      speakers: demoSpeakers.map((speaker) => ({
        id: speaker.id,
        name: speaker.name,
        count: demoSermons.filter((sermon) => sermon.speaker.id === speaker.id).length,
      })),
      series: [
        ...new Map(
          demoSermons
            .filter((sermon) => sermon.series)
            .map((sermon) => [
              sermon.series!.id,
              { id: sermon.series!.id, title: sermon.series!.title },
            ])
        ).values(),
      ].map((series) => ({
        ...series,
        count: demoSermons.filter((sermon) => sermon.series?.id === series.id).length,
      })),
      topics: [...new Set(demoSermons.flatMap((sermon) => sermon.topics))].map((topic) => ({
        value: topic,
        count: demoSermons.filter((sermon) => sermon.topics.includes(topic)).length,
      })),
    }),
  },
  {
    method: 'GET',
    pattern: /^\/sermons\/([^/]+)$/,
    anonymous: true,
    handler: ({ params, state }) => {
      const sermon = demoSermons.find((item) => item.id === params[0]);
      if (!sermon) notFound('This sermon');
      return sermonPayload(sermon, state);
    },
  },
  {
    method: 'GET',
    pattern: /^\/sermons\/([^/]+)\/transcript$/,
    anonymous: true,
    handler: ({ params }) => {
      const transcript = demoTranscripts[params[0]!];
      if (!transcript) notFound('A transcript for this sermon');
      return {
        sermon_id: params[0],
        language: 'en',
        source: 'machine',
        segments: transcript.segments,
      };
    },
  },
  {
    method: 'GET',
    pattern: /^\/sermons\/([^/]+)\/study-notes$/,
    anonymous: true,
    handler: ({ params }) => {
      const notes = demoStudyNotes[params[0]!];
      if (!notes) notFound('Study notes for this sermon');
      return { sermon_id: params[0], generated_at: new Date().toISOString(), ...notes };
    },
  },
  {
    method: 'GET',
    pattern: /^\/sermons\/([^/]+)\/related$/,
    anonymous: true,
    handler: ({ params, state }) => {
      const sermon = demoSermons.find((item) => item.id === params[0]);
      if (!sermon) notFound('This sermon');
      const related = demoSermons
        .filter(
          (candidate) =>
            candidate.id !== sermon.id &&
            (candidate.series?.id === sermon.series?.id ||
              candidate.topics.some((topic) => sermon.topics.includes(topic)))
        )
        .slice(0, 4);
      return { data: related.map((item) => sermonPayload(item, state)) };
    },
  },
  {
    method: 'POST',
    pattern: /^\/sermons\/([^/]+)\/save$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      const id = params[0]!;
      if (!demoSermons.some((sermon) => sermon.id === id)) notFound('This sermon');
      await mutateDemoState((draft) => {
        if (!draft.savedSermonIds.includes(id)) draft.savedSermonIds.unshift(id);
      });
      return { message: 'Saved.' };
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/sermons\/([^/]+)\/save$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      const id = params[0]!;
      await mutateDemoState((draft) => {
        draft.savedSermonIds = draft.savedSermonIds.filter((saved) => saved !== id);
      });
      return { message: 'Removed.' };
    },
  },
  {
    method: 'POST',
    pattern: /^\/sermons\/([^/]+)\/progress$/,
    handler: async ({ params, body, state }) => {
      requireMember(state);
      const id = params[0]!;
      const position = Math.max(0, number(body.position_seconds));
      const duration = body.duration_seconds == null ? null : number(body.duration_seconds);
      const completed = Boolean(body.completed);
      const record = {
        position_seconds: position,
        duration_seconds: duration,
        completed,
        updated_at: new Date().toISOString(),
      };
      await mutateDemoState((draft) => {
        draft.sermonProgress[id] = record;
      });
      return record;
    },
  },
  {
    method: 'GET',
    pattern: /^\/sermons\/([^/]+)\/ask$/,
    handler: ({ params, state }) => {
      requireMember(state);
      const sermonId = params[0]!;
      return {
        id: `ask-${sermonId}`,
        sermon_id: sermonId,
        messages: state.askConversations[sermonId] ?? [],
      };
    },
  },
  {
    method: 'POST',
    pattern: /^\/sermons\/([^/]+)\/ask$/,
    handler: async ({ params, body, state }) => {
      requireMember(state);
      const sermonId = params[0]!;
      const sermon = demoSermons.find((item) => item.id === sermonId);
      if (!sermon) notFound('This sermon');
      if (!sermon.ask_enabled) {
        throw new ApiError('unavailable', 'Questions are not enabled for this sermon yet.', {
          status: 503,
        });
      }

      const question = text(body.question).trim();
      if (question.length < 5) {
        validation('Ask a slightly longer question.', {
          question: ['Write at least a few words so the answer can be grounded in the sermon.'],
        });
      }
      // Reachable failure path for the unavailable-service state.
      if (question.toLowerCase().includes('break the service')) {
        throw new ApiError('unavailable', 'The study assistant is temporarily unavailable.', {
          status: 503,
        });
      }

      const answer = answerFromTranscript(sermonId, question);
      const timestamp = new Date().toISOString();
      const memberMessage = {
        id: demoId('msg'),
        role: 'member' as const,
        content: question,
        created_at: timestamp,
        citations: [],
        unanswered_reason: null,
      };
      const assistantMessage = {
        id: demoId('msg'),
        role: 'assistant' as const,
        content: answer.content,
        created_at: new Date(Date.now() + 1).toISOString(),
        citations: answer.citations,
        unanswered_reason: answer.unanswered_reason,
      };

      await mutateDemoState((draft) => {
        const existing = draft.askConversations[sermonId] ?? [];
        draft.askConversations[sermonId] = [...existing, memberMessage, assistantMessage];
      });

      return {
        id: `ask-${sermonId}`,
        sermon_id: sermonId,
        messages: [memberMessage, assistantMessage],
      };
    },
  },
  {
    method: 'GET',
    pattern: /^\/saved$/,
    handler: ({ state }) => {
      requireMember(state);
      return {
        sermons: state.savedSermonIds
          .map((id) => demoSermons.find((sermon) => sermon.id === id))
          .filter((sermon): sermon is (typeof demoSermons)[number] => Boolean(sermon))
          .map((sermon) => sermonPayload(sermon, state)),
      };
    },
  },

  /* ------------------------------ search -------------------------------- */
  {
    method: 'GET',
    pattern: /^\/search$/,
    anonymous: true,
    handler: ({ query, state }) => {
      const q = text(query.q).trim().toLowerCase();
      const types = text(query.types)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const wants = (type: string) => types.length === 0 || types.includes(type);

      if (q.length === 0) {
        return {
          query: '',
          results: [],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
          suggestions: ['Mercy', 'Prayer', 'Foundations of Faith', 'Membership class'],
        };
      }

      const results: unknown[] = [];

      if (wants('sermon')) {
        for (const sermon of demoSermons) {
          const haystack = [sermon.title, sermon.summary, sermon.speaker.name, ...sermon.topics]
            .join(' ')
            .toLowerCase();
          if (haystack.includes(q)) {
            results.push({ type: 'sermon', sermon: sermonPayload(sermon, state) });
          }
        }
      }
      if (wants('course')) {
        for (const course of demoCourses) {
          if (`${course.title} ${course.summary}`.toLowerCase().includes(q)) {
            results.push({ type: 'course', course: coursePayload(course, state) });
          }
        }
      }
      if (wants('event')) {
        for (const event of demoEvents) {
          if (`${event.title} ${event.description}`.toLowerCase().includes(q)) {
            results.push({ type: 'event', event: eventPayload(event, state) });
          }
        }
      }
      if (wants('announcement')) {
        for (const announcement of demoAnnouncements) {
          if (`${announcement.title} ${announcement.body}`.toLowerCase().includes(q)) {
            results.push({
              type: 'announcement',
              announcement: announcementPayload(announcement, state),
            });
          }
        }
      }
      if (wants('group')) {
        for (const group of demoGroups) {
          if (`${group.name} ${group.summary}`.toLowerCase().includes(q)) {
            results.push({ type: 'group', group: groupPayload(group, state) });
          }
        }
      }

      const page = paginate(results, query);
      return { query: text(query.q), results: page.data, meta: page.meta, suggestions: [] };
    },
  },
  {
    method: 'GET',
    pattern: /^\/search\/suggestions$/,
    anonymous: true,
    handler: ({ query }) => {
      const q = text(query.q).trim().toLowerCase();
      const pool = [
        ...demoSermons.map((sermon) => sermon.title),
        ...demoSermons.flatMap((sermon) => sermon.topics),
        ...demoCourses.map((course) => course.title),
        ...demoEvents.map((event) => event.title),
      ];
      const suggestions = [...new Set(pool)]
        .filter((item) => item.toLowerCase().includes(q))
        .slice(0, 6);
      return { data: q.length === 0 ? [] : suggestions };
    },
  },

  /* ----------------------------- learning ------------------------------- */
  {
    method: 'GET',
    pattern: /^\/programs$/,
    anonymous: true,
    handler: () => ({ data: demoPrograms }),
  },
  {
    method: 'GET',
    pattern: /^\/courses$/,
    anonymous: true,
    handler: ({ query, state }) => {
      let items = demoCourses;
      if (query.program) items = items.filter((course) => course.program_id === query.program);
      if (query.enrolled === 'true' || query.enrolled === true) {
        items = items.filter((course) => Boolean(state.enrollments[course.id]));
      }
      const search = text(query.search).toLowerCase();
      if (search) {
        items = items.filter((course) =>
          `${course.title} ${course.summary}`.toLowerCase().includes(search)
        );
      }
      return paginate(
        items.map((course) => coursePayload(course, state)),
        query
      );
    },
  },
  {
    method: 'GET',
    pattern: /^\/courses\/([^/]+)$/,
    anonymous: true,
    handler: ({ params, state }) => {
      const course = demoCourses.find((item) => item.id === params[0]);
      if (!course) notFound('This course');
      const enrollment = enrollmentPayload(course.id, state);
      const enrolled = enrollment?.status === 'active' || enrollment?.status === 'completed';

      const modules = demoModules
        .filter((module) => module.course_id === course.id)
        .map((module) => ({
          ...module,
          lessons: demoLessons
            .filter((lesson) => lesson.module_id === module.id)
            .sort((a, b) => a.position - b.position)
            .map((lesson) => lessonSummaryPayload(lesson, state, enrolled)),
        }));

      const completedIds = state.enrollments[course.id]?.completedLessonIds ?? [];
      const resume = demoLessons
        .filter((lesson) => lesson.course_id === course.id)
        .sort((a, b) => a.position - b.position)
        .find((lesson) => !completedIds.includes(lesson.id));

      return {
        ...coursePayload(course, state),
        description: course.description,
        requirements: course.requirements,
        cohort: course.cohort,
        modules,
        // Materials are only returned once the server has authorised access.
        materials: enrolled ? demoMaterials.filter((item) => item.course_id === course.id) : [],
        communication: enrolled
          ? {
              whatsapp_group_url: course.whatsapp_group_url,
              whatsapp_group_name: course.whatsapp_group_name,
              announcements_count: demoAnnouncements.filter(
                (announcement) => announcement.scope.type === 'course'
              ).length,
            }
          : null,
        certificate: null,
        resume_lesson_id: enrolled ? (resume?.id ?? null) : null,
      };
    },
  },
  {
    method: 'POST',
    pattern: /^\/courses\/([^/]+)\/enroll$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      const course = demoCourses.find((item) => item.id === params[0]);
      if (!course) notFound('This course');

      if (state.enrollments[course.id]) {
        throw new ApiError('conflict', 'You are already enrolled in this course.', { status: 409 });
      }
      if (course.enrollment_mode === 'closed') {
        throw new ApiError('forbidden', 'Enrolment for this course is closed.', { status: 403 });
      }
      if (course.enrollment_mode === 'code_required') {
        throw new ApiError('forbidden', 'This course needs an access code from the church.', {
          status: 403,
          code: 'access_code_required',
        });
      }
      if (course.enrollment_mode === 'invite_only') {
        throw new ApiError('forbidden', 'This course is by invitation only.', { status: 403 });
      }

      const enrollment = {
        id: demoId('en'),
        status: 'active' as const,
        completedLessonIds: [] as string[],
        enrolled_at: new Date().toISOString(),
      };
      await mutateDemoState((draft) => {
        draft.enrollments[course.id] = enrollment;
      });
      const payload = enrollmentPayload(course.id, await getDemoState());
      return {
        enrollment: { ...payload, course_id: course.id },
        message: 'You are enrolled.',
      };
    },
  },
  {
    method: 'POST',
    pattern: /^\/enrollments\/activate$/,
    handler: async ({ body, state }) => {
      requireMember(state);
      const code = text(body.code).trim().toUpperCase();
      if (code.length === 0) {
        validation('Enter your access code.', { code: ['Enter the code you were given.'] });
      }

      // Server-side validation and consumption. The app never decides this.
      const record = demoAccessCodes[code];
      if (!record) {
        throw new ApiError('validation', 'That access code is not recognised.', {
          status: 422,
          code: 'access_code_invalid',
          fieldErrors: { code: ['That access code is not recognised.'] },
        });
      }
      if (record.state === 'expired') {
        throw new ApiError('validation', 'That access code has expired.', {
          status: 422,
          code: 'access_code_expired',
          fieldErrors: { code: ['That access code has expired. Ask for a new one.'] },
        });
      }
      if (record.state === 'ineligible') {
        throw new ApiError('forbidden', 'That code is for a course you are not eligible for yet.', {
          status: 403,
          code: 'access_code_ineligible',
        });
      }
      if (record.state === 'used' || state.consumedAccessCodes.includes(code)) {
        throw new ApiError('conflict', 'That access code has already been used.', {
          status: 409,
          code: 'access_code_used',
        });
      }

      const course = demoCourses.find((item) => item.id === record.course_id);
      if (!course) notFound('The course for this code');

      const enrollment = {
        id: demoId('en'),
        status: 'active' as const,
        completedLessonIds: [] as string[],
        enrolled_at: new Date().toISOString(),
      };
      await mutateDemoState((draft) => {
        draft.consumedAccessCodes.push(code);
        draft.enrollments[course.id] = enrollment;
      });

      const payload = enrollmentPayload(course.id, await getDemoState());
      return {
        enrollment: { ...payload, course_id: course.id },
        message: `Access granted to ${course.title}.`,
      };
    },
  },
  {
    method: 'GET',
    pattern: /^\/enrollments$/,
    handler: ({ state }) => {
      requireMember(state);
      const courses = Object.keys(state.enrollments)
        .map((courseId) => demoCourses.find((course) => course.id === courseId))
        .filter((course): course is (typeof demoCourses)[number] => Boolean(course));
      return paginate(
        courses.map((course) => coursePayload(course, state)),
        {}
      );
    },
  },
  {
    method: 'GET',
    pattern: /^\/lessons\/([^/]+)$/,
    handler: ({ params, state }) => {
      requireMember(state);
      const lesson = demoLessons.find((item) => item.id === params[0]);
      if (!lesson) notFound('This lesson');

      const enrollment = state.enrollments[lesson.course_id];
      if (!enrollment) {
        throw new ApiError('forbidden', 'Enrol in this course to open its lessons.', {
          status: 403,
          code: 'not_enrolled',
        });
      }

      const siblings = demoLessons
        .filter((item) => item.course_id === lesson.course_id)
        .sort((a, b) => a.position - b.position);
      const index = siblings.findIndex((item) => item.id === lesson.id);

      return {
        ...lessonSummaryPayload(lesson, state, true),
        course_id: lesson.course_id,
        body: lesson.body ?? null,
        media: lesson.media ?? null,
        materials: demoMaterials.filter((item) => item.course_id === lesson.course_id),
        quiz_id: lesson.quiz_id ?? null,
        assignment: null,
        next_lesson_id: siblings[index + 1]?.id ?? null,
        previous_lesson_id: siblings[index - 1]?.id ?? null,
      };
    },
  },
  {
    method: 'POST',
    pattern: /^\/lessons\/([^/]+)\/complete$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      const lesson = demoLessons.find((item) => item.id === params[0]);
      if (!lesson) notFound('This lesson');
      if (!state.enrollments[lesson.course_id]) {
        throw new ApiError('forbidden', 'Enrol in this course first.', {
          status: 403,
          code: 'not_enrolled',
        });
      }

      await mutateDemoState((draft) => {
        const enrollment = draft.enrollments[lesson.course_id]!;
        if (!enrollment.completedLessonIds.includes(lesson.id)) {
          enrollment.completedLessonIds.push(lesson.id);
        }
        const total = demoLessons.filter((item) => item.course_id === lesson.course_id).length;
        if (enrollment.completedLessonIds.length >= total) enrollment.status = 'completed';
      });

      const enrollment = enrollmentPayload(lesson.course_id, await getDemoState())!;
      return {
        lesson_id: lesson.id,
        completed: true,
        enrollment,
        // Certificates are issued by the server only, never by the client.
        certificate_issued: enrollment.status === 'completed',
      };
    },
  },
  {
    method: 'GET',
    pattern: /^\/quizzes\/([^/]+)$/,
    handler: ({ params, state }) => {
      requireMember(state);
      const quiz = demoQuizzes.find((item) => item.id === params[0]);
      if (!quiz) notFound('This quiz');
      return {
        id: quiz.id,
        lesson_id: quiz.lesson_id,
        title: quiz.title,
        instructions: quiz.instructions,
        passing_score: quiz.passing_score,
        attempts_allowed: quiz.attempts_allowed,
        attempts_used: state.quizAttempts[quiz.id] ?? 0,
        // Correct answers are never sent to the device.
        questions: quiz.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          kind: question.kind,
          options: question.options,
        })),
      };
    },
  },
  {
    method: 'POST',
    pattern: /^\/quizzes\/([^/]+)\/attempts$/,
    handler: async ({ params, body, state }) => {
      requireMember(state);
      const quiz = demoQuizzes.find((item) => item.id === params[0]);
      if (!quiz) notFound('This quiz');

      const used = state.quizAttempts[quiz.id] ?? 0;
      if (quiz.attempts_allowed != null && used >= quiz.attempts_allowed) {
        throw new ApiError('forbidden', 'You have used all your attempts for this quiz.', {
          status: 403,
          code: 'quiz_attempts_exhausted',
        });
      }

      const answers = (body.answers ?? {}) as Record<string, unknown>;
      let correctCount = 0;
      const feedback = quiz.questions.map((question) => {
        const given = answers[question.id];
        const selected = Array.isArray(given)
          ? given.filter((value): value is string => typeof value === 'string')
          : typeof given === 'string'
            ? [given]
            : [];
        const correct =
          selected.length === question.correct.length &&
          selected.every((option) => question.correct.includes(option));
        if (correct) correctCount += 1;
        return {
          question_id: question.id,
          correct,
          explanation: question.explanation ?? null,
        };
      });

      const score = Math.round((correctCount / quiz.questions.length) * 100);
      await mutateDemoState((draft) => {
        draft.quizAttempts[quiz.id] = used + 1;
      });

      return {
        attempt_id: demoId('qa'),
        score,
        passed: score >= quiz.passing_score,
        correct_count: correctCount,
        total_count: quiz.questions.length,
        feedback,
      };
    },
  },
  {
    method: 'GET',
    pattern: /^\/courses\/([^/]+)\/sessions$/,
    handler: ({ params, state }) => {
      requireMember(state);
      return {
        data: demoLiveSessions
          .filter((session) => session.course_id === params[0])
          .sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
      };
    },
  },
  {
    method: 'GET',
    pattern: /^\/certificates$/,
    handler: ({ state }) => {
      requireMember(state);
      // Only the server issues certificates; demo mode has none to show.
      return { data: [] };
    },
  },

  /* ------------------------------ events -------------------------------- */
  {
    method: 'GET',
    pattern: /^\/events$/,
    anonymous: true,
    handler: ({ query, state }) => {
      const scope = text(query.scope) || 'upcoming';
      const nowMs = Date.now();
      let items = demoEvents.filter((event) => {
        const starts = new Date(event.starts_at).getTime();
        return scope === 'past' ? starts < nowMs : starts >= nowMs;
      });
      items = [...items].sort((a, b) =>
        scope === 'past'
          ? b.starts_at.localeCompare(a.starts_at)
          : a.starts_at.localeCompare(b.starts_at)
      );
      return paginate(
        items.map((event) => eventPayload(event, state)),
        query
      );
    },
  },
  {
    method: 'GET',
    pattern: /^\/events\/([^/]+)$/,
    anonymous: true,
    handler: ({ params, state }) => {
      const event = demoEvents.find((item) => item.id === params[0]);
      if (!event) notFound('This event');
      return eventPayload(event, state);
    },
  },
  {
    method: 'POST',
    pattern: /^\/events\/([^/]+)\/registration$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      const event = demoEvents.find((item) => item.id === params[0]);
      if (!event) notFound('This event');

      if (new Date(event.starts_at).getTime() < Date.now()) {
        throw new ApiError('conflict', 'This event has already taken place.', { status: 409 });
      }
      if (!event.registration.open) {
        throw new ApiError('forbidden', 'Registration for this event is closed.', { status: 403 });
      }
      if (state.eventRegistrations[event.id] === 'registered') {
        throw new ApiError('conflict', 'You are already registered for this event.', {
          status: 409,
        });
      }

      const full =
        event.registration.capacity != null &&
        (event.registration.registered_count ?? 0) >= event.registration.capacity;
      const status = full ? ('waitlisted' as const) : ('registered' as const);

      await mutateDemoState((draft) => {
        draft.eventRegistrations[event.id] = status;
      });
      return eventPayload(event, await getDemoState());
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/events\/([^/]+)\/registration$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      const event = demoEvents.find((item) => item.id === params[0]);
      if (!event) notFound('This event');
      await mutateDemoState((draft) => {
        delete draft.eventRegistrations[event.id];
      });
      return eventPayload(event, await getDemoState());
    },
  },

  /* ------------------------------ prayer -------------------------------- */
  {
    method: 'GET',
    pattern: /^\/prayer-requests$/,
    handler: ({ state }) => {
      requireMember(state);
      // Only the member's own requests are ever returned here.
      return {
        data: state.prayerRequests.map((request) => ({ ...request, can_withdraw: true })),
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 50,
          total: state.prayerRequests.length,
        },
      };
    },
  },
  {
    method: 'POST',
    pattern: /^\/prayer-requests$/,
    handler: async ({ body, state }) => {
      requireMember(state);
      const content = text(body.body).trim();
      if (content.length < 5) {
        validation('Write a little more.', {
          body: ['Tell us what to pray for, in a sentence or two.'],
        });
      }
      const visibility = text(body.visibility);
      const allowed = ['pastoral_team', 'prayer_team', 'prayer_community'];
      if (!allowed.includes(visibility)) {
        validation('Choose who can see this.', { visibility: ['Choose who may see this request.'] });
      }

      const record = {
        id: demoId('pr'),
        body: content,
        visibility: visibility as 'pastoral_team' | 'prayer_team' | 'prayer_community',
        status: 'submitted' as const,
        created_at: new Date().toISOString(),
        is_anonymous: Boolean(body.is_anonymous),
        follow_ups: [],
      };
      await mutateDemoState((draft) => {
        draft.prayerRequests.unshift(record);
      });
      return { ...record, can_withdraw: true };
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/prayer-requests\/([^/]+)$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      const exists = state.prayerRequests.some((request) => request.id === params[0]);
      if (!exists) notFound('This prayer request');
      await mutateDemoState((draft) => {
        draft.prayerRequests = draft.prayerRequests.filter((request) => request.id !== params[0]);
      });
      return { message: 'Your request has been withdrawn.' };
    },
  },
  {
    method: 'POST',
    pattern: /^\/prayer-requests\/([^/]+)\/follow-ups$/,
    handler: async ({ params, body, state }) => {
      requireMember(state);
      const content = text(body.body).trim();
      if (content.length < 3) {
        validation('Write a little more.', { body: ['Add a short update.'] });
      }
      const request = state.prayerRequests.find((item) => item.id === params[0]);
      if (!request) notFound('This prayer request');

      const followUp = { id: demoId('fu'), body: content, created_at: new Date().toISOString() };
      await mutateDemoState((draft) => {
        const target = draft.prayerRequests.find((item) => item.id === params[0]);
        target?.follow_ups.push(followUp);
      });
      return { ...request, follow_ups: [...request.follow_ups, followUp], can_withdraw: true };
    },
  },
  {
    method: 'GET',
    pattern: /^\/pastoral-care$/,
    anonymous: true,
    handler: () => demoPastoralCare,
  },

  /* ---------------------------- community ------------------------------- */
  {
    method: 'GET',
    pattern: /^\/groups$/,
    anonymous: true,
    handler: ({ query, state }) => {
      let items = demoGroups;
      if (query.type) items = items.filter((group) => group.type === query.type);
      const search = text(query.search).toLowerCase();
      if (search) {
        items = items.filter((group) => `${group.name} ${group.summary}`.toLowerCase().includes(search));
      }
      return paginate(
        items.map((group) => groupPayload(group, state)),
        query
      );
    },
  },
  {
    method: 'GET',
    pattern: /^\/groups\/([^/]+)$/,
    anonymous: true,
    handler: ({ params, state }) => {
      const group = demoGroups.find((item) => item.id === params[0]);
      if (!group) notFound('This group');
      return groupPayload(group, state);
    },
  },
  {
    method: 'POST',
    pattern: /^\/groups\/([^/]+)\/membership$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      const group = demoGroups.find((item) => item.id === params[0]);
      if (!group) notFound('This group');
      const current = state.groupMemberships[group.id] ?? 'none';
      if (current !== 'none') {
        throw new ApiError('conflict', 'You have already asked to join this group.', {
          status: 409,
        });
      }
      await mutateDemoState((draft) => {
        // Requests are approved by a group leader, so this is pending, not member.
        draft.groupMemberships[group.id] = 'pending';
      });
      return groupPayload(group, await getDemoState());
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/groups\/([^/]+)\/membership$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      const group = demoGroups.find((item) => item.id === params[0]);
      if (!group) notFound('This group');
      await mutateDemoState((draft) => {
        delete draft.groupMemberships[group.id];
      });
      return groupPayload(group, await getDemoState());
    },
  },

  /* ------------------------------ giving -------------------------------- */
  {
    method: 'GET',
    pattern: /^\/giving\/categories$/,
    anonymous: true,
    handler: () => ({ data: demoGivingCategories }),
  },
  {
    method: 'POST',
    pattern: /^\/giving\/intents$/,
    handler: async ({ body, options, state }) => {
      requireMember(state);
      const category = demoGivingCategories.find((item) => item.id === text(body.category_id));
      if (!category) {
        validation('Choose a giving category.', { category_id: ['Choose what this gift is for.'] });
      }
      const amount = Math.round(number(body.amount_minor));
      if (amount <= 0) {
        validation('Enter an amount.', { amount_minor: ['Enter how much you would like to give.'] });
      }
      if (amount < category.minimum_amount) {
        validation('That amount is below the minimum.', {
          amount_minor: [
            `The minimum for ${category.name} is ${(category.minimum_amount / 100).toFixed(2)}.`,
          ],
        });
      }
      const recurrence = text(body.recurrence) === 'monthly' ? ('monthly' as const) : ('one_time' as const);
      if (recurrence === 'monthly' && !category.recurring_supported) {
        validation('Monthly giving is not available for this category.', {
          recurrence: ['This category does not support monthly giving.'],
        });
      }

      // Idempotency: a retried submission returns the original intent.
      const key = options.idempotencyKey ?? null;
      if (key) {
        const existing = state.giving.find((intent) => intent.idempotency_key === key);
        if (existing) return toGivingIntent(existing);
      }

      const record = {
        reference: `DEMO-${demoId('gv').toUpperCase()}`,
        // No money moves in demo mode, and the app never claims otherwise.
        status: 'demo_not_processed' as const,
        amount_minor: amount,
        currency: 'NGN',
        category_id: category.id,
        category_name: category.name,
        recurrence,
        created_at: new Date().toISOString(),
        idempotency_key: key,
      };
      await mutateDemoState((draft) => {
        draft.giving.unshift(record);
      });
      return toGivingIntent(record);
    },
  },
  {
    method: 'GET',
    pattern: /^\/giving\/intents\/([^/]+)$/,
    handler: ({ params, state }) => {
      requireMember(state);
      const intent = state.giving.find((item) => item.reference === params[0]);
      if (!intent) notFound('This gift');
      return toGivingIntent(intent);
    },
  },
  {
    method: 'GET',
    pattern: /^\/giving\/transactions$/,
    handler: ({ query, state }) => {
      requireMember(state);
      // Demo mode shows only what was created in this demo session — never a
      // fabricated giving history.
      return paginate(
        state.giving.map((intent) => ({
          id: intent.reference,
          reference: intent.reference,
          amount_minor: intent.amount_minor,
          currency: intent.currency,
          category_name: intent.category_name,
          status: intent.status,
          created_at: intent.created_at,
          receipt_url: null,
          recurrence: intent.recurrence,
        })),
        query
      );
    },
  },

  /* -------------------------- announcements ----------------------------- */
  {
    method: 'GET',
    pattern: /^\/announcements$/,
    anonymous: true,
    handler: ({ query, state }) => {
      let items = demoAnnouncements.map((announcement) => announcementPayload(announcement, state));
      if (query.scope) items = items.filter((item) => item.scope.type === query.scope);
      if (query.unread === 'true') items = items.filter((item) => !item.read);
      items = [...items].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.published_at.localeCompare(a.published_at);
      });
      return paginate(items, query);
    },
  },
  {
    method: 'GET',
    pattern: /^\/announcements\/([^/]+)$/,
    anonymous: true,
    handler: ({ params, state }) => {
      const announcement = demoAnnouncements.find((item) => item.id === params[0]);
      if (!announcement) notFound('This announcement');
      return announcementPayload(announcement, state);
    },
  },
  {
    method: 'POST',
    pattern: /^\/announcements\/([^/]+)\/read$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      await mutateDemoState((draft) => {
        if (!draft.readAnnouncementIds.includes(params[0]!)) {
          draft.readAnnouncementIds.push(params[0]!);
        }
      });
      return { message: 'Marked as read.' };
    },
  },

  /* --------------------------- notifications ---------------------------- */
  {
    method: 'GET',
    pattern: /^\/notifications$/,
    handler: ({ query, state }) => {
      requireMember(state);
      const items = [...state.notifications].sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      );
      return paginate(items, query);
    },
  },
  {
    method: 'POST',
    pattern: /^\/notifications\/read-all$/,
    handler: async ({ state }) => {
      requireMember(state);
      await mutateDemoState((draft) => {
        draft.notifications = draft.notifications.map((item) => ({ ...item, read: true }));
      });
      return { message: 'All caught up.' };
    },
  },
  {
    method: 'POST',
    pattern: /^\/notifications\/([^/]+)\/read$/,
    handler: async ({ params, state }) => {
      requireMember(state);
      await mutateDemoState((draft) => {
        const target = draft.notifications.find((item) => item.id === params[0]);
        if (target) target.read = true;
      });
      return { message: 'Marked as read.' };
    },
  },
  {
    method: 'GET',
    pattern: /^\/notifications\/preferences$/,
    handler: ({ state }) => {
      requireMember(state);
      return state.notificationPreferences;
    },
  },
  {
    method: 'PUT',
    pattern: /^\/notifications\/preferences$/,
    handler: async ({ body, state }) => {
      requireMember(state);
      const keys = [
        'announcements',
        'events',
        'courses',
        'prayer',
        'giving',
        'new_sermons',
      ] as const;
      const next = { ...state.notificationPreferences };
      for (const key of keys) {
        if (typeof body[key] === 'boolean') next[key] = body[key] as boolean;
      }
      await mutateDemoState((draft) => {
        draft.notificationPreferences = next;
      });
      return next;
    },
  },
  {
    method: 'POST',
    pattern: /^\/devices$/,
    handler: ({ state }) => {
      requireMember(state);
      // A real backend stores the token against the member for push delivery.
      return { message: 'Demo mode does not register push tokens.' };
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/devices\/([^/]+)$/,
    handler: () => ({ message: 'Demo mode does not register push tokens.' }),
  },
];

function toGivingIntent(record: {
  reference: string;
  status: 'demo_not_processed';
  amount_minor: number;
  currency: string;
  category_id: string;
  category_name: string;
  recurrence: 'one_time' | 'monthly';
  created_at: string;
}) {
  return {
    reference: record.reference,
    status: record.status,
    amount_minor: record.amount_minor,
    currency: record.currency,
    category_id: record.category_id,
    category_name: record.category_name,
    recurrence: record.recurrence,
    // No checkout page, because there is no payment to make.
    checkout_url: null,
    created_at: record.created_at,
    receipt_url: null,
    failure_reason: null,
    provider: 'demo',
  };
}

export function createDemoTransport(): Transport {
  return {
    mode: 'demo',

    async request(path, options: RequestOptions = {}) {
      const method = options.method ?? 'GET';
      const [pathname] = path.split('?');
      const normalised = pathname!.startsWith('/') ? pathname! : `/${pathname!}`;

      await wait(options.signal);

      const route = routes.find(
        (candidate) => candidate.method === method && candidate.pattern.test(normalised)
      );
      if (!route) {
        throw new ApiError(
          'not_found',
          `The development data provider has no handler for ${method} ${normalised}.`,
          { status: 404 }
        );
      }

      if (!route.anonymous && !options.allowAnonymous && !getAuthToken()) {
        throw new ApiError('unauthorized', 'Sign in to continue.', { status: 401 });
      }

      const match = route.pattern.exec(normalised)!;
      const state = await getDemoState();

      return route.handler({
        params: match.slice(1),
        query: options.query ?? {},
        body: (options.body ?? {}) as Body,
        options,
        state,
      });
    },
  };
}
