import { z } from 'zod';

import { apiGet, apiPost } from '@/api/client';
import {
  givingCategorySchema,
  givingIntentSchema,
  paginated,
  transactionSchema,
  type GivingCategory,
  type GivingIntent,
  type Paginated,
  type Transaction,
} from '@/api/schemas';

/**
 * Giving.
 *
 * The app selects a category and an amount and asks the backend to create an
 * intent. The backend talks to the payment provider and returns a hosted
 * checkout URL; the app opens it and then asks the backend for the verified
 * status. No card details are ever entered in the app, no provider key is in
 * the bundle, and a returning member is never shown "successful" on the
 * strength of having been to the checkout page.
 */
export function fetchGivingCategories(signal?: AbortSignal): Promise<GivingCategory[]> {
  return apiGet(z.object({ data: z.array(givingCategorySchema) }), '/giving/categories', {
    allowAnonymous: true,
    signal,
  }).then((response) => response.data);
}

export function createGivingIntent(input: {
  categoryId: string;
  amountMinor: number;
  currency: string;
  recurrence: 'one_time' | 'monthly';
  /** Stable for the whole attempt, so a retry cannot create a second charge. */
  idempotencyKey: string;
}): Promise<GivingIntent> {
  return apiPost(
    givingIntentSchema,
    '/giving/intents',
    {
      category_id: input.categoryId,
      amount_minor: input.amountMinor,
      currency: input.currency,
      recurrence: input.recurrence,
    },
    { idempotencyKey: input.idempotencyKey }
  );
}

/** Asks the backend for the provider-verified status of an intent. */
export function fetchGivingIntent(reference: string): Promise<GivingIntent> {
  return apiGet(givingIntentSchema, `/giving/intents/${encodeURIComponent(reference)}`);
}

export function fetchTransactions(page = 1): Promise<Paginated<Transaction>> {
  return apiGet(paginated(transactionSchema), '/giving/transactions', { query: { page } });
}
