import { env } from '@/config/env';

import { ApiError } from './errors';
import { getAuthToken, notifyUnauthorized } from './session';
import { type RequestOptions, type Transport } from './transport';

/**
 * HTTP transport for the Laravel API (Sanctum bearer tokens).
 *
 * Responsibilities: build the URL, attach credentials, enforce a timeout,
 * honour cancellation, and normalise every failure into `ApiError`. It never
 * retries — retry policy belongs to the query layer, which knows whether a call
 * is safe to repeat.
 */

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(env.apiUrl + normalisedPath);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function createHttpTransport(): Transport {
  return {
    mode: 'live',

    async request(path, options: RequestOptions = {}) {
      const { method = 'GET', query, body, signal, allowAnonymous, idempotencyKey, form } = options;

      const token = getAuthToken();
      if (!token && !allowAnonymous) {
        // Fail fast rather than letting the backend answer 401 for a call the
        // app already knows is unauthenticated.
        throw new ApiError('unauthorized', 'You need to sign in to do that.');
      }

      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
      if (body !== undefined && !form) headers['Content-Type'] = 'application/json';

      // Compose the caller's signal with our timeout so either can abort.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error('timeout')), env.apiTimeoutMs);
      const abortFromCaller = () => controller.abort(signal?.reason);
      signal?.addEventListener('abort', abortFromCaller);

      let response: Response;
      try {
        response = await fetch(buildUrl(path, query), {
          method,
          headers,
          body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
          signal: controller.signal,
        });
      } catch (cause) {
        if (signal?.aborted) {
          throw new ApiError('cancelled', 'Request cancelled.', { cause });
        }
        if (controller.signal.aborted) {
          throw new ApiError('timeout', 'The server did not answer in time.', { cause });
        }
        throw new ApiError('network', 'Could not reach the server.', { cause });
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abortFromCaller);
      }

      if (response.status === 204) return null;

      const payload = await readBody(response);

      if (!response.ok) {
        const error = ApiError.fromStatus(response.status, payload);
        if (error.kind === 'unauthorized' && !allowAnonymous) {
          notifyUnauthorized();
        }
        throw error;
      }

      return payload;
    },
  };
}
