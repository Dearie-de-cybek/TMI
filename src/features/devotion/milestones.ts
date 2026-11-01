import { type DevotionSnapshot } from './progress-store';

/**
 * Milestones.
 *
 * The gamified part of the devotion screen, kept deliberately gentle: each one
 * is a marker the member reaches by praying or reading, never a score to lose.
 * All of them derive from the progress snapshot, so there is nothing extra to
 * store or sync.
 */
export type Milestone = {
  id: string;
  title: string;
  hint: string;
  reached: boolean;
};

export function milestonesFor(state: DevotionSnapshot, totalDecrees: number): Milestone[] {
  const prayed = state.prayedSectionIds.length;
  const half = Math.ceil(totalDecrees / 2);

  return [
    {
      id: 'first',
      title: 'First decree',
      hint: 'Pray your first decree this month',
      reached: prayed >= 1,
    },
    {
      id: 'half',
      title: 'Half-way',
      hint: `Pray ${half} of ${totalDecrees} decrees`,
      reached: totalDecrees > 0 && prayed >= half,
    },
    {
      id: 'all',
      title: 'Every decree',
      hint: `Pray all ${totalDecrees} decrees`,
      reached: totalDecrees > 0 && prayed >= totalDecrees,
    },
    {
      id: 'confession',
      title: 'The confession',
      hint: 'Declare the corporate confession',
      reached: state.confessionDeclaredOn !== null,
    },
    {
      id: 'week',
      title: 'Seven days',
      hint: 'Keep the altar seven days running',
      reached: state.longestStreakDays >= 7,
    },
    {
      id: 'month',
      title: 'Thirty days',
      hint: 'Keep the altar thirty days running',
      reached: state.longestStreakDays >= 30,
    },
  ];
}
