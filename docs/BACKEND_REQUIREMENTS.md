# Backend and service requirements

What the Laravel API, and the services around it, have to provide before each part of
the mobile app can leave demo mode. `docs/API_CONTRACT.md` has the request and
response shapes; this document is the work list and the decisions that are still open.

---

## 1. Laravel foundations

- **Sanctum personal access tokens.** `POST /auth/login` and `/auth/register` issue a
  token; `/auth/logout` revokes the current one. Changing a password should revoke the
  member's other tokens.
- **Rate limiting** on `/auth/login`, `/auth/forgot-password`, `/auth/verify` and
  `/enrollments/activate`. The app renders 429 as "too many attempts — wait a minute".
- **Idempotency-Key middleware.** Store the key with the created record and replay the
  original response for a repeat. Required on giving intents, event registration,
  enrolment, access-code activation, lesson completion, quiz attempts and prayer
  requests.
- **Consistent error envelope** (`message`, `errors`, optional `code`) on every
  endpoint. The machine-readable `code` matters for access codes and quiz attempts.
- **Maintenance mode returns 503**, which the app shows as "briefly unavailable".

## 2. Content and publishing

| Needed | Why |
| --- | --- |
| Sermon records with speaker, series, topics, Scripture references | Library filters are server-side |
| `GET /sermons/filters` aggregates | Filtering by a speaker whose sermons are not on screen |
| Media URLs for audio and video, each optional | The app never assumes both exist |
| Transcripts with `start_seconds` per segment | Tapping a timestamp seeks the player |
| Devotional for "today" | Home's Scripture block |
| Announcements with `scope` and an in-app `link` | Feed, notification deep links |

Media should be served over HTTPS with range requests (seeking) and sensible cache
headers. HLS is supported via `kind: "hls"` if the church moves to streaming.

## 3. AI study material and Ask the Sermon

The app consumes AI through the backend and holds **no provider key**.

Required of the backend:

1. Generate study notes from the sermon transcript, stored with
   `generated_by: "ai"` and a `review_status` the ministry team can set to
   `approved`. The app labels unreviewed material differently.
2. Answer questions from that sermon's transcript plus the approved notes
   (retrieval over the transcript, not open-ended generation), returning the
   `citations` used.
3. Return an answer with `unanswered_reason` when the material does not cover the
   question, instead of inventing one.
4. Return 503 when the provider is down or the budget is exhausted.
5. Rate-limit per member.

**Open decision:** which provider and model, who reviews AI output before members see
it, and whether questions are retained for pastoral follow-up. The app is ready for
either answer — it only needs `review_status` set honestly.

## 4. Learning

- Programs, courses, cohorts, modules, lessons, materials, quizzes, assignments,
  enrolments, attendance, live sessions and certificates.
- **Access codes** are the sensitive part: one-time, cohort-scoped, validated,
  eligibility-checked and consumed inside a transaction on the server. The client
  check does not exist, by design.
- **Materials and lesson bodies must be withheld** from non-enrolled members by the
  API, not merely hidden by the app.
- `percent_complete` and `certificate_issued` are computed by the server and returned
  with the completion response.
- Quiz endpoints must not serialise correct answers; marking happens server-side.
- WhatsApp group links are church-configured fields on the cohort. The app opens the
  invite; nothing scrapes or joins on the member's behalf.

## 5. Events

- Upcoming and past scopes, capacity and registered counts, and a `my_status` per
  member.
- Registration must reject events that have already started (409) and closed
  registration (403).
- Store the event's IANA time zone; the app displays the church's local time with the
  zone attached.

## 6. Prayer

- `GET /prayer-requests` returns **only the authenticated member's own requests**.
- Visibility (`pastoral_team`, `prayer_team`, `prayer_community`) is enforced in
  policies, not in the UI.
- Requests must be excluded from search indexes, announcement feeds and any
  notification body sent to other members.
- Retention and who may read each visibility level belong in the church's privacy
  policy; the app links to it and makes no promise of its own.

## 7. Giving — the payment provider

**Assumption to confirm: Paystack**, chosen for Nigeria. Flutterwave or Stripe would
work the same way; only the backend changes.

Backend responsibilities:

1. `POST /giving/intents` creates a transaction with the provider and returns a
   hosted `checkout_url` plus a `reference`.
2. A **provider webhook** (signature-verified) is the source of truth for
   `successful` / `failed`. Do not mark a gift successful from the redirect.
3. `GET /giving/intents/{reference}` returns the verified status; the app polls it
   while `pending` or `processing`.
4. Recurring giving only where the provider supports it; `recurring_supported` per
   category drives the UI.
5. Receipts: issue `receipt_url` once settled.

The app collects no card details and stores none. Required credentials — provider
secret key, webhook secret — live only on the server.

## 8. Push notifications

- The app registers an **Expo push token** via `POST /devices`. The backend stores it
  per member and device, and removes it on `DELETE /devices/{token}` and on 410
  responses from Expo.
- Sending goes through the Expo push service (or APNs/FCM directly if the church
  prefers), filtered by the member's `/notifications/preferences`.
- Payload must include `data.link` as an in-app path (`/sermons/118`).
- The app needs an **EAS project id** for tokens to be issued at all: run `eas init`
  and rebuild. Without it the notification screen explains why push is unavailable
  rather than failing silently.

## 9. Credentials and configuration checklist

| Where | What | Notes |
| --- | --- | --- |
| Laravel `.env` | Database, `APP_KEY`, mail transport | |
| Laravel `.env` | Payment provider secret key + webhook secret | Never in the app |
| Laravel `.env` | AI provider key | Never in the app |
| Laravel `.env` | Expo access token (for push sending) | |
| App `.env` | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_MODE=live` | Per environment |
| App `.env` | `EXPO_PUBLIC_ALLOW_MODE_SWITCH=0` | Production builds |
| App `.env` | Church email, phone, privacy and terms URLs | Shown in Help |
| EAS | Project id, iOS/Android credentials | `eas init`, `eas credentials` |
| Stores | Bundle id `org.twainman.app` | Change if the church owns another |

## 10. Assets the church needs to supply

The app ships **no invented branding**. Until these arrive it uses composed
typographic placeholders, which are a deliberate treatment rather than a gap:

- App icon, adaptive icon and splash mark (currently the Expo defaults in
  `assets/images/`).
- Sermon and series artwork, course artwork, event artwork.
- The published privacy policy and terms URLs.
- Pastoral care contact routes (`/pastoral-care`).

## 11. Not built, and why

- **No administration features.** Publishing, moderation and member management belong
  to the church's admin system.
- **No member directory or member-to-member messaging.** The brief rules it out
  unless the backend explicitly supports it; nothing here assumes it.
- **No offline writes.** Reads are cached by TanStack Query and saved preferences are
  local, but transactional actions (giving, registration, prayer, enrolment) require a
  connection and say so rather than queueing silently.
