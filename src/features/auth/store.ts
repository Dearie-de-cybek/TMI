import { create } from 'zustand';

import { notifyUnauthorized, onUnauthorized, setAuthToken } from '@/api/session';
import { type Member } from '@/api/schemas';
import { preferences, secureStorage, storageKeys } from '@/lib/storage';

import { fetchMember, signIn, signOutRequest, signUp, type SignInInput, type SignUpInput } from './api';

/**
 * Authentication state.
 *
 * `status` drives the root navigator:
 *   `restoring` → splash, `signedOut` → welcome/sign-in, `signedIn` → tabs.
 *
 * The token lives in secure storage and in the transport's in-memory holder.
 * The member record is cached in preferences so the app can render a name
 * immediately on cold start, then refreshed from `/auth/me`.
 */

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  member: Member | null;
  /** Set when the backend wants an email or phone verified before full access. */
  requiresVerification: 'email' | 'phone' | null;
  /** True once the member has been through the intro screens. */
  onboardingSeen: boolean;

  restore: () => Promise<void>;
  signInWith: (input: SignInInput) => Promise<void>;
  signUpWith: (input: SignUpInput) => Promise<void>;
  signOut: (options?: { revokeOnServer?: boolean }) => Promise<void>;
  refreshMember: () => Promise<void>;
  setMember: (member: Member) => void;
  clearVerificationRequirement: () => void;
  markOnboardingSeen: () => Promise<void>;
};

async function persistSession(token: string, member: Member) {
  setAuthToken(token);
  await Promise.all([
    secureStorage.set(storageKeys.authToken, token),
    preferences.setJson(storageKeys.authMember, member),
  ]);
}

async function clearSession() {
  setAuthToken(null);
  await Promise.all([
    secureStorage.remove(storageKeys.authToken),
    preferences.remove(storageKeys.authMember),
  ]);
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'restoring',
  member: null,
  requiresVerification: null,
  onboardingSeen: false,

  restore: async () => {
    const [token, cachedMember, onboardingSeen] = await Promise.all([
      secureStorage.get(storageKeys.authToken),
      preferences.getJson<Member>(storageKeys.authMember),
      preferences.getString(storageKeys.onboardingSeen),
    ]);

    set({ onboardingSeen: onboardingSeen === 'true' });

    if (!token) {
      set({ status: 'signedOut', member: null });
      return;
    }

    setAuthToken(token);
    // Render from cache first so cold start is not blocked on the network.
    set({ status: 'signedIn', member: cachedMember ?? null });

    try {
      const member = await fetchMember();
      set({ member });
      await preferences.setJson(storageKeys.authMember, member);
    } catch {
      // A failed refresh does not sign the member out — the 401 handler does
      // that, and an offline start should keep the cached session.
    }
  },

  signInWith: async (input) => {
    const session = await signIn(input);
    await persistSession(session.token, session.member);
    set({
      status: 'signedIn',
      member: session.member,
      requiresVerification: session.requires_verification ?? null,
    });
  },

  signUpWith: async (input) => {
    const session = await signUp(input);
    await persistSession(session.token, session.member);
    set({
      status: 'signedIn',
      member: session.member,
      requiresVerification: session.requires_verification ?? null,
    });
  },

  signOut: async ({ revokeOnServer = true } = {}) => {
    if (revokeOnServer) {
      try {
        await signOutRequest();
      } catch {
        // The local session is cleared regardless; a token the server already
        // rejected does not need revoking.
      }
    }
    await clearSession();
    set({ status: 'signedOut', member: null, requiresVerification: null });
  },

  refreshMember: async () => {
    if (get().status !== 'signedIn') return;
    const member = await fetchMember();
    set({ member });
    await preferences.setJson(storageKeys.authMember, member);
  },

  setMember: (member) => {
    set({ member });
    void preferences.setJson(storageKeys.authMember, member);
  },

  clearVerificationRequirement: () => set({ requiresVerification: null }),

  markOnboardingSeen: async () => {
    set({ onboardingSeen: true });
    await preferences.setString(storageKeys.onboardingSeen, 'true');
  },
}));

/**
 * Any 401 from any screen signs the member out once, so expired sessions are
 * handled in one place instead of per-query.
 */
let unsubscribe: (() => void) | null = null;

export function installUnauthorizedHandler(onSignedOut?: () => void): () => void {
  unsubscribe?.();
  unsubscribe = onUnauthorized(() => {
    if (useAuth.getState().status === 'signedIn') {
      void useAuth.getState().signOut({ revokeOnServer: false }).then(() => onSignedOut?.());
    }
  });
  return unsubscribe;
}

/** Exposed for tests and for the demo-mode switch, which must drop the session. */
export async function forceSignOut(): Promise<void> {
  notifyUnauthorized();
  await useAuth.getState().signOut({ revokeOnServer: false });
}
