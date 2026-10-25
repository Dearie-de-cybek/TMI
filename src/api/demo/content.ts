/**
 * Development/demo content.
 *
 * Everything here is sample material written for development and for exercising
 * the interface without the Laravel backend. It is NOT TwainMan Ministry content:
 * speaker names, sermons, courses and groups are placeholders, the media URLs
 * are public test files, and the app shows a persistent demo notice whenever
 * this provider is active.
 *
 * Shapes match the wire format in `api/schemas.ts` (snake_case) so the demo
 * provider and the HTTP transport are interchangeable.
 */

/** Minutes/days relative to app start, so events are always sensibly placed. */
const now = Date.now();
const DAY = 86_400_000;

function at(offsetDays: number, hour = 10, minute = 0): string {
  const date = new Date(now + offsetDays * DAY);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

/**
 * Public test media. Replace with church-supplied files in a real deployment.
 * One sermon deliberately points at an unreachable file so the player's error
 * and recovery paths can be exercised.
 */
const MEDIA = {
  audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  audioAlt: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  audioBroken: 'https://demo.twainman.invalid/missing-sermon-audio.mp3',
  video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
} as const;

type DemoSpeaker = {
  id: string;
  name: string;
  role: string | null;
  avatar_url: string | null;
};

/**
 * The ministry's own people. Patrick Evbomoen and Happy Evbomoen are real;
 * nothing here invents a third name or a title nobody gave us.
 */
export const demoSpeakers: DemoSpeaker[] = [
  {
    id: 'sp-1',
    name: 'Pastor Patrick Evbomoen',
    role: 'Lead Pastor',
    avatar_url: 'asset:pastorPatrickPortrait',
  },
  { id: 'sp-2', name: 'Happy Evbomoen', role: null, avatar_url: null },
  { id: 'sp-3', name: 'Guest Minister', role: null, avatar_url: null },
];

export const demoSeries = [
  { id: 'se-1', title: 'The Shape of Mercy', sermon_count: 4 },
  { id: 'se-2', title: 'Letters to a Young Church', sermon_count: 3 },
] as const;

type DemoSermon = {
  id: string;
  title: string;
  speaker: DemoSpeaker;
  series?: (typeof demoSeries)[number];
  preached_at: string;
  summary: string;
  description: string;
  topics: string[];
  scripture_references: string[];
  artwork_url: string | null;
  audio: { url: string; duration_seconds: number; kind: 'progressive' } | null;
  video: { url: string; duration_seconds: number; kind: 'progressive' } | null;
  has_transcript: boolean;
  has_study_notes: boolean;
  ask_enabled: boolean;
};

export const demoSermons: DemoSermon[] = [
  {
    id: 'sm-1',
    title: 'Mercy That Interrupts',
    speaker: demoSpeakers[0],
    series: demoSeries[0],
    preached_at: at(-3, 9, 30),
    summary:
      'Mercy in Scripture is rarely tidy. It interrupts a plan, a prejudice, or a schedule — and asks us to stay.',
    description:
      'Opening the series on mercy, we read the parable of the Samaritan traveller slowly, paying attention to what each passer-by was on their way to do. Mercy is not an emotion we wait to feel; it is a decision to be interrupted.',
    topics: ['Mercy', 'Discipleship'],
    scripture_references: ['Luke 10:25-37', 'Micah 6:8'],
    artwork_url: 'asset:congregationBanner',
    audio: { url: MEDIA.audio, duration_seconds: 2_280, kind: 'progressive' },
    video: { url: MEDIA.video, duration_seconds: 2_280, kind: 'progressive' },
    has_transcript: true,
    has_study_notes: true,
    ask_enabled: true,
  },
  {
    id: 'sm-2',
    title: 'The Long Obedience of Small Rooms',
    speaker: demoSpeakers[1],
    series: demoSeries[0],
    preached_at: at(-10, 9, 30),
    summary:
      'Faithfulness is mostly unobserved. What we practise where no one is watching becomes what we are.',
    description:
      'A study of the hidden years in the lives of Moses, David and Jesus, and what they suggest about seasons that feel like waiting.',
    topics: ['Faithfulness', 'Prayer'],
    scripture_references: ['Exodus 3:1-6', 'Luke 2:51-52'],
    artwork_url: 'asset:pastorPatrick',
    audio: { url: MEDIA.audioAlt, duration_seconds: 1_920, kind: 'progressive' },
    video: null,
    has_transcript: true,
    has_study_notes: true,
    ask_enabled: true,
  },
  {
    id: 'sm-3',
    title: 'What the Church Is For',
    speaker: demoSpeakers[0],
    series: demoSeries[1],
    preached_at: at(-17, 9, 30),
    summary: 'Paul writes to a young congregation about belonging before behaviour.',
    description:
      'The first of three studies in Paul’s letters to young churches, asking what a congregation is actually for when the novelty has worn off.',
    topics: ['Church', 'Community'],
    scripture_references: ['1 Corinthians 12:12-27'],
    artwork_url: null,
    audio: { url: MEDIA.audio, duration_seconds: 2_040, kind: 'progressive' },
    video: null,
    has_transcript: false,
    has_study_notes: true,
    ask_enabled: false,
  },
  {
    id: 'sm-4',
    title: 'Grief Is Not a Detour',
    speaker: demoSpeakers[2],
    preached_at: at(-24, 9, 30),
    summary: 'Lament is a form of faith, and the Psalms teach us its grammar.',
    description:
      'A pastoral teaching on lament for members walking through loss, with practical guidance on praying the Psalms.',
    topics: ['Lament', 'Pastoral care'],
    scripture_references: ['Psalm 13', 'John 11:32-36'],
    artwork_url: null,
    // Deliberately unreachable so the player's error and retry paths are testable.
    audio: { url: MEDIA.audioBroken, duration_seconds: 1_680, kind: 'progressive' },
    video: null,
    has_transcript: false,
    has_study_notes: false,
    ask_enabled: false,
  },
  {
    id: 'sm-5',
    title: 'Money, Honestly',
    speaker: demoSpeakers[1],
    preached_at: at(-31, 9, 30),
    summary: 'Generosity is a spiritual discipline before it is a budget line.',
    description:
      'A teaching on the place of money in discipleship, covering giving, debt and contentment without guilt or spectacle.',
    topics: ['Generosity', 'Stewardship'],
    scripture_references: ['2 Corinthians 9:6-11', 'Luke 12:13-21'],
    artwork_url: null,
    audio: null,
    video: null,
    has_transcript: false,
    has_study_notes: false,
    ask_enabled: false,
  },
  {
    id: 'sm-6',
    title: 'Mercy and the Enemy',
    speaker: demoSpeakers[0],
    series: demoSeries[0],
    preached_at: at(-38, 9, 30),
    summary: 'The hardest mercy is the one we owe someone who has not earned it.',
    description:
      'Third in the mercy series: forgiveness, boundaries and the difference between reconciliation and pretending.',
    topics: ['Mercy', 'Forgiveness'],
    scripture_references: ['Matthew 5:43-48', 'Romans 12:17-21'],
    artwork_url: null,
    audio: { url: MEDIA.audioAlt, duration_seconds: 2_160, kind: 'progressive' },
    video: null,
    has_transcript: false,
    has_study_notes: true,
    ask_enabled: false,
  },
  {
    id: 'sm-7',
    title: 'Letters to a Young Church: On Leaders',
    speaker: demoSpeakers[1],
    series: demoSeries[1],
    preached_at: at(-45, 9, 30),
    summary: 'What a congregation owes its leaders, and what leaders owe the congregation.',
    description: 'Second study in the series, on Paul’s instructions about leadership and trust.',
    topics: ['Church', 'Leadership'],
    scripture_references: ['1 Thessalonians 5:12-13', '1 Peter 5:1-4'],
    artwork_url: null,
    audio: { url: MEDIA.audio, duration_seconds: 1_800, kind: 'progressive' },
    video: null,
    has_transcript: false,
    has_study_notes: false,
    ask_enabled: false,
  },
  {
    id: 'sm-8',
    title: 'Sabbath for People Who Cannot Stop',
    speaker: demoSpeakers[2],
    preached_at: at(-52, 9, 30),
    summary: 'Rest is commanded, not earned — and that is harder than it sounds.',
    description: 'A teaching on sabbath practice for members in demanding work.',
    topics: ['Rest', 'Discipleship'],
    scripture_references: ['Deuteronomy 5:12-15', 'Mark 2:27'],
    artwork_url: null,
    audio: { url: MEDIA.audioAlt, duration_seconds: 1_740, kind: 'progressive' },
    video: null,
    has_transcript: false,
    has_study_notes: false,
    ask_enabled: false,
  },
];

export const demoTranscripts: Record<
  string,
  { segments: { start_seconds: number; speaker?: string; text: string }[] }
> = {
  'sm-1': {
    segments: [
      {
        start_seconds: 0,
        speaker: 'Pastor Patrick Evbomoen',
        text: 'Turn with me to Luke chapter ten. A man asks Jesus a legal question and receives a story in reply, which is often how it goes.',
      },
      {
        start_seconds: 42,
        text: 'Notice first that the priest and the Levite are not villains in this parable. They are busy. They are on their way to something that matters.',
      },
      {
        start_seconds: 118,
        text: 'Mercy, in Scripture, almost always arrives as an interruption. It is the thing that was not on the schedule.',
      },
      {
        start_seconds: 206,
        text: 'The Samaritan does four ordinary things: he looks, he crosses the road, he spends his own money, and he comes back. None of that is spectacular. All of it is costly.',
      },
      {
        start_seconds: 331,
        text: 'So the question the parable leaves us with is not "who is my neighbour". It is "what am I willing to be interrupted by".',
      },
      {
        start_seconds: 455,
        text: 'Let me suggest three places this lands this week: your street, your family, and the person at work you have quietly written off.',
      },
    ],
  },
  'sm-2': {
    segments: [
      {
        start_seconds: 0,
        speaker: 'Happy Evbomoen',
        text: 'Moses spends forty years in Pharaoh’s house and forty years with sheep, and Scripture gives one of those periods a single verse.',
      },
      {
        start_seconds: 64,
        text: 'We tend to read hidden years as wasted years. The text does not read them that way.',
      },
      {
        start_seconds: 150,
        text: 'What you practise where no one is watching is what you will be when everyone is.',
      },
      {
        start_seconds: 260,
        text: 'Small rooms are where obedience is formed: the prayer nobody hears, the work nobody praises, the promise nobody checks.',
      },
    ],
  },
};

export const demoStudyNotes: Record<
  string,
  {
    generated_by: 'ai' | 'ministry_team';
    review_status: 'unreviewed' | 'approved';
    summary: string;
    key_points: string[];
    scriptures: { reference: string; text?: string }[];
    applications: string[];
    reflection_questions: string[];
  }
> = {
  'sm-1': {
    generated_by: 'ai',
    review_status: 'approved',
    summary:
      'Working from Luke 10, the teaching argues that mercy in Scripture is characteristically an interruption rather than a feeling, and that the parable’s passers-by are portrayed as busy rather than wicked.',
    key_points: [
      'The priest and Levite are depicted as occupied, not malicious — proximity to religious duty did not produce mercy.',
      'The Samaritan’s response is made of four ordinary, costly actions: looking, crossing, paying and returning.',
      'The parable reframes the lawyer’s question from "who qualifies as my neighbour" to "what will I allow to interrupt me".',
    ],
    scriptures: [
      { reference: 'Luke 10:25-37' },
      { reference: 'Micah 6:8', text: 'To act justly, to love mercy, and to walk humbly with your God.' },
    ],
    applications: [
      'Name one interruption this week you would normally route around.',
      'Decide in advance what you are willing to spend — time or money — when mercy costs something.',
    ],
    reflection_questions: [
      'Where has busyness become a respectable reason not to stop?',
      'Who have you quietly placed outside the category of neighbour?',
      'What would “coming back” look like in a situation you have already helped with once?',
    ],
  },
  'sm-2': {
    generated_by: 'ai',
    review_status: 'unreviewed',
    summary:
      'A study of the unrecorded years in the lives of Moses, David and Jesus, proposing that formation happens in unobserved seasons.',
    key_points: [
      'Scripture compresses long formative periods into very few verses.',
      'Hidden seasons are presented as preparation, not delay.',
      'Private practice determines public character.',
    ],
    scriptures: [{ reference: 'Exodus 3:1-6' }, { reference: 'Luke 2:51-52' }],
    applications: ['Choose one unobserved practice to keep for the next month.'],
    reflection_questions: [
      'What are you practising that no one can see?',
      'Which season of your life have you written off as wasted?',
    ],
  },
};

export const demoDevotionals = [
  {
    id: 'dv-1',
    date: at(0, 5),
    title: 'Enough for Today',
    scripture_reference: 'Matthew 6:11',
    scripture_text: 'Give us this day our daily bread.',
    body: 'The prayer is for today. Not for the quarter, not for the five-year plan. Daily bread is a discipline of trust as much as a request for provision — it asks us to come back tomorrow.',
    author: null,
  },
];

export const demoEvents = [
  {
    id: 'ev-1',
    title: 'Blessing the Work of Your Hands',
    starts_at: at(2, 8, 0),
    ends_at: at(2, 11, 0),
    timezone: 'Africa/Lagos',
    format: 'in_person' as const,
    venue_name: 'TwainMan Ministry International',
    address: 'Ambrose Omafuvwe Street, opposite Building Material Market, OKP Road, Asaba',
    online_url: 'https://meet.google.com/sample-kh-study',
    description:
      'Our monthly service of consecration for the work of our hands, every second Sunday at 8:00am. Ministering: Pastor Patrick Evbomoen. Bring something that represents your work.',
    artwork_url: 'asset:eventBlessingTheWork',
    organizer: 'TwainMan Ministry International',
    registration: {
      required: false,
      open: true,
      capacity: null,
      registered_count: null,
      my_status: 'none' as const,
    },
    replay_url: null,
  },
  {
    id: 'ev-2',
    title: 'Membership Class',
    starts_at: at(9, 9, 0),
    ends_at: at(9, 13, 0),
    timezone: 'Africa/Lagos',
    format: 'in_person' as const,
    venue_name: 'TwainMan Ministry International',
    address: 'Ambrose Omafuvwe Street, opposite Building Material Market, OKP Road, Asaba',
    online_url: null,
    description:
      'A half-day introduction to the life and commitments of the congregation. Registration is required because seating and materials are limited.',
    artwork_url: null,
    organizer: 'Membership Team',
    registration: {
      required: true,
      open: true,
      capacity: 40,
      registered_count: 31,
      my_status: 'none' as const,
    },
    replay_url: null,
  },
  {
    id: 'ev-3',
    title: 'Night of Prayer',
    starts_at: at(16, 21, 0),
    ends_at: at(17, 0, 30),
    timezone: 'Africa/Lagos',
    format: 'online' as const,
    venue_name: null,
    address: null,
    online_url: 'https://meet.google.com/sample-kh-prayer',
    description: 'An online vigil. Join for as much of it as you are able.',
    artwork_url: null,
    organizer: 'Prayer Ministry',
    registration: {
      required: true,
      open: true,
      capacity: null,
      registered_count: 184,
      my_status: 'none' as const,
    },
    replay_url: null,
  },
  {
    id: 'ev-4',
    title: 'Gethsemane Camp Meeting',
    starts_at: at(-6, 8, 0),
    ends_at: at(-6, 14, 0),
    timezone: 'Africa/Lagos',
    format: 'in_person' as const,
    venue_name: 'TwainMan Ministry International',
    address: 'Ambrose Omafuvwe Street, opposite Building Material Market, OKP Road, Asaba',
    online_url: null,
    description:
      'Thank you to everyone who came. Recordings from the camp meeting are being edited and will appear in the sermon library.',
    artwork_url: 'asset:pastorPatrick',
    organizer: 'TwainMan Ministry International',
    registration: {
      required: false,
      open: false,
      capacity: null,
      registered_count: null,
      my_status: 'none' as const,
    },
    replay_url: null,
  },
];

export const demoAnnouncements = [
  {
    id: 'an-1',
    title: 'Midweek study moves to the Main Hall',
    published_at: at(-1, 8),
    excerpt: 'From this week the Wednesday study is in the Main Hall to make room for the discussion groups.',
    body: 'From this week the Wednesday study moves from the Upper Room to the Main Hall. The online stream link is unchanged. Discussion groups will meet in the side rooms immediately after the teaching.',
    scope: { type: 'church' as const, name: null },
    pinned: true,
    link: '/events/ev-1',
  },
  {
    id: 'an-2',
    title: 'Membership class registration is open',
    published_at: at(-2, 8),
    excerpt: 'Seats are limited to forty. Registration closes once the cohort is full.',
    body: 'Registration for the spring membership cohort is now open. The class runs as a single half-day session and includes lunch. Seats are limited to forty.',
    scope: { type: 'church' as const, name: null },
    pinned: false,
    link: '/events/ev-2',
  },
  {
    id: 'an-3',
    title: 'Foundations of Faith: week three materials posted',
    published_at: at(-4, 8),
    excerpt: 'The reading for week three is available in your course materials.',
    body: 'The week three reading and worksheet are now in the course materials for Foundations of Faith. Please read before Thursday’s live session.',
    scope: { type: 'course' as const, name: 'Foundations of Faith' },
    pinned: false,
    link: '/courses/co-1',
  },
  {
    id: 'an-4',
    title: 'Mercy Ministry needs drivers on Saturdays',
    published_at: at(-8, 8),
    excerpt: 'Two drivers are needed for the Saturday delivery round.',
    body: 'The mercy ministry is looking for two members with a vehicle who can help with Saturday deliveries, once a month. Speak to the ministry lead or use the contact link in the group page.',
    scope: { type: 'ministry' as const, name: 'Mercy Ministry' },
    pinned: false,
    link: '/community/gr-2',
  },
  {
    id: 'an-5',
    title: 'Giving receipts for last quarter are available',
    published_at: at(-14, 8),
    excerpt: 'Receipts are in your giving history.',
    body: 'Receipts for the last quarter have been issued and appear in your giving history. Contact the finance team if anything looks wrong.',
    scope: { type: 'church' as const, name: null },
    pinned: false,
    link: '/giving/history',
  },
];

export const demoPrograms = [
  {
    id: 'pr-1',
    title: 'Discipleship Pathway',
    summary: 'Three courses taken in order, from first steps to leading a group.',
    artwork_url: null,
    course_count: 2,
  },
  {
    id: 'pr-2',
    title: 'Bible Literacy',
    summary: 'Short courses on reading Scripture well.',
    artwork_url: null,
    course_count: 1,
  },
];

type DemoCourse = {
  id: string;
  program_id: string;
  title: string;
  summary: string;
  description: string;
  artwork_url: string | null;
  instructors: DemoSpeaker[];
  starts_at: string | null;
  ends_at: string | null;
  enrollment_mode: 'open' | 'code_required' | 'closed' | 'invite_only';
  requirements: string[];
  cohort: { id: string; name: string; starts_at: string | null } | null;
  whatsapp_group_url: string | null;
  whatsapp_group_name: string | null;
};

export const demoCourses: DemoCourse[] = [
  {
    id: 'co-1',
    program_id: 'pr-1',
    title: 'Foundations of Faith',
    summary: 'An eight-week introduction to Christian belief and practice.',
    description:
      'Foundations of Faith covers the gospel, Scripture, prayer, the church and mission over eight weeks, with a live session each Thursday and a short reading between sessions.',
    artwork_url: null,
    instructors: [demoSpeakers[0]],
    starts_at: at(-21, 18),
    ends_at: at(35, 19, 30),
    enrollment_mode: 'open',
    requirements: ['A Bible in any translation', 'About 30 minutes of reading each week'],
    cohort: { id: 'ch-1', name: 'Spring cohort', starts_at: at(-21, 18) },
    whatsapp_group_url: 'https://chat.whatsapp.com/sample-foundations-group',
    whatsapp_group_name: 'Foundations — TwainMan cohort',
  },
  {
    id: 'co-2',
    program_id: 'pr-1',
    title: 'Leading a Small Group',
    summary: 'For members preparing to lead a cell or fellowship group.',
    description:
      'A practical course on facilitating discussion, pastoral boundaries, and preparing a study. Requires an access code issued by the discipleship team.',
    artwork_url: null,
    instructors: [demoSpeakers[2]],
    starts_at: at(14, 18),
    ends_at: at(56, 19, 30),
    enrollment_mode: 'code_required',
    requirements: ['Completion of Foundations of Faith', 'An access code from the discipleship team'],
    cohort: { id: 'ch-2', name: 'Leaders cohort 4', starts_at: at(14, 18) },
    whatsapp_group_url: null,
    whatsapp_group_name: null,
  },
  {
    id: 'co-3',
    program_id: 'pr-2',
    title: 'Reading the Psalms',
    summary: 'Four weeks on Hebrew poetry, lament and praise.',
    description:
      'A short course on the shape of the Psalter, how lament works, and how to pray the Psalms in ordinary weeks.',
    artwork_url: null,
    instructors: [demoSpeakers[1]],
    starts_at: null,
    ends_at: null,
    enrollment_mode: 'closed',
    requirements: [],
    cohort: null,
    whatsapp_group_url: null,
    whatsapp_group_name: null,
  },
];

type DemoLesson = {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  position: number;
  kind: 'reading' | 'video' | 'audio' | 'quiz' | 'assignment' | 'live';
  duration_minutes: number | null;
  body?: string;
  media?: { url: string; duration_seconds: number; kind: 'progressive' };
  quiz_id?: string;
};

export const demoModules = [
  { id: 'mo-1', course_id: 'co-1', title: 'Week 1 — The Gospel', position: 1, summary: null },
  { id: 'mo-2', course_id: 'co-1', title: 'Week 2 — Scripture', position: 2, summary: null },
  { id: 'mo-3', course_id: 'co-2', title: 'Module 1 — Facilitating', position: 1, summary: null },
];

export const demoLessons: DemoLesson[] = [
  {
    id: 'ls-1',
    module_id: 'mo-1',
    course_id: 'co-1',
    title: 'What the gospel is, and is not',
    position: 1,
    kind: 'reading',
    duration_minutes: 12,
    body: 'The word translated "gospel" meant an announcement before it meant a religion: news that something had happened which changed the situation. Before you read further, write down in one sentence what you would say the gospel is.\n\nPaul summarises it in 1 Corinthians 15 as an event with witnesses: Christ died, was buried, was raised, and was seen. Notice that the summary is not primarily advice. It is a report.\n\nThat matters for how we hold it. Advice can be improved on. News can only be received, examined, and trusted or not.',
  },
  {
    id: 'ls-2',
    module_id: 'mo-1',
    course_id: 'co-1',
    title: 'Live session — Q&A on week one',
    position: 2,
    kind: 'live',
    duration_minutes: 60,
  },
  {
    id: 'ls-3',
    module_id: 'mo-1',
    course_id: 'co-1',
    title: 'Week one check',
    position: 3,
    kind: 'quiz',
    duration_minutes: 5,
    quiz_id: 'qz-1',
  },
  {
    id: 'ls-4',
    module_id: 'mo-2',
    course_id: 'co-1',
    title: 'How to read a letter',
    position: 1,
    kind: 'reading',
    duration_minutes: 10,
    body: 'Most of the New Testament is correspondence, written to particular people about particular problems. Reading a letter well starts with asking who it was for.\n\nTry this with Philippians: read it in one sitting, and note every time Paul mentions joy and every time he mentions his imprisonment. The two sit side by side more often than is comfortable.',
  },
  {
    id: 'ls-5',
    module_id: 'mo-2',
    course_id: 'co-1',
    title: 'Teaching video — Scripture in the early church',
    position: 2,
    kind: 'video',
    duration_minutes: 18,
    media: { url: MEDIA.video, duration_seconds: 1_080, kind: 'progressive' },
  },
  {
    id: 'ls-6',
    module_id: 'mo-3',
    course_id: 'co-2',
    title: 'Asking a second question',
    position: 1,
    kind: 'reading',
    duration_minutes: 14,
    body: 'The difference between a group that talks and a group that thinks is usually the second question. This lesson covers four kinds of follow-up and when each is useful.',
  },
];

export const demoMaterials = [
  {
    id: 'ma-1',
    course_id: 'co-1',
    title: 'Week 1 worksheet',
    kind: 'pdf' as const,
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size_bytes: 13_264,
  },
  {
    id: 'ma-2',
    course_id: 'co-1',
    title: 'Recommended reading list',
    kind: 'link' as const,
    url: 'https://example.org/twainman/reading-list',
    size_bytes: null,
  },
];

export const demoQuizzes = [
  {
    id: 'qz-1',
    lesson_id: 'ls-3',
    title: 'Week one check',
    instructions: 'Three questions on the week one reading. You may retake this twice.',
    passing_score: 67,
    attempts_allowed: 3,
    questions: [
      {
        id: 'qq-1',
        prompt: 'In 1 Corinthians 15, Paul summarises the gospel primarily as…',
        kind: 'single' as const,
        options: [
          { id: 'qo-1', label: 'A set of moral instructions' },
          { id: 'qo-2', label: 'An announcement of events with witnesses' },
          { id: 'qo-3', label: 'A philosophy of life' },
        ],
        correct: ['qo-2'],
        explanation: 'Paul lists death, burial, resurrection and appearances — a report, not advice.',
      },
      {
        id: 'qq-2',
        prompt: 'Which of these are described in the reading as ways to hold news rather than advice?',
        kind: 'multiple' as const,
        options: [
          { id: 'qo-4', label: 'Receive it' },
          { id: 'qo-5', label: 'Improve on it' },
          { id: 'qo-6', label: 'Examine it' },
        ],
        correct: ['qo-4', 'qo-6'],
        explanation: 'News can be received or examined; advice is what can be improved on.',
      },
      {
        id: 'qq-3',
        prompt: 'The reading asks you to write down one sentence. About what?',
        kind: 'single' as const,
        options: [
          { id: 'qo-7', label: 'Your testimony' },
          { id: 'qo-8', label: 'What you would say the gospel is' },
          { id: 'qo-9', label: 'A prayer request' },
        ],
        correct: ['qo-8'],
        explanation: null,
      },
    ],
  },
];

export const demoLiveSessions = [
  {
    id: 'lv-1',
    course_id: 'co-1',
    title: 'Foundations — Week 3 live session',
    starts_at: at(3, 18, 0),
    ends_at: at(3, 19, 0),
    timezone: 'Africa/Lagos',
    join_url: 'https://meet.google.com/sample-kh-foundations',
    recording_url: null,
    attendance: 'unknown' as const,
  },
  {
    id: 'lv-2',
    course_id: 'co-1',
    title: 'Foundations — Week 2 live session',
    starts_at: at(-4, 18, 0),
    ends_at: at(-4, 19, 0),
    timezone: 'Africa/Lagos',
    join_url: null,
    recording_url: MEDIA.video,
    attendance: 'present' as const,
  },
];

export const demoGroups = [
  {
    id: 'gr-1',
    name: 'Worship Ministry',
    type: 'ministry' as const,
    summary: 'Singers, instrumentalists and the sound team.',
    description:
      'The worship ministry serves at both Sunday gatherings and the midweek study. New members join after a conversation with the ministry lead and a short audition for instrumentalists.',
    artwork_url: null,
    meeting_schedule: 'Rehearsals Fridays, 18:00',
    meeting_location: 'Main Hall',
    requirements: 'Conversation with the ministry lead',
    leader_name: 'Happy Evbomoen',
    member_count: 24,
    communication_url: 'https://chat.whatsapp.com/sample-worship-group',
  },
  {
    id: 'gr-2',
    name: 'Mercy Ministry',
    type: 'ministry' as const,
    summary: 'Food distribution, hospital visits and practical help.',
    description:
      'The mercy ministry runs the monthly food drive and a visiting rota. Drivers and visitors are both needed.',
    artwork_url: null,
    meeting_schedule: 'Second Saturday, 08:00',
    meeting_location: 'Church car park',
    requirements: null,
    leader_name: 'Pastor Patrick Evbomoen',
    member_count: 18,
    communication_url: null,
  },
  {
    id: 'gr-3',
    name: 'Okpanam Road Cell Group',
    type: 'cell' as const,
    summary: 'Midweek home fellowship for members along Okpanam Road.',
    description:
      'A home group of about a dozen members meeting on Tuesday evenings, following the midweek study material.',
    artwork_url: null,
    meeting_schedule: 'Tuesdays, 19:00',
    meeting_location: 'Member homes, Asaba',
    requirements: null,
    leader_name: null,
    member_count: 12,
    communication_url: null,
  },
  {
    id: 'gr-4',
    name: 'Young Adults Fellowship',
    type: 'fellowship' as const,
    summary: 'Members in their twenties and thirties.',
    description: 'Monthly gathering with teaching, a shared meal and discussion.',
    artwork_url: null,
    meeting_schedule: 'Last Sunday of the month, 16:00',
    meeting_location: 'Upper Room',
    requirements: null,
    leader_name: null,
    member_count: 46,
    communication_url: null,
  },
];

export const demoGivingCategories = [
  {
    id: 'gc-1',
    name: 'Tithe',
    description: 'Regular giving to the general work of the church.',
    currency: 'NGN',
    suggested_amounts: [500_000, 1_000_000, 2_500_000],
    minimum_amount: 10_000,
    recurring_supported: true,
  },
  {
    id: 'gc-2',
    name: 'Offering',
    description: null,
    currency: 'NGN',
    suggested_amounts: [100_000, 200_000, 500_000],
    minimum_amount: 10_000,
    recurring_supported: false,
  },
  {
    id: 'gc-3',
    name: 'Mercy Fund',
    description: 'Food distribution and emergency help for members in need.',
    currency: 'NGN',
    suggested_amounts: [200_000, 500_000],
    minimum_amount: 50_000,
    recurring_supported: true,
  },
  {
    id: 'gc-4',
    name: 'Building Project',
    description: 'The Main Hall extension.',
    currency: 'NGN',
    suggested_amounts: [1_000_000, 5_000_000],
    minimum_amount: 100_000,
    recurring_supported: true,
  },
];

export const demoPastoralCare = {
  contacts: [
    {
      id: 'pc-1',
      label: 'Pastoral care line',
      description: 'For urgent pastoral needs, including hospital visits.',
      kind: 'phone' as const,
      value: '+2348000000000',
      availability: 'Daily, 08:00–20:00',
    },
    {
      id: 'pc-2',
      label: 'Prayer team email',
      description: 'Requests are read by the prayer team only.',
      kind: 'email' as const,
      value: 'prayer@twainman.example',
      availability: null,
    },
    {
      id: 'pc-3',
      label: 'Counselling appointment',
      description: 'Book a confidential conversation with a member of the pastoral team.',
      kind: 'form' as const,
      value: 'https://example.org/twainman/counselling',
      availability: 'Appointments on Tuesdays and Thursdays',
    },
  ],
  confidentiality_note:
    'Requests marked for the pastoral team are read by the pastoral team. The church’s full privacy policy explains how long they are kept.',
};

export const demoInterests = [
  'Bible study',
  'Prayer',
  'Worship',
  'Youth',
  'Marriage and family',
  'Mercy and outreach',
  'Leadership',
  'Discipleship',
];

export type DemoMemberRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  joined_at: string;
  email_verified: boolean;
  phone_verified: boolean;
  interests: string[];
  city: string | null;
};

export const demoMember: DemoMemberRecord = {
  id: 'me-1',
  name: 'Demo Member',
  email: 'member@demo.twainman',
  phone: null,
  avatar_url: null,
  joined_at: at(-400),
  email_verified: true,
  phone_verified: false,
  interests: ['Bible study', 'Prayer'],
  city: 'Asaba',
};

/**
 * Access codes the demo provider accepts. A real deployment validates and
 * consumes codes on the server; this table only exists so the client-side
 * states (valid, expired, already used, wrong course) can be exercised.
 */
export const demoAccessCodes: Record<
  string,
  { course_id: string; state: 'valid' | 'expired' | 'used' | 'ineligible' }
> = {
  'KH-LEAD-2026': { course_id: 'co-2', state: 'valid' },
  'KH-LEAD-OLD1': { course_id: 'co-2', state: 'expired' },
  'KH-LEAD-USED': { course_id: 'co-2', state: 'used' },
  'KH-FOUND-123': { course_id: 'co-1', state: 'ineligible' },
};

export const demoMediaUrls = MEDIA;
