/**
 * Date and time formatting.
 *
 * All timestamps from the API are ISO-8601 in UTC. Events additionally carry the
 * IANA zone the church scheduled them in, so an event is shown in the church's
 * zone with the abbreviation attached — a member travelling abroad still reads
 * the right start time, and the zone is never silently assumed.
 */

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeFormat(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string | null
): string {
  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone: timeZone ?? undefined }).format(
      date
    );
  } catch {
    // An unknown zone from the backend must not crash a screen.
    return new Intl.DateTimeFormat(undefined, options).format(date);
  }
}

/** "12 March 2026" */
export function formatDate(iso: string | null | undefined, timeZone?: string | null): string {
  const date = toDate(iso);
  if (!date) return '';
  return safeFormat(date, { day: 'numeric', month: 'long', year: 'numeric' }, timeZone);
}

/** "Thu 12 Mar" — compact form for rows and chips. */
export function formatDateShort(iso: string | null | undefined, timeZone?: string | null): string {
  const date = toDate(iso);
  if (!date) return '';
  return safeFormat(date, { weekday: 'short', day: 'numeric', month: 'short' }, timeZone);
}

/** "18:00" in the given zone. */
export function formatTime(iso: string | null | undefined, timeZone?: string | null): string {
  const date = toDate(iso);
  if (!date) return '';
  return safeFormat(date, { hour: '2-digit', minute: '2-digit' }, timeZone);
}

/** "Thu 12 Mar, 18:00 WAT" */
export function formatDateTimeWithZone(
  iso: string | null | undefined,
  timeZone?: string | null
): string {
  const date = toDate(iso);
  if (!date) return '';
  const base = safeFormat(
    date,
    { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
    timeZone
  );
  if (!timeZone) return base;
  const zone = safeFormat(date, { timeZoneName: 'short' }, timeZone).split(', ').pop();
  return zone && zone !== base ? `${base} ${zone}` : base;
}

/** "18:00 – 19:30" when both ends fall on the same day, otherwise both dates. */
export function formatTimeRange(
  startIso: string,
  endIso: string | null | undefined,
  timeZone?: string | null
): string {
  const start = toDate(startIso);
  const end = toDate(endIso);
  if (!start) return '';
  if (!end) return formatTime(startIso, timeZone);

  const sameDay =
    safeFormat(start, { year: 'numeric', month: 'numeric', day: 'numeric' }, timeZone) ===
    safeFormat(end, { year: 'numeric', month: 'numeric', day: 'numeric' }, timeZone);

  if (sameDay) return `${formatTime(startIso, timeZone)} – ${formatTime(endIso, timeZone)}`;
  return `${formatDateShort(startIso, timeZone)} – ${formatDateShort(endIso, timeZone)}`;
}

/** "3 days ago", "in 2 hours", "just now". */
export function formatRelative(iso: string | null | undefined, now = Date.now()): string {
  const date = toDate(iso);
  if (!date) return '';

  const diffMs = date.getTime() - now;
  const absMs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (absMs < minute) return 'just now';

  // Each unit is used up to the point where the next one reads better.
  const units: [Intl.RelativeTimeFormatUnit, number, number][] = [
    ['minute', minute, hour],
    ['hour', hour, day],
    ['day', day, week],
    ['week', week, 5 * week],
  ];

  if (absMs >= 5 * week) return formatDate(iso);

  let unit: Intl.RelativeTimeFormatUnit = 'week';
  let value = diffMs / week;
  for (const [candidate, size, limit] of units) {
    if (absMs < limit) {
      unit = candidate;
      value = diffMs / size;
      break;
    }
  }

  try {
    return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
      Math.round(value),
      unit
    );
  } catch {
    return formatDate(iso);
  }
}

export function isPast(iso: string | null | undefined, now = Date.now()): boolean {
  const date = toDate(iso);
  return date ? date.getTime() < now : false;
}

export function isWithinNextHours(
  iso: string | null | undefined,
  hours: number,
  now = Date.now()
): boolean {
  const date = toDate(iso);
  if (!date) return false;
  const diff = date.getTime() - now;
  return diff >= 0 && diff <= hours * 3_600_000;
}

/** "42:10" or "1:02:30" — for media positions and durations. */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) return '--:--';
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** "38 min" — rough length for list metadata. */
export function formatMinutes(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return '';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}
