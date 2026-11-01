import { type Href } from 'expo-router';

/**
 * Deep-link handling.
 *
 * Links arrive from push notifications, announcements and the notification
 * centre — all of them server-supplied strings. They are checked against an
 * allowlist of in-app prefixes before being handed to the router, so a
 * malformed or hostile payload cannot push an arbitrary URL or an external
 * scheme into the app.
 */

const allowedPrefixes = [
  '/sermons',
  '/devotion',
  '/courses',
  '/lessons',
  '/events',
  '/announcements',
  '/community',
  '/prayer',
  '/giving',
  '/notifications',
  '/saved',
  '/search',
  '/discover',
  '/profile',
  '/settings',
] as const;

export function isSafeInAppPath(value: string | null | undefined): boolean {
  if (!value) return false;
  // Reject absolute URLs, protocol-relative URLs and traversal attempts.
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('..')) return false;
  if (value.includes('\\')) return false;
  const path = value.split('?')[0]!;
  return allowedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/**
 * Returns the path as a router destination if it is safe, otherwise null.
 *
 * This is the single point where a server-supplied string becomes an `Href`,
 * and it only happens after the allowlist check above.
 */
export function safeInAppPath(value: string | null | undefined): Href | null {
  return isSafeInAppPath(value) ? (value as Href) : null;
}

/**
 * Whether an external URL may be opened in the browser. Only https (and the
 * WhatsApp/tel/mailto schemes the church uses) are allowed, so a bad link in a
 * course record cannot launch an arbitrary native scheme.
 */
export function isSafeExternalUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ['https:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
}
