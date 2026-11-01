import { create } from 'zustand';

import { type DevotionProgress } from '@/api/schemas';
import { preferences, storageKeys } from '@/lib/storage';

/**
 * What the member has prayed and read.
 *
 * Held on the device first. Praying happens on a bus, in a bedroom at 5am, on a
 * phone with no signal - so ticking a decree must never depend on a request
 * succeeding. When the member is signed in the store is mirrored to the backend
 * (`features/devotion/api.ts`), which is what carries it between devices.
 *
 * A "day of devotion" is any day the member prays a decree, declares the
 * confession, or reads the devotional. That single rule drives the streak.
 */

export function dayKey(date = new Date()): string {
  // Local date, not UTC: a streak is about the member's own day.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function yesterdayKey(date = new Date()): string {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return dayKey(previous);
}

/** The `YYYY-MM` period the app is currently tracking. */
export function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export type DevotionSnapshot = {
  period: string;
  prayedSectionIds: string[];
  confessionDeclaredOn: string | null;
  readDevotionalIds: string[];
  streakDays: number;
  longestStreakDays: number;
  lastActiveOn: string | null;
};

type DevotionState = DevotionSnapshot & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Called when a decree for a different month is opened. */
  setPeriod: (period: string) => void;
  markSectionPrayed: (sectionId: string) => void;
  unmarkSectionPrayed: (sectionId: string) => void;
  declareConfession: () => void;
  markDevotionalRead: (devotionalId: string) => void;
  mergeFromServer: (remote: DevotionProgress) => void;
  reset: () => Promise<void>;
};

const empty: DevotionSnapshot = {
  period: currentPeriod(),
  prayedSectionIds: [],
  confessionDeclaredOn: null,
  readDevotionalIds: [],
  streakDays: 0,
  longestStreakDays: 0,
  lastActiveOn: null,
};

function snapshotOf(state: DevotionState): DevotionSnapshot {
  return {
    period: state.period,
    prayedSectionIds: state.prayedSectionIds,
    confessionDeclaredOn: state.confessionDeclaredOn,
    readDevotionalIds: state.readDevotionalIds,
    streakDays: state.streakDays,
    longestStreakDays: state.longestStreakDays,
    lastActiveOn: state.lastActiveOn,
  };
}

/** Advances the streak for today, leaving it alone if today already counted. */
function withTodayCounted(state: DevotionSnapshot): Partial<DevotionSnapshot> {
  const today = dayKey();
  if (state.lastActiveOn === today) return {};

  const continuing = state.lastActiveOn === yesterdayKey();
  const streakDays = continuing ? state.streakDays + 1 : 1;

  return {
    streakDays,
    longestStreakDays: Math.max(streakDays, state.longestStreakDays),
    lastActiveOn: today,
  };
}

export const useDevotionProgress = create<DevotionState>((set, get) => {
  function persist(next: Partial<DevotionSnapshot>) {
    set(next);
    void preferences.setJson(storageKeys.devotionProgress, snapshotOf(get()));
  }

  return {
    ...empty,
    hydrated: false,

    hydrate: async () => {
      const stored = await preferences.getJson<DevotionSnapshot>(storageKeys.devotionProgress);
      if (!stored) {
        set({ hydrated: true });
        return;
      }

      // A streak that missed a day is already broken by the time we read it.
      const today = dayKey();
      const stale =
        stored.lastActiveOn !== today && stored.lastActiveOn !== yesterdayKey();

      set({
        ...empty,
        ...stored,
        streakDays: stale ? 0 : stored.streakDays,
        hydrated: true,
      });
    },

    setPeriod: (period) => {
      if (get().period === period) return;
      // A new month starts its decree from zero; the streak carries over.
      persist({ period, prayedSectionIds: [], confessionDeclaredOn: null });
    },

    markSectionPrayed: (sectionId) => {
      const state = get();
      if (state.prayedSectionIds.includes(sectionId)) return;
      persist({
        prayedSectionIds: [...state.prayedSectionIds, sectionId],
        ...withTodayCounted(state),
      });
    },

    unmarkSectionPrayed: (sectionId) => {
      const state = get();
      persist({
        prayedSectionIds: state.prayedSectionIds.filter((id) => id !== sectionId),
      });
    },

    declareConfession: () => {
      const state = get();
      persist({ confessionDeclaredOn: dayKey(), ...withTodayCounted(state) });
    },

    markDevotionalRead: (devotionalId) => {
      const state = get();
      if (state.readDevotionalIds.includes(devotionalId)) return;
      persist({
        // Keep the list bounded; nothing older is ever shown.
        readDevotionalIds: [devotionalId, ...state.readDevotionalIds].slice(0, 120),
        ...withTodayCounted(state),
      });
    },

    mergeFromServer: (remote) => {
      const state = get();
      if (remote.period !== state.period) return;

      // Union, never subtraction: a prayer prayed on another device still counts.
      persist({
        prayedSectionIds: [
          ...new Set([...state.prayedSectionIds, ...remote.prayed_section_ids]),
        ],
        readDevotionalIds: [
          ...new Set([...state.readDevotionalIds, ...remote.read_devotional_ids]),
        ],
        confessionDeclaredOn: state.confessionDeclaredOn ?? remote.confession_declared_on ?? null,
        streakDays: Math.max(state.streakDays, remote.streak_days),
        longestStreakDays: Math.max(state.longestStreakDays, remote.longest_streak_days),
        lastActiveOn:
          [state.lastActiveOn, remote.last_active_on ?? null]
            .filter((value): value is string => Boolean(value))
            .sort()
            .pop() ?? null,
      });
    },

    reset: async () => {
      set({ ...empty, hydrated: true });
      await preferences.remove(storageKeys.devotionProgress);
    },
  };
});

/** Shape sent to the backend. */
export function toWireProgress(state: DevotionSnapshot) {
  return {
    period: state.period,
    prayed_section_ids: state.prayedSectionIds,
    confession_declared_on: state.confessionDeclaredOn,
    read_devotional_ids: state.readDevotionalIds,
    streak_days: state.streakDays,
    longest_streak_days: state.longestStreakDays,
    last_active_on: state.lastActiveOn,
  };
}
