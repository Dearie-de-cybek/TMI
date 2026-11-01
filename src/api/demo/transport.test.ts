import { z } from 'zod';

import { apiGet } from '@/api/client';
import { ApiError } from '@/api/errors';
import { setAuthToken } from '@/api/session';
import { signIn } from '@/features/auth/api';
import { cancelEventRegistration, fetchEvents, registerForEvent } from '@/features/events/api';
import { createGivingIntent, fetchGivingCategories, fetchTransactions } from '@/features/giving/api';
import {
  activateAccessCode,
  completeLesson,
  enrollInCourse,
  fetchCourse,
  fetchLesson,
  fetchQuiz,
  submitQuizAttempt,
} from '@/features/learning/api';
import { fetchMyPrayerRequests, submitPrayerRequest } from '@/features/prayer/api';
import { search } from '@/features/search/api';
import {
  askSermon,
  fetchSavedContent,
  fetchSermon,
  fetchSermons,
  fetchTranscript,
  saveSermon,
} from '@/features/sermons/api';
import { resetDemoState } from './state';

/**
 * Integration tests over the development data provider.
 *
 * They exercise the journeys the brief calls out, through the same typed client
 * and schema validation the screens use - so a demo payload that drifts from the
 * API contract fails here rather than in the UI.
 */
jest.setTimeout(20_000);

async function signInAsMember() {
  const session = await signIn({ email: 'member@demo.twainman', password: 'password123' });
  setAuthToken(session.token);
  return session;
}

beforeEach(async () => {
  setAuthToken(null);
  await resetDemoState();
});

describe('authentication', () => {
  it('signs a member in and returns a token plus their record', async () => {
    const session = await signInAsMember();
    expect(session.token).toMatch(/^demo\./);
    expect(session.member.email).toBe('member@demo.twainman');
  });

  it('rejects bad credentials with 401 rather than a generic failure', async () => {
    await expect(
      signIn({ email: 'member@demo.twainman', password: 'wrongpass' })
    ).rejects.toMatchObject({ kind: 'unauthorized' });
  });

  it('reports a suspended account as forbidden', async () => {
    await expect(signIn({ email: 'locked@demo.test', password: 'password123' })).rejects.toMatchObject(
      { kind: 'forbidden' }
    );
  });

  it('validates the email before calling the server', async () => {
    await expect(signIn({ email: 'nope', password: 'password123' })).rejects.toMatchObject({
      kind: 'validation',
    });
  });
});

describe('sermons', () => {
  it('lists sermons and filters by speaker across the whole library', async () => {
    const all = await fetchSermons({});
    expect(all.data.length).toBeGreaterThan(0);
    expect(all.meta.total).toBe(all.data.length);

    const bySpeaker = await fetchSermons({ speaker: 'sp-1' });
    expect(bySpeaker.data.length).toBeGreaterThan(0);
    expect(bySpeaker.data.every((sermon) => sermon.speaker.id === 'sp-1')).toBe(true);
  });

  it('searches by topic and returns nothing for a term with no matches', async () => {
    const matches = await fetchSermons({ search: 'mercy' });
    expect(matches.data.length).toBeGreaterThan(0);

    const none = await fetchSermons({ search: 'zzzzznothing' });
    expect(none.data).toHaveLength(0);
    expect(none.meta.total).toBe(0);
  });

  it('exposes a sermon with no media at all, so the UI cannot assume both', async () => {
    const sermon = await fetchSermon('sm-5');
    expect(sermon.audio ?? null).toBeNull();
    expect(sermon.video ?? null).toBeNull();
  });

  it('serves a transcript where one exists and 404s where it does not', async () => {
    const transcript = await fetchTranscript('sm-1');
    expect(transcript.segments.length).toBeGreaterThan(0);

    await expect(fetchTranscript('sm-5')).rejects.toMatchObject({ kind: 'not_found' });
  });

  it('requires a signed-in member to save, and then lists it as saved', async () => {
    await expect(saveSermon('sm-3')).rejects.toMatchObject({ kind: 'unauthorized' });

    await signInAsMember();
    await saveSermon('sm-3');

    const saved = await fetchSavedContent();
    expect(saved.sermons.map((sermon) => sermon.id)).toContain('sm-3');

    const sermon = await fetchSermon('sm-3');
    expect(sermon.saved).toBe(true);
  });
});

describe('ask the sermon', () => {
  it('answers from the transcript and cites the passage it used', async () => {
    await signInAsMember();
    const conversation = await askSermon({
      sermonId: 'sm-1',
      question: 'What did it say about the Samaritan?',
    });

    const answer = conversation.messages.find((message) => message.role === 'assistant');
    expect(answer).toBeDefined();
    expect(answer!.citations.length).toBeGreaterThan(0);
    expect(answer!.unanswered_reason ?? null).toBeNull();
  });

  it('says plainly when the sermon material does not cover the question', async () => {
    await signInAsMember();
    const conversation = await askSermon({
      sermonId: 'sm-1',
      question: 'Which football team should I support?',
    });

    const answer = conversation.messages.find((message) => message.role === 'assistant');
    expect(answer!.unanswered_reason).toBe('no_matching_passage');
    expect(answer!.citations).toHaveLength(0);
  });

  it('refuses when questions are not enabled for that sermon', async () => {
    await signInAsMember();
    await expect(
      askSermon({ sermonId: 'sm-3', question: 'What was the main point of this teaching?' })
    ).rejects.toMatchObject({ kind: 'unavailable' });
  });
});

describe('course access codes', () => {
  beforeEach(async () => {
    await signInAsMember();
  });

  it('grants access for a valid code and records the enrolment server-side', async () => {
    const result = await activateAccessCode('kh-lead-2026');
    expect(result.enrollment.course_id).toBe('co-2');
    expect(result.enrollment.status).toBe('active');

    const course = await fetchCourse('co-2');
    expect(course.my_enrollment).not.toBeNull();
  });

  it('rejects an unknown code', async () => {
    await expect(activateAccessCode('KH-NOPE-0000')).rejects.toMatchObject({
      kind: 'validation',
      code: 'access_code_invalid',
    });
  });

  it('rejects an expired code', async () => {
    await expect(activateAccessCode('KH-LEAD-OLD1')).rejects.toMatchObject({
      code: 'access_code_expired',
    });
  });

  it('rejects a code that has already been used', async () => {
    await expect(activateAccessCode('KH-LEAD-USED')).rejects.toMatchObject({
      kind: 'conflict',
      code: 'access_code_used',
    });
  });

  it('rejects a code the member is not eligible for', async () => {
    await expect(activateAccessCode('KH-FOUND-123')).rejects.toMatchObject({
      kind: 'forbidden',
      code: 'access_code_ineligible',
    });
  });

  it('does not let a code be redeemed twice', async () => {
    await activateAccessCode('KH-LEAD-2026');
    await expect(activateAccessCode('KH-LEAD-2026')).rejects.toMatchObject({
      kind: 'conflict',
    });
  });
});

describe('enrolment and lesson progress', () => {
  beforeEach(async () => {
    await signInAsMember();
  });

  it('locks lesson content until the server has an enrolment', async () => {
    await expect(fetchLesson('ls-6')).rejects.toMatchObject({
      kind: 'forbidden',
      code: 'not_enrolled',
    });

    const course = await fetchCourse('co-2');
    expect(course.modules[0]?.lessons[0]?.locked).toBe(true);
    // Materials are withheld too, not merely hidden in the UI.
    expect(course.materials).toHaveLength(0);
  });

  it('refuses to enrol in a course that requires a code', async () => {
    await expect(enrollInCourse('co-2')).rejects.toMatchObject({
      kind: 'forbidden',
      code: 'access_code_required',
    });
  });

  it('refuses to enrol in a closed course', async () => {
    await expect(enrollInCourse('co-3')).rejects.toMatchObject({ kind: 'forbidden' });
  });

  it('reports progress from the server after completing a lesson', async () => {
    const before = await fetchCourse('co-1');
    const startedAt = before.my_enrollment!.completed_lessons;

    const progress = await completeLesson('ls-4');
    expect(progress.completed).toBe(true);
    expect(progress.enrollment.completed_lessons).toBe(startedAt + 1);
    expect(progress.enrollment.percent_complete).toBeGreaterThan(0);

    const after = await fetchCourse('co-1');
    expect(after.my_enrollment!.completed_lessons).toBe(progress.enrollment.completed_lessons);
  });

  it('does not double-count a lesson completed twice', async () => {
    const first = await completeLesson('ls-4');
    const second = await completeLesson('ls-4');
    expect(second.enrollment.completed_lessons).toBe(first.enrollment.completed_lessons);
  });

  it('marks the enrolment complete only once every lesson is done', async () => {
    for (const lesson of ['ls-1', 'ls-2', 'ls-3', 'ls-4', 'ls-5']) {
      await completeLesson(lesson);
    }
    const course = await fetchCourse('co-1');
    expect(course.my_enrollment!.status).toBe('completed');
    expect(course.my_enrollment!.percent_complete).toBe(100);
  });
});

describe('quizzes', () => {
  beforeEach(async () => {
    await signInAsMember();
  });

  it('never sends the correct answers to the device', async () => {
    const quiz = await fetchQuiz('qz-1');
    const serialised = JSON.stringify(quiz);
    expect(serialised).not.toContain('correct');
  });

  it('marks an attempt on the server and returns the score', async () => {
    const perfect = await submitQuizAttempt({
      quizId: 'qz-1',
      answers: { 'qq-1': ['qo-2'], 'qq-2': ['qo-4', 'qo-6'], 'qq-3': ['qo-8'] },
    });
    expect(perfect.score).toBe(100);
    expect(perfect.passed).toBe(true);
    expect(perfect.correct_count).toBe(3);
  });

  it('fails an attempt below the pass mark', async () => {
    const poor = await submitQuizAttempt({
      quizId: 'qz-1',
      answers: { 'qq-1': ['qo-1'], 'qq-2': ['qo-5'], 'qq-3': ['qo-7'] },
    });
    expect(poor.score).toBe(0);
    expect(poor.passed).toBe(false);
  });

  it('stops accepting attempts once they are used up', async () => {
    const answers = { 'qq-1': ['qo-1'], 'qq-2': ['qo-5'], 'qq-3': ['qo-7'] };
    await submitQuizAttempt({ quizId: 'qz-1', answers });
    await submitQuizAttempt({ quizId: 'qz-1', answers });
    await submitQuizAttempt({ quizId: 'qz-1', answers });

    await expect(submitQuizAttempt({ quizId: 'qz-1', answers })).rejects.toMatchObject({
      code: 'quiz_attempts_exhausted',
    });
  });
});

describe('events', () => {
  it('separates upcoming from past events', async () => {
    const upcoming = await fetchEvents('upcoming');
    const past = await fetchEvents('past');
    expect(upcoming.data.length).toBeGreaterThan(0);
    expect(past.data.length).toBeGreaterThan(0);
    expect(
      upcoming.data.every((event) => new Date(event.starts_at).getTime() >= Date.now())
    ).toBe(true);
  });

  it('registers a member and then lets them cancel', async () => {
    await signInAsMember();
    const registered = await registerForEvent('ev-2');
    expect(registered.registration.my_status).toBe('registered');

    await expect(registerForEvent('ev-2')).rejects.toMatchObject({ kind: 'conflict' });

    const cancelled = await cancelEventRegistration('ev-2');
    expect(cancelled.registration.my_status).toBe('none');
  });

  it('refuses registration for an event that has already happened', async () => {
    await signInAsMember();
    await expect(registerForEvent('ev-4')).rejects.toMatchObject({ kind: 'conflict' });
  });

  it('requires sign-in to register', async () => {
    await expect(registerForEvent('ev-2')).rejects.toMatchObject({ kind: 'unauthorized' });
  });
});

describe('prayer requests', () => {
  it('records the visibility the member chose and returns only their own requests', async () => {
    await signInAsMember();
    const created = await submitPrayerRequest({
      body: 'Please pray for my mother, who is in hospital this week.',
      visibility: 'pastoral_team',
      isAnonymous: true,
    });

    expect(created.visibility).toBe('pastoral_team');
    expect(created.is_anonymous).toBe(true);
    expect(created.status).toBe('submitted');

    const mine = await fetchMyPrayerRequests();
    expect(mine.data).toHaveLength(1);
    expect(mine.data[0]!.id).toBe(created.id);
  });

  it('never exposes prayer requests through search', async () => {
    await signInAsMember();
    await submitPrayerRequest({
      body: 'Please pray about a difficult conversation at work tomorrow.',
      visibility: 'prayer_team',
      isAnonymous: false,
    });

    const results = await search({ query: 'difficult conversation' });
    expect(results.results).toHaveLength(0);
  });

  it('requires sign-in', async () => {
    await expect(
      submitPrayerRequest({
        body: 'Please pray for my family this week.',
        visibility: 'pastoral_team',
        isAnonymous: false,
      })
    ).rejects.toMatchObject({ kind: 'unauthorized' });
  });
});

describe('giving', () => {
  beforeEach(async () => {
    await signInAsMember();
  });

  it('never reports a demo gift as paid', async () => {
    const categories = await fetchGivingCategories();
    const tithe = categories.find((category) => category.id === 'gc-1')!;

    const intent = await createGivingIntent({
      categoryId: tithe.id,
      amountMinor: 500_000,
      currency: tithe.currency,
      recurrence: 'one_time',
      idempotencyKey: 'test-key-1',
    });

    expect(intent.status).toBe('demo_not_processed');
    expect(intent.checkout_url ?? null).toBeNull();
    expect(intent.receipt_url ?? null).toBeNull();
  });

  it('returns the same gift for a repeated idempotency key instead of charging twice', async () => {
    const first = await createGivingIntent({
      categoryId: 'gc-1',
      amountMinor: 500_000,
      currency: 'NGN',
      recurrence: 'one_time',
      idempotencyKey: 'retry-key',
    });
    const second = await createGivingIntent({
      categoryId: 'gc-1',
      amountMinor: 500_000,
      currency: 'NGN',
      recurrence: 'one_time',
      idempotencyKey: 'retry-key',
    });

    expect(second.reference).toBe(first.reference);

    const history = await fetchTransactions();
    expect(history.data.filter((item) => item.reference === first.reference)).toHaveLength(1);
  });

  it('enforces the category minimum', async () => {
    await expect(
      createGivingIntent({
        categoryId: 'gc-3',
        amountMinor: 100,
        currency: 'NGN',
        recurrence: 'one_time',
        idempotencyKey: 'too-small',
      })
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('refuses monthly giving where the category does not support it', async () => {
    await expect(
      createGivingIntent({
        categoryId: 'gc-2',
        amountMinor: 200_000,
        currency: 'NGN',
        recurrence: 'monthly',
        idempotencyKey: 'bad-recurrence',
      })
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('starts with an empty history rather than fabricated gifts', async () => {
    const history = await fetchTransactions();
    expect(history.data).toHaveLength(0);
  });
});

describe('search', () => {
  it('covers several content types at once', async () => {
    const results = await search({ query: 'discipleship' });
    const kinds = new Set(results.results.map((result) => result.type));
    expect(results.results.length).toBeGreaterThan(1);
    expect(kinds.size).toBeGreaterThan(1);
  });

  it('respects a type filter', async () => {
    const results = await search({ query: 'mercy', types: ['sermon'] });
    expect(results.results.every((result) => result.type === 'sermon')).toBe(true);
  });

  it('returns an empty result set rather than guessing', async () => {
    const results = await search({ query: 'quantum chromodynamics' });
    expect(results.results).toHaveLength(0);
  });
});

describe('unknown endpoints', () => {
  it('fails loudly so a missing handler is not mistaken for empty data', async () => {
    await expect(
      apiGet(z.object({}), '/does-not-exist', { allowAnonymous: true })
    ).rejects.toBeInstanceOf(ApiError);
  });
});
