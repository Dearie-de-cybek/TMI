import { useEffect, useRef } from 'react';

import { useIsSignedIn } from '@/features/auth/use-require-auth';

import { fetchDevotionProgress, pushDevotionProgress } from './api';
import { useDevotionProgress } from './progress-store';

/**
 * Keeps the device's devotional progress and the church server in step.
 *
 * The device leads. On sign-in the server's copy is merged in (union, never
 * subtraction), and afterwards changes are pushed up on a short debounce.
 * Every failure here is swallowed on purpose: a dropped request must never
 * interrupt someone mid-prayer, and nothing is lost — the device still holds it.
 */
const PUSH_DELAY_MS = 1_500;

export function useDevotionSync(): void {
  const signedIn = useIsSignedIn();
  const hydrated = useDevotionProgress((state) => state.hydrated);
  const hydrate = useDevotionProgress((state) => state.hydrate);
  const mergeFromServer = useDevotionProgress((state) => state.mergeFromServer);

  // A cheap signature of everything worth syncing.
  const signature = useDevotionProgress(
    (state) =>
      `${state.period}|${state.prayedSectionIds.length}|${state.readDevotionalIds.length}|${state.confessionDeclaredOn ?? ''}|${state.streakDays}`
  );

  const pulled = useRef(false);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    if (!signedIn || !hydrated || pulled.current) return;
    pulled.current = true;
    void fetchDevotionProgress()
      .then(mergeFromServer)
      .catch(() => undefined);
  }, [hydrated, mergeFromServer, signedIn]);

  useEffect(() => {
    if (!signedIn || !hydrated) return;
    const timer = setTimeout(() => {
      const state = useDevotionProgress.getState();
      void pushDevotionProgress(state).catch(() => undefined);
    }, PUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hydrated, signature, signedIn]);
}
