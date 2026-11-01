import { z } from 'zod';

/**
 * Form validation.
 *
 * Schemas live here rather than in screens so the rules are unit-testable and
 * the messages stay consistent. Server-side validation is authoritative - these
 * checks only save the member a round trip.
 */

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

/** Runs a schema and flattens the issues to one message per field. */
export function validate<Schema extends z.ZodTypeAny>(
  schema: Schema,
  value: unknown
): { ok: true; data: z.output<Schema> } | { ok: false; errors: FieldErrors } {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || 'form';
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .email('That does not look like an email address.');

const password = z.string().min(8, 'Use at least 8 characters.');

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name.'),
    email,
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || /^[+]?[\d\s()-]{7,20}$/.test(value),
        'Enter a phone number we can reach you on, or leave it blank.'
      ),
    password,
    passwordConfirmation: z.string().min(1, 'Repeat your password.'),
    acceptedTerms: z.literal(true, {
      message: 'Please accept the terms and privacy policy to continue.',
    }),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'The passwords do not match.',
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    email,
    token: z.string().trim().min(4, 'Enter the code from your email.'),
    password,
    passwordConfirmation: z.string().min(1, 'Repeat your new password.'),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'The passwords do not match.',
  });

export const verificationSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'The code is six digits.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    password,
    passwordConfirmation: z.string().min(1, 'Repeat your new password.'),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'The passwords do not match.',
  })
  .refine((value) => value.password !== value.currentPassword, {
    path: ['password'],
    message: 'Choose a password you have not used here before.',
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^[+]?[\d\s()-]{7,20}$/.test(value),
      'Enter a valid phone number, or leave it blank.'
    ),
  city: z.string().trim().max(80, 'That is too long.').optional(),
});

export const prayerRequestSchema = z.object({
  body: z
    .string()
    .trim()
    .min(10, 'Tell us what to pray for, in a sentence or two.')
    .max(2000, 'Please keep it under 2000 characters.'),
  visibility: z.enum(['pastoral_team', 'prayer_team', 'prayer_community']),
  isAnonymous: z.boolean(),
});

export const accessCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, 'Enter the access code you were given.')
    .max(32, 'That code is too long.'),
});

export const askQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(8, 'Ask a slightly longer question so it can be answered from the sermon.')
    .max(500, 'Please keep your question under 500 characters.'),
});

/**
 * Giving amounts are entered in major units ("2,500") and sent in minor units.
 * Parsing lives here so the screen never does arithmetic on a raw string.
 */
export function parseAmountToMinor(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const major = Number(cleaned);
  if (!Number.isFinite(major) || major <= 0) return null;
  return Math.round(major * 100);
}

export function givingAmountError(
  input: string,
  minimumMinor: number,
  currency: string
): string | undefined {
  if (input.trim().length === 0) return 'Enter how much you would like to give.';
  const minor = parseAmountToMinor(input);
  if (minor === null) return 'Enter an amount like 2500 or 2500.50.';
  if (minor < minimumMinor) {
    return `The minimum for this category is ${currency} ${(minimumMinor / 100).toLocaleString()}.`;
  }
  return undefined;
}
