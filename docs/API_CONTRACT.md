# TwainMan Ministry API contract

Every endpoint the mobile app calls, in the order the app uses them.

**Status of this document.** The Laravel API did not exist when the app was built, so
these shapes are the app's *proposal*. They are implemented exactly as written by the
development data provider in `src/api/demo/`, and validated at runtime by the Zod
schemas in `src/api/schemas.ts` — which are the authoritative definition. Where the
backend chooses to differ, change the schema and the demo provider together and the
app will follow.

## Conventions

- Base URL: `EXPO_PUBLIC_API_URL`, e.g. `https://api.twainman.org/api/v1`.
- Authentication: `Authorization: Bearer <token>` (Laravel Sanctum personal access
  token). Endpoints marked **public** may be called without one.
- All responses are JSON. Field names are `snake_case`.
- Timestamps are ISO-8601 in UTC (`2026-03-12T17:00:00.000Z`). Events additionally
  carry an IANA `timezone` so the app can show the church's local time.
- Money is in **minor units** (kobo/cents) with an ISO-4217 `currency`.
- Collections are `{ "data": [...], "meta": { "current_page", "last_page", "per_page", "total" } }`.
- Errors follow Laravel's conventions:

```json
{ "message": "The given data was invalid.",
  "errors": { "email": ["That email is already registered."] },
  "code": "access_code_expired" }
```

  `code` is optional and machine-readable; the app branches on it for access codes
  and quiz attempts. Status codes the app handles specifically: 401, 403, 404, 409,
  422, 429, 503.

- `Idempotency-Key` is sent on every mutation that must not apply twice: giving
  intents, event registration, enrolment, access-code activation, lesson completion,
  quiz attempts and prayer requests. The backend must return the original result for
  a repeated key rather than creating a second record.

---

## Authentication

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/register` | **public** |
| POST | `/auth/login` | **public** |
| POST | `/auth/logout` | Revokes the current token |
| GET | `/auth/me` | Returns the member |
| POST | `/auth/forgot-password` | **public**, always 200 |
| POST | `/auth/reset-password` | **public** |
| POST | `/auth/verify` | Body `{ code }` |
| POST | `/auth/verify/resend` | |
| PUT | `/auth/password` | Changing a password should revoke other tokens |
| DELETE | `/account` | Records a deletion **request** for the church office |

`POST /auth/login` → `{ email, password, device_name }`

```json
{
  "token": "12|abcdef...",
  "member": { "id": "41", "name": "Ada Okafor", "email": "ada@example.org",
              "phone": null, "avatar_url": null, "joined_at": "2024-02-11T00:00:00.000Z",
              "email_verified": true, "phone_verified": false,
              "interests": ["Bible study"], "city": "Lagos" },
  "requires_verification": null
}
```

`requires_verification` is `"email"`, `"phone"` or `null`. The app sends the member to
the verification screen only when the backend asks for it.

`POST /auth/register` takes `{ name, email, phone?, password, password_confirmation,
accepted_terms, device_name }` and returns the same envelope.

## Profile

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/profile` | Same shape as `member` |
| PATCH | `/profile` | `{ name?, phone?, city?, interests? }` |
| GET | `/profile/interests` | **public** `{ "data": ["Bible study", ...] }` |
| POST | `/profile/avatar` | `multipart/form-data`, field `avatar` → member |

## Home

`GET /home` — **public**. Composed by the backend; the app renders what it is sent and
hides sections that come back empty.

```json
{
  "member_first_name": "Ada",
  "featured_sermon": { "...sermon" },
  "devotional": { "id", "date", "title", "scripture_reference", "scripture_text", "body", "author" },
  "continue_learning": [ { "...course_summary" } ],
  "upcoming_events": [ { "...event" } ],
  "announcements": [ { "...announcement" } ],
  "live_session": { "...live_session" },
  "recently_saved": [ { "...sermon" } ],
  "unread_notifications": 2,
  "my_prayer_summary": { "open_count": 1, "answered_count": 0 }
}
```

`GET /devotionals/today` — **public**, the devotional object alone.

## Sermons

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/sermons` | **public**. Query: `search, speaker, series, topic, scripture, from, to, sort=newest\|oldest, page` |
| GET | `/sermons/filters` | **public**. Speakers, series and topics with counts, for the whole library |
| GET | `/sermons/{id}` | **public** |
| GET | `/sermons/{id}/transcript` | **public**, 404 when there is none |
| GET | `/sermons/{id}/study-notes` | **public**, 404 when there are none |
| GET | `/sermons/{id}/related` | **public**, `{ "data": [sermon] }` |
| POST/DELETE | `/sermons/{id}/save` | |
| POST | `/sermons/{id}/progress` | `{ position_seconds, duration_seconds, completed }` |
| GET | `/saved` | `{ "sermons": [sermon] }` |

Sermon:

```json
{
  "id": "118", "title": "Mercy That Interrupts",
  "speaker": { "id": "3", "name": "Pastor Adaeze Nwosu", "role": "Lead Pastor", "avatar_url": null },
  "series": { "id": "7", "title": "The Shape of Mercy", "artwork_url": null, "sermon_count": 4 },
  "preached_at": "2026-10-22T09:30:00.000Z",
  "summary": "…", "description": "…",
  "topics": ["Mercy"], "scripture_references": ["Luke 10:25-37"],
  "artwork_url": null,
  "audio": { "url": "https://…/sermon.mp3", "duration_seconds": 2280, "kind": "progressive" },
  "video": null,
  "has_transcript": true, "has_study_notes": true, "ask_enabled": true,
  "saved": false,
  "progress": { "position_seconds": 540, "duration_seconds": 2280, "completed": false,
                "updated_at": "2026-10-24T18:02:00.000Z" }
}
```

`audio` and `video` are independent and both may be null. `kind` is `progressive` or
`hls`.

Transcript: `{ sermon_id, language, source: "human"|"machine", segments: [{ start_seconds, end_seconds?, speaker?, text }] }`.

Study notes: `{ sermon_id, generated_by: "ai"|"ministry_team", generated_at, summary,
key_points[], scriptures[{ reference, text? }], applications[], reflection_questions[],
review_status: "unreviewed"|"approved" }`. The app labels AI-generated material
explicitly and differently depending on `review_status`.

### Ask the Sermon

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/sermons/{id}/ask` | Existing conversation |
| POST | `/sermons/{id}/ask` | `{ question }` → the two new messages |

```json
{ "id": "ask-118", "sermon_id": "118",
  "messages": [
    { "id": "m1", "role": "member", "content": "What did it say about the Samaritan?",
      "created_at": "…", "citations": [], "unanswered_reason": null },
    { "id": "m2", "role": "assistant", "content": "…",
      "created_at": "…",
      "citations": [{ "quote": "The Samaritan does four ordinary things…",
                      "start_seconds": 206, "scripture_reference": null }],
      "unanswered_reason": null }
  ] }
```

Requirements the app depends on:

- Answers must be grounded in that sermon's transcript and the church's approved
  study notes, and must carry the `citations` they came from.
- When the material does not answer the question, return an answer that says so and
  set `unanswered_reason` (e.g. `"no_matching_passage"`) rather than inventing one.
- Return **503** when the AI service is unavailable; the app shows a specific
  "study assistant unavailable" state and points the member at the transcript.
- The AI provider is called by the backend. The app holds no provider key.

## Search

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/search` | **public**. `q`, `types=sermon,course,event,announcement,group`, `page` |
| GET | `/search/suggestions` | **public**. `q` → `{ "data": ["…"] }` |

```json
{ "query": "mercy",
  "results": [ { "type": "sermon", "sermon": { … } },
               { "type": "course", "course": { … } } ],
  "meta": { … }, "suggestions": [] }
```

Search must cover all published content server-side. **Prayer requests must never
appear in search results.**

## Learning

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/programs` | **public**, `{ "data": [program] }` |
| GET | `/courses` | **public**. `program`, `search`, `enrolled`, `page` |
| GET | `/courses/{id}` | **public**. Lesson bodies and materials only for enrolled members |
| POST | `/courses/{id}/enroll` | 403 `access_code_required` when a code is needed |
| POST | `/enrollments/activate` | `{ code }` — validates **and consumes** the code |
| GET | `/enrollments` | Paginated course summaries |
| GET | `/lessons/{id}` | 403 `not_enrolled` when the member has no access |
| POST | `/lessons/{id}/complete` | Returns the server's progress figures |
| GET | `/quizzes/{id}` | Must not include correct answers |
| POST | `/quizzes/{id}/attempts` | `{ answers: { question_id: [option_id] } }` |
| GET | `/courses/{id}/sessions` | Live sessions with join/recording links |
| GET | `/certificates` | Only certificates the church has issued |

Course summary carries `enrollment_mode: "open" | "code_required" | "closed" |
"invite_only"` and `my_enrollment`:

```json
"my_enrollment": { "id": "88", "status": "active", "completed_lessons": 3,
                   "total_lessons": 8, "percent_complete": 38,
                   "enrolled_at": "…" }
```

`percent_complete` is computed by the server. The app never derives it.

Course detail adds `description`, `requirements[]`, `cohort`, `modules[]` (each with
`lessons[]`), `materials[]`, `communication`, `certificate` and `resume_lesson_id`.

```json
"communication": { "whatsapp_group_url": "https://chat.whatsapp.com/…",
                   "whatsapp_group_name": "Foundations — Spring cohort",
                   "announcements_count": 2 }
```

Return `communication` and `materials` **only** to members the server has authorised.
The app opens the WhatsApp invite and says plainly that joining happens in WhatsApp —
it never claims membership of a group.

Lesson summary: `{ id, module_id, title, position, kind, duration_minutes, completed,
locked, lock_reason }`. `kind` is `reading | video | audio | quiz | assignment | live`.

`POST /lessons/{id}/complete`:

```json
{ "lesson_id": "501", "completed": true,
  "enrollment": { "id": "88", "completed_lessons": 4, "total_lessons": 8,
                  "percent_complete": 50, "status": "active" },
  "certificate_issued": false }
```

### Access codes

`POST /enrollments/activate` must validate, check eligibility and **consume** the code
server-side. The app renders each outcome distinctly, keyed on `code`:

| Status | `code` | Member sees |
| --- | --- | --- |
| 200 | — | Access granted, with the course to open |
| 422 | `access_code_invalid` | "That code is not recognised" |
| 422 | `access_code_expired` | "That code has expired" |
| 409 | `access_code_used` | "That code has already been used" |
| 403 | `access_code_ineligible` | "Not eligible for that course yet" |

## Events

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/events` | **public**. `scope=upcoming\|past`, `page` |
| GET | `/events/{id}` | **public** |
| POST | `/events/{id}/registration` | 409 when already registered or the event has passed |
| DELETE | `/events/{id}/registration` | |

Both registration endpoints return the **updated event**, so the screen reflects the
server's view rather than guessing.

```json
"registration": { "required": true, "open": true, "capacity": 40,
                  "registered_count": 31,
                  "my_status": "none" | "registered" | "waitlisted" | "cancelled" }
```

## Prayer

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/prayer-requests` | **The signed-in member's own requests only** |
| POST | `/prayer-requests` | `{ body, visibility, is_anonymous }` |
| DELETE | `/prayer-requests/{id}` | Withdraw |
| POST | `/prayer-requests/{id}/follow-ups` | `{ body }` |
| GET | `/pastoral-care` | **public**. Church-published contact routes |

`visibility` is `pastoral_team | prayer_team | prayer_community` and must be enforced
server-side. Requests must not be exposed through search, announcement feeds,
notifications to other members, or any group endpoint.

## Community

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/groups` | **public**. `type`, `search`, `page` |
| GET | `/groups/{id}` | **public** |
| POST | `/groups/{id}/membership` | Request to join — normally results in `pending` |
| DELETE | `/groups/{id}/membership` | Leave |

`communication_url` must be returned only to members of that group.

## Giving

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/giving/categories` | **public** |
| POST | `/giving/intents` | `{ category_id, amount_minor, currency, recurrence }` |
| GET | `/giving/intents/{reference}` | Provider-verified status |
| GET | `/giving/transactions` | The member's own gifts |

```json
{ "reference": "KH-2026-0001", "status": "pending",
  "amount_minor": 500000, "currency": "NGN",
  "category_id": "1", "category_name": "Tithe", "recurrence": "one_time",
  "checkout_url": "https://checkout.paystack.com/…",
  "created_at": "…", "receipt_url": null, "failure_reason": null,
  "provider": "paystack" }
```

`status`: `pending | processing | successful | failed | cancelled`. (`demo_not_processed`
is produced only by the development provider and never by the backend.)

Requirements:

- The backend creates the intent with the provider and returns a **hosted checkout
  URL**. The app never collects card details and holds no provider key.
- `GET /giving/intents/{reference}` must reflect the provider's verified state —
  ideally from the provider webhook, not from the redirect. The app polls it while
  the status is `pending` or `processing`.
- `Idempotency-Key` must prevent a retried submission from creating a second charge.

## Announcements and notifications

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/announcements` | **public**. `scope`, `unread`, `page` |
| GET | `/announcements/{id}` | **public** |
| POST | `/announcements/{id}/read` | |
| GET | `/notifications` | Paginated |
| POST | `/notifications/{id}/read` | |
| POST | `/notifications/read-all` | |
| GET/PUT | `/notifications/preferences` | Six booleans, see below |
| POST | `/devices` | `{ token, platform, app_version }` |
| DELETE | `/devices/{token}` | |

Preferences: `announcements, events, courses, prayer, giving, new_sermons`.

Notification and announcement `link` fields are **in-app paths** (`/sermons/118`). The
app validates them against an allowlist before navigating; anything else is ignored.
Push payloads should carry the same path in `data.link`.

---

## Endpoint-to-feature map

| Feature | Endpoints it needs |
| --- | --- |
| Onboarding and auth | `/auth/*`, `/profile/interests` |
| Home | `/home`, `/devotionals/today` |
| Sermon library and detail | `/sermons*`, `/saved` |
| Playback resume | `/sermons/{id}/progress` |
| Ask the Sermon | `/sermons/{id}/ask` |
| Discover and search | `/search`, `/search/suggestions`, `/sermons`, `/courses` |
| Courses | `/programs`, `/courses*`, `/enrollments*`, `/lessons*`, `/quizzes*`, `/certificates` |
| Events | `/events*` |
| Prayer | `/prayer-requests*`, `/pastoral-care` |
| Community | `/groups*` |
| Giving | `/giving/*` |
| Announcements and notifications | `/announcements*`, `/notifications*`, `/devices` |
| Profile and settings | `/profile*`, `/auth/password`, `/account` |
