import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-client';

import { fetchCurrentDecree } from './api';
import { useDevotionProgress, type DevotionSnapshot } from './progress-store';

/**
 * Badges.
 *
 * Each one is a marker the member reaches by praying or reading, never a score to
 * lose. All of them derive from the progress snapshot, so there is nothing extra
 * to store or sync. Every badge is listed — earned or not — with what it is for,
 * so a member always knows what is there to reach.
 */
export type Badge = {
  id: string;
  title: string;
  /** What the badge is for, in a sentence. */
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Medal colours: the rim and glyph, and the face behind the glyph. */
  rim: string;
  face: string;
  /** Where the member is now, and where the badge is earned. */
  count: number;
  target: number;
  reached: boolean;
};

type Definition = Omit<Badge, 'count' | 'target' | 'reached' | 'description'> & {
  description: (target: number, total: number) => string;
  progress: (state: DevotionSnapshot, total: number) => { count: number; target: number };
};

const definitions: Definition[] = [
  {
    id: 'first-word',
    title: 'First Word',
    icon: 'book',
    rim: '#0E8A8A',
    face: '#BDE6E4',
    description: () => 'Read your first daily devotional all the way through.',
    progress: (state) => ({ count: state.readDevotionalIds.length, target: 1 }),
  },
  {
    id: 'first-decree',
    title: 'First Decree',
    icon: 'heart',
    rim: '#2F7D4F',
    face: '#BFE5CB',
    description: () => 'Pray your first decree from the month’s prophetic decree.',
    progress: (state) => ({ count: state.prayedSectionIds.length, target: 1 }),
  },
  {
    id: 'half-way',
    title: 'Half-way',
    icon: 'flame',
    rim: '#D9731A',
    face: '#FBD9B5',
    description: (target, total) => `Pray ${target} of the month’s ${total} decrees.`,
    progress: (state, total) => ({
      count: state.prayedSectionIds.length,
      target: Math.max(1, Math.ceil(total / 2)),
    }),
  },
  {
    id: 'every-decree',
    title: 'Every Decree',
    icon: 'trophy',
    rim: '#C9922B',
    face: '#F8E3AE',
    description: (_, total) => `Pray all ${total} decrees in a single month.`,
    progress: (state, total) => ({ count: state.prayedSectionIds.length, target: Math.max(1, total) }),
  },
  {
    id: 'confession',
    title: 'The Confession',
    icon: 'mic',
    rim: '#6B3FA0',
    face: '#DCCBF0',
    description: () => 'Declare the corporate confession that closes the month, aloud.',
    progress: (state) => ({ count: state.confessionDeclaredOn ? 1 : 0, target: 1 }),
  },
  {
    id: 'seven-words',
    title: 'Seven Words',
    icon: 'library',
    rim: '#C2417A',
    face: '#F5C6DB',
    description: () => 'Read seven daily devotionals.',
    progress: (state) => ({ count: state.readDevotionalIds.length, target: 7 }),
  },
  {
    id: 'seven-days',
    title: 'Seven Days',
    icon: 'flash',
    rim: '#C23A3A',
    face: '#F6C9C9',
    description: () => 'Keep the altar seven days in a row — pray a decree or read the word each day.',
    progress: (state) => ({ count: state.longestStreakDays, target: 7 }),
  },
  {
    id: 'thirty-words',
    title: 'Thirty Words',
    icon: 'school',
    rim: '#3B4CB8',
    face: '#CDD2F2',
    description: () => 'Read thirty daily devotionals.',
    progress: (state) => ({ count: state.readDevotionalIds.length, target: 30 }),
  },
  {
    id: 'thirty-days',
    title: 'Thirty Days',
    icon: 'ribbon',
    rim: '#2563A8',
    face: '#C7DDF4',
    description: () => 'Keep the altar thirty days in a row.',
    progress: (state) => ({ count: state.longestStreakDays, target: 30 }),
  },
];

export function badgesFor(state: DevotionSnapshot, totalDecrees: number): Badge[] {
  return definitions.map((definition) => {
    const { count, target } = definition.progress(state, totalDecrees);
    return {
      id: definition.id,
      title: definition.title,
      icon: definition.icon,
      rim: definition.rim,
      face: definition.face,
      description: definition.description(target, totalDecrees),
      count,
      target,
      reached: count >= target,
    };
  });
}

/** Every badge, computed from the device's progress and this month's decree. */
export function useBadges(): Badge[] {
  const progress = useDevotionProgress();
  const decree = useQuery({
    queryKey: queryKeys.decree('current'),
    queryFn: ({ signal }) => fetchCurrentDecree(signal),
  });

  // Prayed decrees belong to a month; a stale month has none prayed yet.
  const snapshot: DevotionSnapshot =
    decree.data && progress.period !== decree.data.period
      ? { ...progress, prayedSectionIds: [], confessionDeclaredOn: null }
      : progress;

  return badgesFor(snapshot, decree.data?.sections.length ?? 11);
}
