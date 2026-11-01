import { type ApiError } from './errors';

/**
 * The single seam between the app and its data source.
 *
 * Both the HTTP transport (Laravel) and the development data provider implement
 * this interface, so features are written once and never branch on the mode.
 * Transports are responsible for authentication, timeouts, cancellation and for
 * throwing `ApiError` - nothing else in the app inspects status codes.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  /** Query parameters. `undefined` and `null` entries are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Aborts the request; wired to TanStack Query's signal. */
  signal?: AbortSignal;
  /** Set for endpoints that are safe to call unauthenticated. */
  allowAnonymous?: boolean;
  /** Replayed as `Idempotency-Key` so retries cannot double-charge or double-register. */
  idempotencyKey?: string;
  /** Multipart upload (profile photo, assignment file). */
  form?: FormData;
};

export interface Transport {
  readonly mode: 'demo' | 'live';
  /** Resolves with the parsed JSON body, or throws {@link ApiError}. */
  request(path: string, options?: RequestOptions): Promise<unknown>;
}

export type TransportFailure = ApiError;
