import { preferences, storageKeys } from '@/lib/storage';

import { demoMember } from './content';

/**
 * Mutable state for the development data provider.
 *
 * Kept entirely separate from anything the live API touches, under its own
 * storage key, so demo activity can never be mistaken for member data. It is
 * persisted so a demo session survives a reload, and `resetDemoState` wipes it.
 */

export type DemoNotificationRecord = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  category: 'announcement' | 'event' | 'course' | 'prayer' | 'giving' | 'sermon' | 'system';
  link: string | null;
};

export type DemoPrayerRecord = {
  id: string;
  body: string;
  visibility: 'pastoral_team' | 'prayer_team' | 'prayer_community';
  status: 'submitted' | 'in_prayer' | 'answered' | 'closed';
  created_at: string;
  is_anonymous: boolean;
  follow_ups: { id: string; body: string; created_at: string }[];
};

export type DemoGivingRecord = {
  reference: string;
  status: 'demo_not_processed';
  amount_minor: number;
  currency: string;
  category_id: string;
  category_name: string;
  recurrence: 'one_time' | 'monthly';
  created_at: string;
  idempotency_key: string | null;
};

export type DemoAskMessage = {
  id: string;
  role: 'member' | 'assistant';
  content: string;
  created_at: string;
  citations: { quote: string; start_seconds?: number | null; scripture_reference?: string | null }[];
  unanswered_reason: string | null;
};

export type DemoState = {
  version: 1;
  /** Null until the member signs in or registers inside demo mode. */
  member: typeof demoMember | null;
  savedSermonIds: string[];
  sermonProgress: Record<
    string,
    { position_seconds: number; duration_seconds: number | null; completed: boolean; updated_at: string }
  >;
  enrollments: Record<
    string,
    { id: string; status: 'active' | 'pending' | 'completed'; completedLessonIds: string[]; enrolled_at: string }
  >;
  consumedAccessCodes: string[];
  quizAttempts: Record<string, number>;
  eventRegistrations: Record<string, 'registered' | 'waitlisted' | 'cancelled'>;
  prayerRequests: DemoPrayerRecord[];
  groupMemberships: Record<string, 'none' | 'pending' | 'member'>;
  giving: DemoGivingRecord[];
  readAnnouncementIds: string[];
  notifications: DemoNotificationRecord[];
  notificationPreferences: {
    announcements: boolean;
    events: boolean;
    courses: boolean;
    prayer: boolean;
    giving: boolean;
    new_sermons: boolean;
  };
  askConversations: Record<string, DemoAskMessage[]>;
};

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function initialState(): DemoState {
  return {
    version: 1,
    member: null,
    savedSermonIds: ['sm-2'],
    sermonProgress: {
      'sm-1': {
        position_seconds: 540,
        duration_seconds: 2_280,
        completed: false,
        updated_at: minutesAgo(90),
      },
    },
    enrollments: {
      'co-1': {
        id: 'en-1',
        status: 'active',
        completedLessonIds: ['ls-1'],
        enrolled_at: minutesAgo(60 * 24 * 20),
      },
    },
    consumedAccessCodes: ['KH-LEAD-USED'],
    quizAttempts: {},
    eventRegistrations: {},
    prayerRequests: [],
    groupMemberships: { 'gr-1': 'member' },
    giving: [],
    readAnnouncementIds: [],
    notifications: [
      {
        id: 'nt-1',
        title: 'Midweek study moves to the Main Hall',
        body: 'From this week the Wednesday study is in the Main Hall.',
        created_at: minutesAgo(120),
        read: false,
        category: 'announcement',
        link: '/announcements/an-1',
      },
      {
        id: 'nt-2',
        title: 'Week 3 live session on Thursday',
        body: 'Foundations of Faith meets at 18:00. The join link is on the course page.',
        created_at: minutesAgo(60 * 20),
        read: false,
        category: 'course',
        link: '/courses/co-1',
      },
      {
        id: 'nt-3',
        title: 'New teaching: Mercy That Interrupts',
        body: 'Pastor Adaeze Nwosu, Sunday.',
        created_at: minutesAgo(60 * 72),
        read: true,
        category: 'sermon',
        link: '/sermons/sm-1',
      },
    ],
    notificationPreferences: {
      announcements: true,
      events: true,
      courses: true,
      prayer: true,
      giving: false,
      new_sermons: true,
    },
    askConversations: {},
  };
}

let state: DemoState | null = null;
let hydrating: Promise<DemoState> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function hydrate(): Promise<DemoState> {
  const stored = await preferences.getJson<DemoState>(storageKeys.demoState);
  if (stored && stored.version === 1) {
    // Merge over a fresh base so new fields added later do not break old state.
    return { ...initialState(), ...stored };
  }
  return initialState();
}

export async function getDemoState(): Promise<DemoState> {
  if (state) return state;
  hydrating ??= hydrate().then((next) => {
    state = next;
    hydrating = null;
    return next;
  });
  return hydrating;
}

/** Applies a mutation and schedules a debounced persist. */
export async function mutateDemoState<T>(mutator: (draft: DemoState) => T): Promise<T> {
  const current = await getDemoState();
  const result = mutator(current);
  schedulePersist(current);
  return result;
}

function schedulePersist(next: DemoState) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void preferences.setJson(storageKeys.demoState, next);
  }, 250);
}

export async function resetDemoState(): Promise<void> {
  state = initialState();
  await preferences.remove(storageKeys.demoState);
}

export function demoId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}
