import { ApiError, describeError, fieldError } from './errors';

describe('ApiError.fromStatus', () => {
  it('maps Laravel validation responses to field errors', () => {
    const error = ApiError.fromStatus(422, {
      message: 'The given data was invalid.',
      errors: { email: ['That email is already registered.'], password: ['Too short.'] },
    });

    expect(error.kind).toBe('validation');
    expect(error.status).toBe(422);
    expect(fieldError(error, 'email')).toBe('That email is already registered.');
    expect(fieldError(error, 'password')).toBe('Too short.');
    expect(fieldError(error, 'name')).toBeUndefined();
  });

  it('accepts a single string instead of an array in the error bag', () => {
    const error = ApiError.fromStatus(422, { errors: { code: 'That code has expired.' } });
    expect(fieldError(error, 'code')).toBe('That code has expired.');
  });

  it('maps the status codes the app branches on', () => {
    expect(ApiError.fromStatus(401, null).kind).toBe('unauthorized');
    expect(ApiError.fromStatus(403, null).kind).toBe('forbidden');
    expect(ApiError.fromStatus(404, null).kind).toBe('not_found');
    expect(ApiError.fromStatus(409, null).kind).toBe('conflict');
    expect(ApiError.fromStatus(429, null).kind).toBe('rate_limited');
    expect(ApiError.fromStatus(500, null).kind).toBe('server');
    expect(ApiError.fromStatus(503, null).kind).toBe('maintenance');
  });

  it('keeps the backend machine code for the UI to branch on', () => {
    const error = ApiError.fromStatus(409, {
      message: 'Already used.',
      code: 'access_code_used',
    });
    expect(error.code).toBe('access_code_used');
  });
});

describe('retryable', () => {
  it('is true only for failures a retry could fix', () => {
    expect(new ApiError('network', 'x').retryable).toBe(true);
    expect(new ApiError('timeout', 'x').retryable).toBe(true);
    expect(new ApiError('server', 'x').retryable).toBe(true);
    expect(new ApiError('maintenance', 'x').retryable).toBe(true);

    expect(new ApiError('validation', 'x').retryable).toBe(false);
    expect(new ApiError('forbidden', 'x').retryable).toBe(false);
    expect(new ApiError('not_found', 'x').retryable).toBe(false);
    expect(new ApiError('unauthorized', 'x').retryable).toBe(false);
  });
});

describe('describeError', () => {
  it('prefers the backend message for validation and conflict failures', () => {
    const described = describeError(
      new ApiError('conflict', 'You are already registered for this event.', { status: 409 })
    );
    expect(described.message).toBe('You are already registered for this event.');
  });

  it('uses the app copy for failures the backend words badly', () => {
    const described = describeError(new ApiError('server', 'SQLSTATE[HY000] connection refused'));
    expect(described.message).not.toContain('SQLSTATE');
    expect(described.title).toBe('Something broke on our side');
    expect(described.retryable).toBe(true);
  });

  it('explains an expired session in terms of signing in', () => {
    const described = describeError(new ApiError('unauthorized', 'Unauthenticated.'));
    expect(described.title).toContain('sign in');
  });

  it('handles non-ApiError values without throwing', () => {
    const described = describeError(new TypeError('undefined is not a function'));
    expect(described.title).toBe('Something went wrong');
  });
});
