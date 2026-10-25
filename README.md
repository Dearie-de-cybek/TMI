# TwainMan Ministry

The member-facing mobile application for the TwainMan Ministry ministry: sermons and
study, discipleship courses, events, prayer, community, giving and announcements.

This repository contains the **mobile app only**. Church administration is a separate
system; the app talks to the church's Laravel API over a documented contract
(`docs/API_CONTRACT.md`) and ships with a development data provider so the whole
interface can be exercised before that API exists.

---

## Quick start

```bash
npm install
cp .env.example .env
npm start
```

The app boots in **demo mode** by default (`EXPO_PUBLIC_API_MODE=demo`): every screen
works against bundled sample content, and a strip at the top of the app says so.
Nothing in demo mode is saved on a server, no email is sent and no payment is taken.

Press `i` / `a` in the Expo CLI to open a simulator, or scan the QR code with Expo Go.
Features that need native modules not bundled in Expo Go (background audio, push
notifications, calendar) need a development build:

```bash
npx expo run:ios      # or run:android
# or: npx eas-cli@latest build --profile development
```

### Pointing at the Laravel API

```bash
# .env
EXPO_PUBLIC_API_MODE=live
EXPO_PUBLIC_API_URL=https://api.twainman.org/api/v1
```

In a development build you can also switch at runtime: **Profile → Data source**.
Set `EXPO_PUBLIC_ALLOW_MODE_SWITCH=0` for production builds so the switch is gone.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run ios` / `android` / `web` | Dev server targeting one platform |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | `expo lint` (ESLint flat config) |
| `npm test` | Jest unit and integration tests |
| `npm run verify` | typecheck + lint + tests |
| `npm run doctor` | `expo-doctor` dependency and config checks |

---

## Architecture

```
src/
  app/                    Routes (expo-router). Files here are screens only.
  api/                    Transport, schemas, errors, query client
    demo/                 Development data provider (content, state, routes)
  components/
    ui/                   Design-system primitives
    content/              Content rows and editorial blocks
    media/                Audio and video players
    app/                  App chrome: tab bar, notice strip, toast
  config/                 Environment and runtime configuration
  design/                 Tokens and theme provider
  features/<domain>/      API calls, stores and hooks per domain
  lib/                    Storage, validation, dates, formatting, deep links
```

**The rules that keep it maintainable**

- Screens never call `fetch`. They call a feature's API module, which goes through
  `api/client` and validates the response against a Zod schema.
- There is one error type (`ApiError`) and one place where member-facing error copy
  is written (`api/errors.ts`).
- Authorisation is the server's decision. The app renders what the API returns —
  course access, lesson progress, certificates and payment states are never derived
  on the device.
- Demo mode and live mode share one `Transport` interface, so no feature code
  branches on which one is active.
- Credentials live in the keychain/keystore (`expo-secure-store`); preferences and
  caches live in `AsyncStorage`. Passwords are never persisted.

### Data flow

```
screen → features/<domain>/api.ts → api/client.ts → Transport
                                                     ├── api/http.ts   (Laravel)
                                                     └── api/demo/*    (dev data)
                                        ↓
                              Zod schema validation
                                        ↓
                          TanStack Query cache (api/query-client.ts)
```

---

## Documentation

| Document | Contents |
| --- | --- |
| `docs/API_CONTRACT.md` | Every endpoint the app calls, with request and response shapes |
| `docs/BACKEND_REQUIREMENTS.md` | Laravel work, external services and credentials needed |
| `docs/DESIGN.md` | The design language and the rules behind it |
| `.env.example` | Every environment variable, with notes |

---

## Testing

```bash
npm test
```

- `src/lib/*.test.ts` — validation rules, date and duration formatting, deep-link safety.
- `src/api/errors.test.ts` — status-code mapping and member-facing error copy.
- `src/api/demo/transport.test.ts` — integration tests over the data provider through
  the real typed client, covering sign-in, sermons, Ask the Sermon, access codes,
  enrolment and progress, quizzes, events, prayer privacy, giving states and search.
- `src/components/ui/*.test.tsx` — rendering and interaction for the state and form
  primitives.

React Native Testing Library 14 is asynchronous: `render` and `fireEvent` return
promises, so tests `await` them (see `src/test-utils/render.tsx`).

---

## Security notes

- No payment, AI or messaging credentials exist in this app. Only `EXPO_PUBLIC_*`
  values are bundled, and all of them are public by definition.
- Payments are initiated and verified by the backend. The app opens the provider's
  hosted checkout page and then asks the server for the verified status; a returning
  browser is never treated as proof of payment.
- Deep links from push payloads and announcements are checked against an allowlist
  before they reach the router (`src/lib/deep-links.ts`).
- Prayer requests are treated as sensitive: only the member's own requests are
  fetched, and they never appear in search, feeds or notifications to other members.
