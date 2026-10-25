import {
  formatDuration,
  formatMinutes,
  formatRelative,
  formatTimeRange,
  isPast,
  isWithinNextHours,
} from './datetime';

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(2_280)).toBe('38:00');
  });

  it('includes hours when the media is long', () => {
    expect(formatDuration(3_750)).toBe('1:02:30');
  });

  it('shows a placeholder when the duration is unknown', () => {
    expect(formatDuration(null)).toBe('--:--');
    expect(formatDuration(Number.NaN)).toBe('--:--');
    expect(formatDuration(-1)).toBe('--:--');
  });
});

describe('formatMinutes', () => {
  it('rounds to whole minutes', () => {
    expect(formatMinutes(2_280)).toBe('38 min');
    expect(formatMinutes(59)).toBe('1 min');
  });

  it('switches to hours past an hour', () => {
    expect(formatMinutes(3_600)).toBe('1 hr');
    expect(formatMinutes(5_400)).toBe('1 hr 30 min');
  });

  it('returns nothing useful for missing durations', () => {
    expect(formatMinutes(null)).toBe('');
    expect(formatMinutes(0)).toBe('');
  });
});

describe('isPast', () => {
  const now = Date.UTC(2026, 2, 12, 12, 0, 0);

  it('compares against the given instant', () => {
    expect(isPast('2026-03-12T11:00:00.000Z', now)).toBe(true);
    expect(isPast('2026-03-12T13:00:00.000Z', now)).toBe(false);
  });

  it('treats a missing date as not past', () => {
    expect(isPast(null, now)).toBe(false);
  });
});

describe('isWithinNextHours', () => {
  const now = Date.UTC(2026, 2, 12, 12, 0, 0);

  it('is true for an event inside the window', () => {
    expect(isWithinNextHours('2026-03-12T13:30:00.000Z', 2, now)).toBe(true);
  });

  it('is false for an event past the window or already started', () => {
    expect(isWithinNextHours('2026-03-12T15:30:00.000Z', 2, now)).toBe(false);
    expect(isWithinNextHours('2026-03-12T11:30:00.000Z', 2, now)).toBe(false);
  });
});

describe('formatRelative', () => {
  const now = Date.UTC(2026, 2, 12, 12, 0, 0);

  it('describes very recent timestamps as just now', () => {
    expect(formatRelative('2026-03-12T11:59:45.000Z', now)).toBe('just now');
  });

  it('produces a relative phrase for hours and days', () => {
    expect(formatRelative('2026-03-12T09:00:00.000Z', now)).toMatch(/hour/);
    expect(formatRelative('2026-03-10T12:00:00.000Z', now)).toMatch(/day/);
  });

  it('falls back to an absolute date for distant timestamps', () => {
    expect(formatRelative('2025-01-05T12:00:00.000Z', now)).toMatch(/2025/);
  });

  it('returns an empty string for a missing value', () => {
    expect(formatRelative(undefined, now)).toBe('');
  });
});

describe('formatTimeRange', () => {
  it('shows a time range when both ends are on the same day', () => {
    // The exact clock format follows the device locale, so assert the shape.
    const range = formatTimeRange(
      '2026-03-12T17:00:00.000Z',
      '2026-03-12T18:30:00.000Z',
      'UTC'
    );
    expect(range).toContain('–');
    expect(range).toMatch(/(17:00|5:00)/);
    expect(range).toMatch(/(18:30|6:30)/);
  });

  it('falls back to dates when the event spans days', () => {
    const range = formatTimeRange(
      '2026-03-12T22:00:00.000Z',
      '2026-03-13T01:00:00.000Z',
      'UTC'
    );
    expect(range).toMatch(/Mar/);
  });

  it('shows only the start when there is no end time', () => {
    expect(formatTimeRange('2026-03-12T17:00:00.000Z', null, 'UTC')).toMatch(/^(17:00|05:00 PM|5:00 PM)$/);
  });

  it('survives an unknown time zone from the backend', () => {
    expect(() =>
      formatTimeRange('2026-03-12T17:00:00.000Z', null, 'Mars/Olympus_Mons')
    ).not.toThrow();
  });
});
