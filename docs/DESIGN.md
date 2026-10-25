# The TwainMan Ministry design language

The app should read like a thoughtfully made Christian publication, not a dashboard.
Everything below is enforced by `src/design/tokens.ts` and the primitives in
`src/components/ui/`; this document explains the reasoning so later work stays
coherent.

## The idea

The church's own colours: a deep aubergine **purple** for the ministry's voice and
warm **gold** for the small marks that organise a page, on a warm ivory ground.
Hierarchy comes from **type and space**, not from boxes — with one addition:
colour also divides a long page into bands you can feel without reading. The result should feel closer to a well-set book than to a
product dashboard.

## Colour

| Role | Light | Dark | Used for |
| --- | --- | --- | --- |
| `background` | `#F8F5F0` ivory | `#15101A` plum-ink | The page |
| `surface` | `#FFFDF9` | `#1E1726` | Reading surfaces, sheets |
| `surfaceMuted` | `#F0EAF0` | `#2A2133` | Tonal grouping without a border |
| `surfaceInverse` | `#241430` plum | `#2E2039` raised plum | Player, featured plate, live strip, toast |
| `primary` | `#4A2A5A` purple | `#C4A5D6` lilac | The ministry voice: primary actions, active tab |
| `accent` | `#9A762F` gold | `#D9B463` | Eyebrows, Scripture marks, the active-tab indicator |
| `accentFill` | `#C19A38` gold | `#D9B463` | Gold as a filled control — the play button |
| `bandPrimary` | `#F3EDF6` | `#221A2B` | Section ground: formation |
| `bandAccent` | `#FAF4E6` | `#241E14` | Section ground: Scripture |
| `bandNeutral` | `#F0EAF0` | `#1B1622` | Section ground: notices |
| `danger` / `success` / `warning` | clay / moss / amber | — | Status only |

Dark mode is **designed, not inverted**: a plum-ink ground with a lighter lilac
primary, because the deep purple loses contrast on dark. The plum plate is purple
in *both* schemes — strong contrast by day, a raised panel at night — because a
white slab in a dark room is not a reading app. Both schemes are declared
independently, and a compile-time check keeps their key sets identical.

### Colour as division

Home is a long page of unrelated things, so the ground changes underneath each
part — and the tone carries meaning rather than alternating for decoration:

| Band | Holds |
| --- | --- |
| gold (`bandAccent`) | Scripture and the daily reading |
| purple (`bandPrimary`) | formation: your courses, and prayer |
| ivory (`page`) | the life of the house: what is on |
| neutral (`bandNeutral`) | notices |

The tints sit a hair above 1.05:1 against the page — you feel the change of
section without ever being asked to look at it. Neighbouring bands never repeat a
tone, or the division disappears. `components/ui/band.tsx` is the only way to
draw one.

Dark mode is **designed, not inverted**: a warm ink ground with a lighter sage
primary, because the deep forest loses contrast on dark. Both schemes are declared
independently in `colors`, and a compile-time check keeps their key sets identical.

No purple-to-blue tech gradients, no glassmorphism, no decorative blobs. The
only gradients in the app are photographic scrims, bottom-weighted so overlaid
type clears contrast while the picture keeps its light.

## Type

Two faces, each with a job.

- **Fraunces** (serif) — display, titles, headlines, Scripture, pull quotes. It carries
  the editorial character.
- **Inter** (sans) — navigation, body copy, controls, metadata. It carries the
  information.

The ramp lives in `typeScale`: `display, title, headline, scripture, quote, eyebrow,
bodyLarge, body, bodyStrong, label, labelStrong, meta, metaStrong, caption, tab`.
Every string in the app renders through `<Text variant=…>`, so nothing invents a size.

**Eyebrows** — 11px Inter SemiBold, uppercase, 1.1 tracking, gold — sit above section
titles and give the app much of its voice.

Font scaling is always on. Compact chrome (tab labels, badges, eyebrows) caps the
multiplier at 1.4 so those layouts survive the largest accessibility sizes; reading
screens scale without a cap.

## Shape and structure

- **Corners are tight.** `radius.sm` is 4pt and is the default for buttons, chips and
  plates. Avatars are the only circles. There are no pill-shaped controls.
- **Hairlines instead of cards.** Lists are separated by 1px rules (`<Rule />`), inset
  to the gutter. Cards are used only where a block genuinely is a separate object: the
  Scripture plate, the audio player, banners.
- **One gutter.** `space.gutter` (20pt) is the horizontal inset everywhere, so
  everything aligns down the page.
- **One full-bleed moment per screen.** The featured sermon on Home is allowed to be
  big; nothing else competes with it.

### Recurring patterns

| Pattern | Where | Why it is not a card |
| --- | --- | --- |
| Section head: gold eyebrow → serif title on a rule | Home, Discover, detail screens | Reads as a chapter opening |
| Content row: optional artwork, eyebrow, title, metadata | Sermons, courses, groups | Scannable, no wasted frame |
| Date plate: serif day number over month | Events | The date is what members scan for |
| Numbered item: gold `01` beside the text | Welcome, study notes | Editorial list, not bullets |
| Inverted plate | Player, featured sermon, live strip | Marks "an instrument", not content |

## Photographs, and generated art

The church's own photographs do the emotional work. They are the first thing a
member meets on the welcome screen, and they carry the featured teaching on Home.
They live in `assets/images/church/`, resized from the originals into the sizes
the app actually displays, and are referenced from data as `asset:<key>` so the
same field works for a URL once the backend serves one (`lib/artwork.ts`).

Where the church has supplied nothing, `ContentImage` falls back to **generated
graphic art** rather than a stock photograph: a flat, deterministic composition
in purple and gold — a tonal ground, two overlapping discs, a gold rule, and the
title's initial in Fraunces. The same course always gets the same cover, and a
list of courses reads as a set of covers instead of a row of empty frames.

No stock photography, and no fabricated ministry branding.

## Icons

Feather only, through `<Icon name=… />`, at five fixed sizes. Its 1.5px stroke matches
the hairline rules. Emoji are never used as interface icons.

## Motion

Restrained and purposeful: a press opacity change, a 160ms fade on images, a skeleton
pulse. Nothing animates on entry for decoration. `useTheme().reduceMotion` reflects the
OS setting and the member's override, and every animation checks it — the skeleton
pulse stops, image transitions become instant.

## Accessibility rules the primitives enforce

- 44pt minimum touch target on every `Pressable`, with `hitSlop` for inline links.
- Explicit `accessibilityRole` and `accessibilityState` on tabs, chips, radios,
  checkboxes, switches and the playback slider (which also exposes
  `accessibilityValue` as "6:12 of 38:00").
- Form fields are labelled, mark themselves `aria-invalid`, and announce their error
  with `accessibilityLiveRegion`.
- Decorative elements (skeletons, the fallback plate's letter) are hidden from the
  screen reader.
- Text and background pairs come from the semantic roles, which were chosen for
  contrast in both schemes.
- Forms are wrapped in `KeyboardAware`; lists use `keyboardShouldPersistTaps`.

## States are part of the design

Every list and detail screen has four designed states, not one:

- **Loading** — a skeleton shaped like the content. Full-screen spinners are reserved
  for operations with nothing to outline (sign-in, payment hand-off).
- **Empty** — copy written for that specific absence ("Nothing saved yet. Tap the
  bookmark on a sermon…"), never "no data".
- **Error** — from `describeError`, which says what happened and what to do next, and
  offers a retry only when retrying could help.
- **Offline / demo** — a persistent strip at the top of the app.

## What this language refuses

Repeating identical cards for unrelated content; every section as a carousel; giant
welcome banners; fabricated statistics, testimonials or member counts; placeholder
buttons; emoji icons; mixed icon sets; arbitrary spacing; gradient backgrounds as
identity.
