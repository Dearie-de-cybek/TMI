import {
  accessCodeSchema,
  changePasswordSchema,
  givingAmountError,
  parseAmountToMinor,
  prayerRequestSchema,
  signInSchema,
  signUpSchema,
  validate,
} from './validation';

describe('validate', () => {
  it('returns one message per field, keyed by field name', () => {
    const result = validate(signInSchema, { email: 'not-an-email', password: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.email).toBe('That does not look like an email address.');
    expect(result.errors.password).toBe('Enter your password.');
  });

  it('passes through parsed data when valid', () => {
    const result = validate(signInSchema, { email: ' member@example.org ', password: 'secret123' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.email).toBe('member@example.org');
  });
});

describe('signUpSchema', () => {
  const base = {
    name: 'Ada Okafor',
    email: 'ada@example.org',
    phone: '',
    password: 'longenough',
    passwordConfirmation: 'longenough',
    acceptedTerms: true as const,
  };

  it('accepts a complete form', () => {
    expect(validate(signUpSchema, base).ok).toBe(true);
  });

  it('rejects mismatched passwords against the confirmation field', () => {
    const result = validate(signUpSchema, { ...base, passwordConfirmation: 'different' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.passwordConfirmation).toBe('The passwords do not match.');
  });

  it('requires the terms to be accepted', () => {
    const result = validate(signUpSchema, { ...base, acceptedTerms: false });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.acceptedTerms).toContain('accept the terms');
  });

  it('rejects a short password', () => {
    const result = validate(signUpSchema, {
      ...base,
      password: 'short',
      passwordConfirmation: 'short',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.password).toBe('Use at least 8 characters.');
  });

  it('allows an empty phone number but rejects a malformed one', () => {
    expect(validate(signUpSchema, { ...base, phone: '' }).ok).toBe(true);
    expect(validate(signUpSchema, { ...base, phone: 'abc' }).ok).toBe(false);
    expect(validate(signUpSchema, { ...base, phone: '+234 801 234 5678' }).ok).toBe(true);
  });
});

describe('changePasswordSchema', () => {
  it('refuses a new password identical to the current one', () => {
    const result = validate(changePasswordSchema, {
      currentPassword: 'samepassword',
      password: 'samepassword',
      passwordConfirmation: 'samepassword',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.password).toContain('not used here before');
  });
});

describe('prayerRequestSchema', () => {
  it('requires a visibility the backend recognises', () => {
    const result = validate(prayerRequestSchema, {
      body: 'Please pray for my mother, who is in hospital this week.',
      visibility: 'everyone',
      isAnonymous: false,
    });
    expect(result.ok).toBe(false);
  });

  it('requires enough detail to be prayed for', () => {
    const result = validate(prayerRequestSchema, {
      body: 'help',
      visibility: 'pastoral_team',
      isAnonymous: false,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.body).toContain('sentence or two');
  });
});

describe('accessCodeSchema', () => {
  it('rejects codes that are too short to be real', () => {
    expect(validate(accessCodeSchema, { code: 'ab' }).ok).toBe(false);
    expect(validate(accessCodeSchema, { code: 'KH-LEAD-2026' }).ok).toBe(true);
  });
});

describe('parseAmountToMinor', () => {
  it('converts major units to minor units', () => {
    expect(parseAmountToMinor('2500')).toBe(250_000);
    expect(parseAmountToMinor('2,500')).toBe(250_000);
    expect(parseAmountToMinor('10.50')).toBe(1_050);
  });

  it('rejects anything that is not a positive amount', () => {
    expect(parseAmountToMinor('')).toBeNull();
    expect(parseAmountToMinor('0')).toBeNull();
    expect(parseAmountToMinor('-5')).toBeNull();
    expect(parseAmountToMinor('1.234')).toBeNull();
    expect(parseAmountToMinor('abc')).toBeNull();
  });
});

describe('givingAmountError', () => {
  it('requires an amount', () => {
    expect(givingAmountError('', 0, 'NGN')).toContain('Enter how much');
  });

  it('explains an unparseable amount', () => {
    expect(givingAmountError('1.234', 0, 'NGN')).toContain('like 2500');
  });

  it('enforces the category minimum', () => {
    expect(givingAmountError('5', 10_000, 'NGN')).toContain('minimum');
  });

  it('accepts a valid amount at the minimum', () => {
    expect(givingAmountError('100', 10_000, 'NGN')).toBeUndefined();
  });
});
