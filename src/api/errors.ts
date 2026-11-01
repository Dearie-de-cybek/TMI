/**
 * One error type for the whole app.
 *
 * Every transport (HTTP or demo) normalises failures into `ApiError` so screens
 * can branch on `kind` instead of inspecting status codes, and so the copy shown
 * to members is written once, here.
 */

export type ApiErrorKind =
  | 'offline'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'maintenance'
  | 'unavailable'
  | 'parse'
  | 'unknown';

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** Laravel validation bag: `{ email: ['The email has already been taken.'] }`. */
  readonly fieldErrors?: FieldErrors;
  /** Backend-defined machine code, e.g. `access_code_expired`. */
  readonly code?: string;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; fieldErrors?: FieldErrors; code?: string; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status;
    this.fieldErrors = options.fieldErrors;
    this.code = options.code;
  }

  get retryable(): boolean {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      this.kind === 'server' ||
      this.kind === 'maintenance' ||
      this.kind === 'unavailable' ||
      this.kind === 'offline'
    );
  }

  static fromStatus(status: number, body: unknown): ApiError {
    const parsed = parseErrorBody(body);
    const kind = kindForStatus(status);
    return new ApiError(kind, parsed.message ?? defaultMessageFor(kind), {
      status,
      fieldErrors: parsed.errors,
      code: parsed.code,
    });
  }

  static isApiError(value: unknown): value is ApiError {
    return value instanceof ApiError;
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'maintenance';
  if (status >= 500) return 'server';
  return 'unknown';
}

function parseErrorBody(body: unknown): {
  message?: string;
  errors?: FieldErrors;
  code?: string;
} {
  if (typeof body !== 'object' || body === null) return {};
  const record = body as Record<string, unknown>;
  const message = typeof record.message === 'string' ? record.message : undefined;
  const code = typeof record.code === 'string' ? record.code : undefined;

  let errors: FieldErrors | undefined;
  if (typeof record.errors === 'object' && record.errors !== null) {
    errors = {};
    for (const [field, value] of Object.entries(record.errors as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        errors[field] = value.filter((item): item is string => typeof item === 'string');
      } else if (typeof value === 'string') {
        errors[field] = [value];
      }
    }
  }

  return { message, errors, code };
}

function defaultMessageFor(kind: ApiErrorKind): string {
  return presentation[kind].message;
}

type Presentation = { title: string; message: string };

/**
 * Member-facing copy. Each entry says what happened and what to do next -
 * never a status code, and never "something went wrong".
 */
const presentation: Record<ApiErrorKind, Presentation> = {
  offline: {
    title: 'You are offline',
    message: 'Reconnect to the internet to load this. Saved content is still available.',
  },
  network: {
    title: 'Could not reach TwainMan Ministry',
    message: 'Your connection dropped while loading. Check your signal and try again.',
  },
  timeout: {
    title: 'That took too long',
    message: 'The server did not answer in time. Try again in a moment.',
  },
  cancelled: {
    title: 'Request cancelled',
    message: 'The request was cancelled.',
  },
  unauthorized: {
    title: 'Please sign in again',
    message: 'Your session has expired. Sign in to continue where you left off.',
  },
  forbidden: {
    title: 'You do not have access',
    message: 'This content is restricted. Contact the church office if you believe that is wrong.',
  },
  not_found: {
    title: 'Not found',
    message: 'This content is no longer available. It may have been unpublished.',
  },
  validation: {
    title: 'Check the details',
    message: 'Some of the information you entered needs correcting.',
  },
  conflict: {
    title: 'Already done',
    message: 'This was already recorded, so nothing was changed.',
  },
  rate_limited: {
    title: 'Too many attempts',
    message: 'Wait a minute before trying again.',
  },
  server: {
    title: 'Something broke on our side',
    message: 'The church server returned an error. Please try again shortly.',
  },
  maintenance: {
    title: 'Briefly unavailable',
    message: 'TwainMan Ministry is being updated. Please try again in a few minutes.',
  },
  unavailable: {
    title: 'Service unavailable',
    message: 'This part of the app is temporarily switched off.',
  },
  parse: {
    title: 'Unexpected response',
    message: 'The server sent something this version of the app does not understand.',
  },
  unknown: {
    title: 'Something went wrong',
    message: 'Please try again. If it keeps happening, contact the church office.',
  },
};

export function describeError(error: unknown): Presentation & { retryable: boolean } {
  if (ApiError.isApiError(error)) {
    const base = presentation[error.kind];
    // Prefer the backend's own message when it is written for members
    // (validation and conflict messages usually are); keep ours otherwise.
    const useServerMessage =
      (error.kind === 'validation' || error.kind === 'conflict' || error.kind === 'forbidden') &&
      error.message.length > 0 &&
      error.message !== base.message;

    return {
      title: base.title,
      message: useServerMessage ? error.message : base.message,
      retryable: error.retryable,
    };
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return { ...presentation.cancelled, retryable: false };
  }

  return { ...presentation.unknown, retryable: true };
}

/** First validation message for a field, if the backend returned one. */
export function fieldError(error: unknown, field: string): string | undefined {
  if (!ApiError.isApiError(error)) return undefined;
  return error.fieldErrors?.[field]?.[0];
}
