/**
 * Environment configuration.
 *
 * Only `EXPO_PUBLIC_*` variables exist in the bundle, and everything here is
 * therefore public. Payment keys, AI provider keys, database credentials and
 * messaging credentials belong to the Laravel backend and must never appear here.
 *
 * See `.env.example` for the full list and `docs/ENVIRONMENTS.md` for the
 * per-environment values.
 */

export type ApiMode = 'demo' | 'live';

function readString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  const normalised = value?.trim().toLowerCase();
  if (normalised === '1' || normalised === 'true') return true;
  if (normalised === '0' || normalised === 'false') return false;
  return fallback;
}

const isTest = process.env.NODE_ENV === 'test';
const rawMode = readString(process.env.EXPO_PUBLIC_API_MODE, isTest ? 'demo' : 'live').toLowerCase();

export const env = {
  /** Data source the app boots with. Members can never silently end up in demo mode. */
  defaultApiMode: (rawMode === 'live' ? 'live' : 'demo') satisfies ApiMode as ApiMode,
  apiUrl: readString(process.env.EXPO_PUBLIC_API_URL, 'https://twainmanministry.org/api/v1').replace(
    /\/+$/,
    ''
  ),
  apiTimeoutMs: readNumber(process.env.EXPO_PUBLIC_API_TIMEOUT, 15_000),
  /** Exposes the data-source switch in Settings. Must be false in production builds. */
  allowModeSwitch: readBoolean(process.env.EXPO_PUBLIC_ALLOW_MODE_SWITCH, __DEV__),
  /**
   * Shows the welcome pager on every launch, so it can be tested without
   * clearing app data. Development only: it is ignored in release builds.
   */
  alwaysShowWelcome: __DEV__ && readBoolean(process.env.EXPO_PUBLIC_ALWAYS_SHOW_WELCOME, false),
  church: {
    email: readString(process.env.EXPO_PUBLIC_CHURCH_EMAIL, 'hello@twainmanministry.org'),
    phone: readString(process.env.EXPO_PUBLIC_CHURCH_PHONE, ''),
    privacyUrl: readString(
      process.env.EXPO_PUBLIC_PRIVACY_URL,
      'https://twainmanministry.org/privacy'
    ),
    termsUrl: readString(process.env.EXPO_PUBLIC_TERMS_URL, 'https://twainmanministry.org/terms'),
  },
} as const;
