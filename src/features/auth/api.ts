import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiRequest } from '@/api/client';
import {
  authSessionSchema,
  memberSchema,
  messageResponseSchema,
  type AuthSession,
  type Member,
} from '@/api/schemas';
import { z } from 'zod';

/**
 * Authentication endpoints (Laravel Sanctum personal access tokens).
 *
 * Passwords are sent once and never stored on the device; only the returned
 * token is persisted, in the keychain/keystore.
 */

export type SignInInput = { email: string; password: string };
export type SignUpInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  passwordConfirmation: string;
  acceptedTerms: boolean;
};

/** Identifies the token to the backend so members can revoke a lost device. */
function deviceName(): string {
  return 'TwainMan Ministry mobile';
}

export function signIn(input: SignInInput): Promise<AuthSession> {
  return apiPost(
    authSessionSchema,
    '/auth/login',
    { email: input.email.trim(), password: input.password, device_name: deviceName() },
    { allowAnonymous: true }
  );
}

export function signUp(input: SignUpInput): Promise<AuthSession> {
  return apiPost(
    authSessionSchema,
    '/auth/register',
    {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || undefined,
      password: input.password,
      password_confirmation: input.passwordConfirmation,
      accepted_terms: input.acceptedTerms,
      device_name: deviceName(),
    },
    { allowAnonymous: true }
  );
}

export function signOutRequest(): Promise<unknown> {
  return apiPost(messageResponseSchema, '/auth/logout');
}

export function fetchMember(): Promise<Member> {
  return apiGet(memberSchema, '/auth/me');
}

export function requestPasswordReset(email: string) {
  return apiPost(messageResponseSchema, '/auth/forgot-password', { email: email.trim() }, {
    allowAnonymous: true,
  });
}

export function resetPassword(input: {
  email: string;
  token: string;
  password: string;
  passwordConfirmation: string;
}) {
  return apiPost(
    messageResponseSchema,
    '/auth/reset-password',
    {
      email: input.email.trim(),
      token: input.token.trim(),
      password: input.password,
      password_confirmation: input.passwordConfirmation,
    },
    { allowAnonymous: true }
  );
}

export function verifyAccount(code: string): Promise<Member> {
  return apiPost(memberSchema, '/auth/verify', { code: code.trim() });
}

export function resendVerification() {
  return apiPost(messageResponseSchema, '/auth/verify/resend');
}

export function changePassword(input: {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}) {
  return apiPut(messageResponseSchema, '/auth/password', {
    current_password: input.currentPassword,
    password: input.password,
    password_confirmation: input.passwordConfirmation,
  });
}

export function requestAccountDeletion(reason?: string) {
  return apiDelete(messageResponseSchema, '/account', {
    body: reason ? { reason } : undefined,
  });
}

export function updateProfile(input: {
  name?: string;
  phone?: string | null;
  city?: string | null;
  interests?: string[];
}): Promise<Member> {
  return apiPatch(memberSchema, '/profile', input);
}

/**
 * Uploads a new profile picture as multipart form data.
 *
 * The file never leaves the device except in this request, and the backend
 * decides what it accepts — the app does not resize or re-encode it beyond the
 * picker's own compression.
 */
export function uploadAvatar(input: {
  uri: string;
  mimeType: string;
  fileName: string;
}): Promise<Member> {
  const form = new FormData();
  // React Native's FormData accepts this file descriptor shape.
  form.append('avatar', {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as unknown as Blob);

  return apiRequest(memberSchema, '/profile/avatar', { method: 'POST', form });
}

export function fetchInterestOptions(): Promise<string[]> {
  return apiGet(z.object({ data: z.array(z.string()) }), '/profile/interests', {
    allowAnonymous: true,
  }).then((response) => response.data);
}
