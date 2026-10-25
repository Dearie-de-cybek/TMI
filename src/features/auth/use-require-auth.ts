import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from './store';

/**
 * Guards member-only actions.
 *
 * Public content (sermons, events, announcements, groups) stays browsable while
 * signed out; only actions that belong to a member — saving, enrolling, giving,
 * prayer, registration — go through this. It returns false and sends the member
 * to sign-in with a reason, so the sign-in screen can say why they are there.
 */
export function useRequireAuth() {
  const status = useAuth((state) => state.status);
  const router = useRouter();

  return useCallback(
    (options?: { reason?: string; next?: string }): boolean => {
      if (status === 'signedIn') return true;
      router.push({
        pathname: '/sign-in',
        params: {
          reason: options?.reason ?? 'member',
          ...(options?.next ? { next: options.next } : {}),
        },
      });
      return false;
    },
    [router, status]
  );
}

export function useIsSignedIn(): boolean {
  return useAuth((state) => state.status === 'signedIn');
}
