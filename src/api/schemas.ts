import { z } from 'zod';

/**
 * Wire schemas for the TwainMan Ministry API.
 *
 * Responses are validated at the boundary so a backend change surfaces as one
 * clear parse error instead of an `undefined` deep inside a screen. Date fields
 * are ISO-8601 strings in UTC; they are converted with `lib/datetime` at the
 * point of display so time zones are handled once.
 *
 * The matching Laravel resources are documented in `docs/API_CONTRACT.md`.
 */

const isoDate = z.string().min(1).describe('ISO-8601 timestamp, UTC');
const id = z.string().min(1);

export const paginationMetaSchema = z.object({
  current_page: z.number().int(),
  last_page: z.number().int(),
  per_page: z.number().int(),
  total: z.number().int(),
});

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({ data: z.array(item), meta: paginationMetaSchema });
}

/* -------------------------------------------------------------------------- */
/* Member & auth                                                              */
/* -------------------------------------------------------------------------- */

export const memberSchema = z.object({
  id,
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  joined_at: isoDate.nullable().optional(),
  email_verified: z.boolean().default(false),
  phone_verified: z.boolean().default(false),
  /** Topics the member picked during onboarding. Drives Home ordering only. */
  interests: z.array(z.string()).default([]),
  city: z.string().nullable().optional(),
});

export const authSessionSchema = z.object({
  token: z.string().min(1),
  member: memberSchema,
  /** Set when the backend requires email/phone verification before full access. */
  requires_verification: z.enum(['email', 'phone']).nullable().optional(),
});

/* -------------------------------------------------------------------------- */
/* Sermons                                                                    */
/* -------------------------------------------------------------------------- */

export const speakerSchema = z.object({
  id,
  name: z.string(),
  role: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export const seriesSchema = z.object({
  id,
  title: z.string(),
  artwork_url: z.string().nullable().optional(),
  sermon_count: z.number().int().optional(),
});

export const mediaAssetSchema = z.object({
  url: z.string(),
  duration_seconds: z.number().nonnegative().nullable().optional(),
  /** Present for HLS streams; the player picks a strategy from it. */
  kind: z.enum(['progressive', 'hls']).default('progressive'),
  size_bytes: z.number().nonnegative().nullable().optional(),
});

export const sermonSchema = z.object({
  id,
  title: z.string(),
  speaker: speakerSchema,
  series: seriesSchema.nullable().optional(),
  preached_at: isoDate,
  summary: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  topics: z.array(z.string()).default([]),
  scripture_references: z.array(z.string()).default([]),
  artwork_url: z.string().nullable().optional(),
  /** Either, both or neither may be present. The UI must not assume both. */
  audio: mediaAssetSchema.nullable().optional(),
  video: mediaAssetSchema.nullable().optional(),
  has_transcript: z.boolean().default(false),
  has_study_notes: z.boolean().default(false),
  ask_enabled: z.boolean().default(false),
  saved: z.boolean().default(false),
  /** Server-recorded listening position, when the member is signed in. */
  progress: z
    .object({
      position_seconds: z.number().nonnegative(),
      duration_seconds: z.number().nonnegative().nullable().optional(),
      completed: z.boolean().default(false),
      updated_at: isoDate.optional(),
    })
    .nullable()
    .optional(),
});

export const sermonFiltersSchema = z.object({
  speakers: z.array(z.object({ id, name: z.string(), count: z.number().int().optional() })),
  series: z.array(z.object({ id, title: z.string(), count: z.number().int().optional() })),
  topics: z.array(z.object({ value: z.string(), count: z.number().int().optional() })),
});

export const transcriptSchema = z.object({
  sermon_id: id,
  language: z.string().default('en'),
  source: z.enum(['human', 'machine']).default('machine'),
  segments: z.array(
    z.object({
      start_seconds: z.number().nonnegative(),
      end_seconds: z.number().nonnegative().nullable().optional(),
      speaker: z.string().nullable().optional(),
      text: z.string(),
    })
  ),
});

export const studyNotesSchema = z.object({
  sermon_id: id,
  /** Always set by the backend; the UI labels AI-assisted material explicitly. */
  generated_by: z.enum(['ai', 'ministry_team']),
  generated_at: isoDate,
  summary: z.string(),
  key_points: z.array(z.string()).default([]),
  scriptures: z
    .array(z.object({ reference: z.string(), text: z.string().nullable().optional() }))
    .default([]),
  applications: z.array(z.string()).default([]),
  reflection_questions: z.array(z.string()).default([]),
  /** Review state set by the ministry team, when they moderate AI output. */
  review_status: z.enum(['unreviewed', 'approved']).default('unreviewed'),
});

export const askMessageSchema = z.object({
  id,
  role: z.enum(['member', 'assistant']),
  content: z.string(),
  created_at: isoDate,
  /** Transcript passages the answer was drawn from. */
  citations: z
    .array(
      z.object({
        quote: z.string(),
        start_seconds: z.number().nonnegative().nullable().optional(),
        scripture_reference: z.string().nullable().optional(),
      })
    )
    .default([]),
  /** Set when the sermon material does not answer the question. */
  unanswered_reason: z.string().nullable().optional(),
});

export const askConversationSchema = z.object({
  id,
  sermon_id: id,
  messages: z.array(askMessageSchema),
});

/* -------------------------------------------------------------------------- */
/* Devotional & home                                                          */
/* -------------------------------------------------------------------------- */

export const devotionalSchema = z.object({
  id,
  date: isoDate,
  title: z.string(),
  scripture_reference: z.string(),
  scripture_text: z.string(),
  body: z.string(),
  author: z.string().nullable().optional(),
  artwork_url: z.string().nullable().optional(),
  /** One question to sit with. Optional - not every devotional has one. */
  reflection: z.string().nullable().optional(),
});

/* -------------------------------------------------------------------------- */
/* Prophetic decree                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The monthly decree the Lead Pastor publishes: a theme, a scriptural
 * foundation, numbered declarations to pray through, and the corporate
 * confession that closes the month.
 */
export const decreeSectionSchema = z.object({
  id,
  position: z.number().int(),
  title: z.string(),
  scriptures: z.array(z.string()).default([]),
  /** Paragraphs, in the order they are prayed. */
  body: z.array(z.string()),
});

export const propheticDecreeSchema = z.object({
  id,
  /** `YYYY-MM`, the month this decree belongs to. */
  period: z.string().regex(/^\d{4}-\d{2}$/),
  month_label: z.string(),
  theme: z.string(),
  subtitle: z.string().nullable().optional(),
  author: z.string(),
  author_role: z.string().nullable().optional(),
  artwork_url: z.string().nullable().optional(),
  published_at: isoDate,
  /** The theme the church has set over the whole year, when there is one. */
  year_theme: z.object({ year: z.number().int(), theme: z.string() }).nullable().optional(),
  scriptural_foundation: z.array(z.string()).default([]),
  introduction: z.array(z.string()).default([]),
  sections: z.array(decreeSectionSchema),
  confession: z
    .object({ title: z.string(), lead: z.string(), lines: z.array(z.string()) })
    .nullable()
    .optional(),
  closing_word: z.string().nullable().optional(),
});

/**
 * What the member has prayed and read.
 *
 * Held locally so it works offline and mid-prayer, and mirrored to the backend
 * for a signed-in member so it follows them between devices.
 */
export const devotionProgressSchema = z.object({
  period: z.string(),
  prayed_section_ids: z.array(z.string()).default([]),
  /** `YYYY-MM-DD` the corporate confession was last declared. */
  confession_declared_on: z.string().nullable().optional(),
  read_devotional_ids: z.array(z.string()).default([]),
  streak_days: z.number().int().default(0),
  longest_streak_days: z.number().int().default(0),
  /** `YYYY-MM-DD` of the last day with any devotional activity. */
  last_active_on: z.string().nullable().optional(),
});

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export const eventSchema = z.object({
  id,
  title: z.string(),
  starts_at: isoDate,
  ends_at: isoDate.nullable().optional(),
  /** IANA zone the church scheduled the event in, e.g. `Africa/Lagos`. */
  timezone: z.string().default('UTC'),
  format: z.enum(['in_person', 'online', 'hybrid']),
  venue_name: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  online_url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  artwork_url: z.string().nullable().optional(),
  organizer: z.string().nullable().optional(),
  registration: z.object({
    required: z.boolean().default(false),
    open: z.boolean().default(false),
    capacity: z.number().int().nullable().optional(),
    registered_count: z.number().int().nullable().optional(),
    my_status: z.enum(['none', 'registered', 'waitlisted', 'cancelled']).default('none'),
  }),
  replay_url: z.string().nullable().optional(),
});

/* -------------------------------------------------------------------------- */
/* Announcements & notifications                                              */
/* -------------------------------------------------------------------------- */

export const announcementSchema = z.object({
  id,
  title: z.string(),
  published_at: isoDate,
  excerpt: z.string().nullable().optional(),
  body: z.string(),
  scope: z.object({
    type: z.enum(['church', 'ministry', 'course', 'group']),
    name: z.string().nullable().optional(),
  }),
  read: z.boolean().default(false),
  pinned: z.boolean().default(false),
  /** In-app destination the announcement points at, if any. */
  link: z.string().nullable().optional(),
});

export const notificationSchema = z.object({
  id,
  title: z.string(),
  body: z.string(),
  created_at: isoDate,
  read: z.boolean().default(false),
  category: z.enum(['announcement', 'event', 'course', 'prayer', 'giving', 'sermon', 'system']),
  /** Deep link path inside the app, e.g. `/sermons/42`. Validated before use. */
  link: z.string().nullable().optional(),
});

export const notificationPreferencesSchema = z.object({
  announcements: z.boolean(),
  events: z.boolean(),
  courses: z.boolean(),
  prayer: z.boolean(),
  giving: z.boolean(),
  new_sermons: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/* Learning                                                                   */
/* -------------------------------------------------------------------------- */

export const programSchema = z.object({
  id,
  title: z.string(),
  summary: z.string().nullable().optional(),
  artwork_url: z.string().nullable().optional(),
  course_count: z.number().int().default(0),
});

export const courseSummarySchema = z.object({
  id,
  program_id: id.nullable().optional(),
  title: z.string(),
  summary: z.string().nullable().optional(),
  artwork_url: z.string().nullable().optional(),
  instructors: z.array(speakerSchema).default([]),
  starts_at: isoDate.nullable().optional(),
  ends_at: isoDate.nullable().optional(),
  lesson_count: z.number().int().default(0),
  /** How a member may get in. `code_required` means a one-time access code. */
  enrollment_mode: z.enum(['open', 'code_required', 'closed', 'invite_only']),
  my_enrollment: z
    .object({
      id,
      status: z.enum(['active', 'pending', 'completed', 'withdrawn']),
      completed_lessons: z.number().int().default(0),
      total_lessons: z.number().int().default(0),
      /** Server-computed. The app never derives this itself. */
      percent_complete: z.number().min(0).max(100).default(0),
      enrolled_at: isoDate.optional(),
    })
    .nullable()
    .optional(),
});

export const lessonSummarySchema = z.object({
  id,
  module_id: id,
  title: z.string(),
  position: z.number().int(),
  kind: z.enum(['reading', 'video', 'audio', 'quiz', 'assignment', 'live']),
  duration_minutes: z.number().int().nullable().optional(),
  completed: z.boolean().default(false),
  /** Set by the backend when the member has not unlocked this lesson yet. */
  locked: z.boolean().default(false),
  lock_reason: z.string().nullable().optional(),
});

export const moduleSchema = z.object({
  id,
  course_id: id,
  title: z.string(),
  position: z.number().int(),
  summary: z.string().nullable().optional(),
  lessons: z.array(lessonSummarySchema).default([]),
});

export const materialSchema = z.object({
  id,
  title: z.string(),
  kind: z.enum(['pdf', 'link', 'audio', 'video', 'document']),
  url: z.string(),
  size_bytes: z.number().nonnegative().nullable().optional(),
});

export const lessonSchema = lessonSummarySchema.extend({
  course_id: id,
  body: z.string().nullable().optional(),
  media: mediaAssetSchema.nullable().optional(),
  materials: z.array(materialSchema).default([]),
  quiz_id: id.nullable().optional(),
  assignment: z
    .object({
      id,
      prompt: z.string(),
      due_at: isoDate.nullable().optional(),
      submission: z
        .object({ id, submitted_at: isoDate, status: z.enum(['submitted', 'graded']), grade: z.string().nullable().optional() })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  next_lesson_id: id.nullable().optional(),
  previous_lesson_id: id.nullable().optional(),
});

export const courseDetailSchema = courseSummarySchema.extend({
  description: z.string().nullable().optional(),
  requirements: z.array(z.string()).default([]),
  cohort: z
    .object({ id, name: z.string(), starts_at: isoDate.nullable().optional() })
    .nullable()
    .optional(),
  modules: z.array(moduleSchema).default([]),
  materials: z.array(materialSchema).default([]),
  /** Church-approved communication links. Never scraped or inferred. */
  communication: z
    .object({
      whatsapp_group_url: z.string().nullable().optional(),
      whatsapp_group_name: z.string().nullable().optional(),
      announcements_count: z.number().int().default(0),
    })
    .nullable()
    .optional(),
  certificate: z
    .object({ id, issued_at: isoDate, url: z.string().nullable().optional() })
    .nullable()
    .optional(),
  resume_lesson_id: id.nullable().optional(),
});

export const enrollmentResultSchema = z.object({
  enrollment: z.object({
    id,
    course_id: id,
    status: z.enum(['active', 'pending', 'completed', 'withdrawn']),
    completed_lessons: z.number().int().default(0),
    total_lessons: z.number().int().default(0),
    percent_complete: z.number().min(0).max(100).default(0),
  }),
  message: z.string().nullable().optional(),
});

export const lessonProgressSchema = z.object({
  lesson_id: id,
  completed: z.boolean(),
  enrollment: z.object({
    id,
    completed_lessons: z.number().int(),
    total_lessons: z.number().int(),
    percent_complete: z.number().min(0).max(100),
    status: z.enum(['active', 'pending', 'completed', 'withdrawn']),
  }),
  /** Only ever set by the server, never derived on the device. */
  certificate_issued: z.boolean().default(false),
});

export const quizSchema = z.object({
  id,
  lesson_id: id.nullable().optional(),
  title: z.string(),
  instructions: z.string().nullable().optional(),
  passing_score: z.number().min(0).max(100),
  attempts_allowed: z.number().int().nullable().optional(),
  attempts_used: z.number().int().default(0),
  questions: z.array(
    z.object({
      id,
      prompt: z.string(),
      /** `single` renders radios, `multiple` renders checkboxes. */
      kind: z.enum(['single', 'multiple']),
      options: z.array(z.object({ id, label: z.string() })),
    })
  ),
});

export const quizResultSchema = z.object({
  attempt_id: id,
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  correct_count: z.number().int(),
  total_count: z.number().int(),
  /** Per-question feedback, when the course is configured to reveal it. */
  feedback: z
    .array(
      z.object({
        question_id: id,
        correct: z.boolean(),
        explanation: z.string().nullable().optional(),
      })
    )
    .default([]),
});

export const liveSessionSchema = z.object({
  id,
  course_id: id.nullable().optional(),
  title: z.string(),
  starts_at: isoDate,
  ends_at: isoDate.nullable().optional(),
  timezone: z.string().default('UTC'),
  /** External webinar link supplied by the church (Zoom, Meet, YouTube Live). */
  join_url: z.string().nullable().optional(),
  recording_url: z.string().nullable().optional(),
  attendance: z.enum(['unknown', 'present', 'absent']).default('unknown'),
});

export const certificateSchema = z.object({
  id,
  course_id: id,
  course_title: z.string(),
  issued_at: isoDate,
  url: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
});

/* -------------------------------------------------------------------------- */
/* Community                                                                  */
/* -------------------------------------------------------------------------- */

export const groupSchema = z.object({
  id,
  name: z.string(),
  type: z.enum(['ministry', 'fellowship', 'cell', 'group']),
  summary: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  artwork_url: z.string().nullable().optional(),
  meeting_schedule: z.string().nullable().optional(),
  meeting_location: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  leader_name: z.string().nullable().optional(),
  member_count: z.number().int().nullable().optional(),
  membership: z.object({
    status: z.enum(['none', 'pending', 'member', 'declined']),
    can_request: z.boolean().default(false),
    can_leave: z.boolean().default(false),
  }),
  /** Approved group chat link, only returned to members of the group. */
  communication_url: z.string().nullable().optional(),
  upcoming_activities: z
    .array(z.object({ id, title: z.string(), starts_at: isoDate }))
    .default([]),
});

/* -------------------------------------------------------------------------- */
/* Prayer                                                                     */
/* -------------------------------------------------------------------------- */

export const prayerVisibility = z.enum(['pastoral_team', 'prayer_team', 'prayer_community']);

export const prayerRequestSchema = z.object({
  id,
  body: z.string(),
  visibility: prayerVisibility,
  status: z.enum(['submitted', 'in_prayer', 'answered', 'closed']),
  created_at: isoDate,
  updated_at: isoDate.nullable().optional(),
  is_anonymous: z.boolean().default(false),
  can_withdraw: z.boolean().default(false),
  follow_ups: z
    .array(z.object({ id, body: z.string(), created_at: isoDate }))
    .default([]),
});

export const pastoralCareSchema = z.object({
  /** Everything here is church-supplied; the app never invents a contact route. */
  contacts: z.array(
    z.object({
      id,
      label: z.string(),
      description: z.string().nullable().optional(),
      kind: z.enum(['phone', 'email', 'whatsapp', 'form', 'in_person']),
      value: z.string(),
      availability: z.string().nullable().optional(),
    })
  ),
  confidentiality_note: z.string().nullable().optional(),
});

/* -------------------------------------------------------------------------- */
/* Giving                                                                     */
/* -------------------------------------------------------------------------- */

export const givingCategorySchema = z.object({
  id,
  name: z.string(),
  description: z.string().nullable().optional(),
  /** ISO-4217 code the church collects in, decided by the backend. */
  currency: z.string().length(3),
  /** Minor units (kobo/cents), as configured by the church. */
  suggested_amounts: z.array(z.number().int().positive()).default([]),
  minimum_amount: z.number().int().nonnegative().default(0),
  recurring_supported: z.boolean().default(false),
});

export const givingStatus = z.enum([
  'pending',
  'processing',
  'successful',
  'failed',
  'cancelled',
  /** Returned only by the demo provider: nothing was charged. */
  'demo_not_processed',
]);

export const givingIntentSchema = z.object({
  reference: z.string().min(1),
  status: givingStatus,
  amount_minor: z.number().int().positive(),
  currency: z.string().length(3),
  category_id: id,
  category_name: z.string(),
  recurrence: z.enum(['one_time', 'monthly']).default('one_time'),
  /** Provider-hosted checkout page. The app never collects card details. */
  checkout_url: z.string().nullable().optional(),
  created_at: isoDate,
  receipt_url: z.string().nullable().optional(),
  failure_reason: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
});

export const transactionSchema = z.object({
  id,
  reference: z.string(),
  amount_minor: z.number().int(),
  currency: z.string().length(3),
  category_name: z.string(),
  status: givingStatus,
  created_at: isoDate,
  receipt_url: z.string().nullable().optional(),
  recurrence: z.enum(['one_time', 'monthly']).default('one_time'),
});

/* -------------------------------------------------------------------------- */
/* Home & search                                                              */
/* -------------------------------------------------------------------------- */

export const homeFeedSchema = z.object({
  member_first_name: z.string().nullable().optional(),
  /** Server decides what deserves attention; the app renders what it is sent. */
  featured_sermon: sermonSchema.nullable().optional(),
  devotional: devotionalSchema.nullable().optional(),
  continue_learning: z.array(courseSummarySchema).default([]),
  upcoming_events: z.array(eventSchema).default([]),
  announcements: z.array(announcementSchema).default([]),
  live_session: liveSessionSchema.nullable().optional(),
  recently_saved: z.array(sermonSchema).default([]),
  unread_notifications: z.number().int().default(0),
  my_prayer_summary: z
    .object({ open_count: z.number().int(), answered_count: z.number().int() })
    .nullable()
    .optional(),
});

export const searchResultSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('sermon'), sermon: sermonSchema }),
  z.object({ type: z.literal('course'), course: courseSummarySchema }),
  z.object({ type: z.literal('event'), event: eventSchema }),
  z.object({ type: z.literal('announcement'), announcement: announcementSchema }),
  z.object({ type: z.literal('group'), group: groupSchema }),
  z.object({ type: z.literal('live_session'), live_session: liveSessionSchema }),
]);

export const searchResponseSchema = z.object({
  query: z.string(),
  results: z.array(searchResultSchema),
  meta: paginationMetaSchema,
  /** Server-side suggestions; the app does not guess them from loaded objects. */
  suggestions: z.array(z.string()).default([]),
});

export const savedContentSchema = z.object({
  sermons: z.array(sermonSchema).default([]),
});

export const messageResponseSchema = z.object({ message: z.string() });

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type Member = z.infer<typeof memberSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type Speaker = z.infer<typeof speakerSchema>;
export type Series = z.infer<typeof seriesSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type Sermon = z.infer<typeof sermonSchema>;
export type SermonFilters = z.infer<typeof sermonFiltersSchema>;
export type Transcript = z.infer<typeof transcriptSchema>;
export type StudyNotes = z.infer<typeof studyNotesSchema>;
export type AskMessage = z.infer<typeof askMessageSchema>;
export type AskConversation = z.infer<typeof askConversationSchema>;
export type Devotional = z.infer<typeof devotionalSchema>;
export type DecreeSection = z.infer<typeof decreeSectionSchema>;
export type PropheticDecree = z.infer<typeof propheticDecreeSchema>;
export type DevotionProgress = z.infer<typeof devotionProgressSchema>;
export type ChurchEvent = z.infer<typeof eventSchema>;
export type Announcement = z.infer<typeof announcementSchema>;
export type AppNotification = z.infer<typeof notificationSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type Program = z.infer<typeof programSchema>;
export type CourseSummary = z.infer<typeof courseSummarySchema>;
export type CourseDetail = z.infer<typeof courseDetailSchema>;
export type CourseModule = z.infer<typeof moduleSchema>;
export type LessonSummary = z.infer<typeof lessonSummarySchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Material = z.infer<typeof materialSchema>;
export type EnrollmentResult = z.infer<typeof enrollmentResultSchema>;
export type LessonProgress = z.infer<typeof lessonProgressSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type QuizResult = z.infer<typeof quizResultSchema>;
export type LiveSession = z.infer<typeof liveSessionSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export type Group = z.infer<typeof groupSchema>;
export type PrayerRequest = z.infer<typeof prayerRequestSchema>;
export type PrayerVisibility = z.infer<typeof prayerVisibility>;
export type PastoralCare = z.infer<typeof pastoralCareSchema>;
export type GivingCategory = z.infer<typeof givingCategorySchema>;
export type GivingIntent = z.infer<typeof givingIntentSchema>;
export type GivingStatus = z.infer<typeof givingStatus>;
export type Transaction = z.infer<typeof transactionSchema>;
export type HomeFeed = z.infer<typeof homeFeedSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type SavedContent = z.infer<typeof savedContentSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type Paginated<T> = { data: T[]; meta: PaginationMeta };
