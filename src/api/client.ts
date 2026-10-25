import { type z } from 'zod';

import { getApiMode } from '@/config/runtime';

import { createDemoTransport } from './demo/transport';
import { ApiError } from './errors';
import { createHttpTransport } from './http';
import { type RequestOptions, type Transport } from './transport';

/**
 * The only entry point features use to reach data.
 *
 * It picks the transport for the active mode, then validates the response
 * against its schema so a backend contract change fails loudly at the boundary
 * rather than as a mystery crash three screens later.
 */

const transports: Record<'demo' | 'live', Transport> = {
  demo: createDemoTransport(),
  live: createHttpTransport(),
};

function activeTransport(): Transport {
  return transports[getApiMode()];
}

export async function apiRequest<Schema extends z.ZodTypeAny>(
  schema: Schema,
  path: string,
  options: RequestOptions = {}
): Promise<z.output<Schema>> {
  const raw = await activeTransport().request(path, options);
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    if (__DEV__) {
      console.error(
        `[api] Response from ${options.method ?? 'GET'} ${path} did not match its schema`,
        parsed.error.issues
      );
    }
    throw new ApiError('parse', 'The server sent an unexpected response.', {
      cause: parsed.error,
    });
  }

  return parsed.data;
}

export function apiGet<Schema extends z.ZodTypeAny>(
  schema: Schema,
  path: string,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
) {
  return apiRequest(schema, path, { ...options, method: 'GET' });
}

export function apiPost<Schema extends z.ZodTypeAny>(
  schema: Schema,
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
) {
  return apiRequest(schema, path, { ...options, method: 'POST', body });
}

export function apiPut<Schema extends z.ZodTypeAny>(
  schema: Schema,
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
) {
  return apiRequest(schema, path, { ...options, method: 'PUT', body });
}

export function apiPatch<Schema extends z.ZodTypeAny>(
  schema: Schema,
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
) {
  return apiRequest(schema, path, { ...options, method: 'PATCH', body });
}

export function apiDelete<Schema extends z.ZodTypeAny>(
  schema: Schema,
  path: string,
  options: Omit<RequestOptions, 'method'> = {}
) {
  return apiRequest(schema, path, { ...options, method: 'DELETE' });
}

/** Unique key for mutations that must not be applied twice (giving, registration). */
export function idempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
