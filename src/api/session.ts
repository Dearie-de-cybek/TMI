/**
 * Holds the bearer token for the transports.
 *
 * Kept separate from the auth store so the transport layer has no import cycle
 * with feature code, and so a 401 anywhere in the app can trigger exactly one
 * sign-out instead of each screen handling it.
 */

let token: string | null = null;
const unauthorizedListeners = new Set<() => void>();
let notifying = false;

export function getAuthToken(): string | null {
  return token;
}

export function setAuthToken(next: string | null): void {
  token = next;
}

export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

/**
 * Called by a transport when the backend rejects the current credentials.
 * Re-entrant calls are ignored so a burst of parallel 401s signs out once.
 */
export function notifyUnauthorized(): void {
  if (notifying) return;
  notifying = true;
  try {
    for (const listener of unauthorizedListeners) {
      listener();
    }
  } finally {
    // Release on the next tick so queries failing together collapse into one.
    setTimeout(() => {
      notifying = false;
    }, 0);
  }
}
