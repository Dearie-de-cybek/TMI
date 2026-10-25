import { EntityTypes, getCalendars, requestCalendarPermissions } from 'expo-calendar';

import { type ChurchEvent } from '@/api/schemas';

/**
 * Adds an event to the member's own calendar.
 *
 * Only ever called from an explicit tap. Returns a result the UI reports rather
 * than throwing, because a denied permission is a normal outcome, not an error.
 */
export type CalendarResult =
  | { status: 'added'; calendarTitle: string }
  | { status: 'denied' }
  | { status: 'unavailable'; reason: string };

export async function addEventToCalendar(event: ChurchEvent): Promise<CalendarResult> {
  // Write-only access is enough: the app never reads the member's calendar.
  const permission = await requestCalendarPermissions(true);
  if (permission.status !== 'granted') return { status: 'denied' };

  const calendars = await getCalendars(EntityTypes.EVENT);
  const writable = calendars.filter((calendar) => calendar.allowsModifications);
  const target = writable.find((calendar) => calendar.isPrimary) ?? writable[0];

  if (!target) {
    return {
      status: 'unavailable',
      reason: 'No calendar on this device accepts new events.',
    };
  }

  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + 60 * 60 * 1000);

  const location =
    event.format === 'online'
      ? (event.online_url ?? 'Online')
      : [event.venue_name, event.address].filter(Boolean).join(', ');

  await target.createEvent({
    title: event.title,
    startDate: start,
    endDate: end,
    location: location || null,
    notes: event.description ?? '',
    // The church's zone, so a travelling member still sees the right local time.
    timeZone: event.timezone,
    alarms: [{ relativeOffset: -60 }],
  });

  return { status: 'added', calendarTitle: target.title };
}
