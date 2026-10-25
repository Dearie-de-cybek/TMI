import { z } from 'zod';

import { apiGet, apiPost, idempotencyKey } from '@/api/client';
import {
  certificateSchema,
  courseDetailSchema,
  courseSummarySchema,
  enrollmentResultSchema,
  lessonProgressSchema,
  lessonSchema,
  liveSessionSchema,
  paginated,
  programSchema,
  quizResultSchema,
  quizSchema,
  type Certificate,
  type CourseDetail,
  type CourseSummary,
  type EnrollmentResult,
  type Lesson,
  type LessonProgress,
  type LiveSession,
  type Paginated,
  type Program,
  type Quiz,
  type QuizResult,
} from '@/api/schemas';

export function fetchPrograms(): Promise<Program[]> {
  return apiGet(z.object({ data: z.array(programSchema) }), '/programs', {
    allowAnonymous: true,
  }).then((response) => response.data);
}

export function fetchCourses(
  options: { program?: string | null; search?: string; enrolled?: boolean; page?: number } = {},
  signal?: AbortSignal
): Promise<Paginated<CourseSummary>> {
  return apiGet(paginated(courseSummarySchema), '/courses', {
    allowAnonymous: true,
    signal,
    query: {
      program: options.program,
      search: options.search,
      enrolled: options.enrolled ? 'true' : undefined,
      page: options.page ?? 1,
    },
  });
}

export function fetchCourse(id: string, signal?: AbortSignal): Promise<CourseDetail> {
  return apiGet(courseDetailSchema, `/courses/${id}`, { allowAnonymous: true, signal });
}

export function enrollInCourse(id: string): Promise<EnrollmentResult> {
  return apiPost(enrollmentResultSchema, `/courses/${id}/enroll`, undefined, {
    idempotencyKey: idempotencyKey(`enroll-${id}`),
  });
}

/**
 * Redeems a one-time access code.
 *
 * Validation and consumption happen on the server — the app only forwards what
 * the member typed and renders whichever outcome comes back (invalid, expired,
 * already used, not eligible, or granted).
 */
export function activateAccessCode(code: string): Promise<EnrollmentResult> {
  return apiPost(
    enrollmentResultSchema,
    '/enrollments/activate',
    { code: code.trim().toUpperCase() },
    { idempotencyKey: idempotencyKey('activate') }
  );
}

export function fetchEnrollments(): Promise<Paginated<CourseSummary>> {
  return apiGet(paginated(courseSummarySchema), '/enrollments');
}

export function fetchLesson(id: string, signal?: AbortSignal): Promise<Lesson> {
  return apiGet(lessonSchema, `/lessons/${id}`, { signal });
}

/**
 * Marks a lesson complete. The response carries the server's progress figures,
 * which are the only ones the app displays.
 */
export function completeLesson(id: string): Promise<LessonProgress> {
  return apiPost(lessonProgressSchema, `/lessons/${id}/complete`, undefined, {
    idempotencyKey: idempotencyKey(`lesson-${id}`),
  });
}

export function fetchQuiz(id: string, signal?: AbortSignal): Promise<Quiz> {
  return apiGet(quizSchema, `/quizzes/${id}`, { signal });
}

export function submitQuizAttempt(input: {
  quizId: string;
  answers: Record<string, string[]>;
}): Promise<QuizResult> {
  return apiPost(
    quizResultSchema,
    `/quizzes/${input.quizId}/attempts`,
    { answers: input.answers },
    { idempotencyKey: idempotencyKey(`quiz-${input.quizId}`) }
  );
}

export function fetchCourseSessions(courseId: string): Promise<LiveSession[]> {
  return apiGet(z.object({ data: z.array(liveSessionSchema) }), `/courses/${courseId}/sessions`).then(
    (response) => response.data
  );
}

export function fetchCertificates(): Promise<Certificate[]> {
  return apiGet(z.object({ data: z.array(certificateSchema) }), '/certificates').then(
    (response) => response.data
  );
}
