/**
 * Text and money formatting shared across features.
 */

/**
 * Formats a minor-unit amount (kobo, cents) using the member's locale.
 * Amounts always arrive from the backend in minor units so no rounding error
 * can creep into a giving total.
 */
export function formatMoney(amountMinor: number, currency = 'NGN'): string {
  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toLocaleString()}`;
  }
}

/** Joins non-empty parts with a separator - avoids "·  · " gaps in metadata rows. */
export function joinMeta(parts: (string | null | undefined | false)[], separator = ' · '): string {
  return parts.filter((part): part is string => Boolean(part && part.length > 0)).join(separator);
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Trims to a word boundary and appends an ellipsis. */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const slice = value.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > maxLength * 0.6 ? lastSpace : maxLength).trimEnd()}…`;
}

const titleCaseExceptions = new Set(['of', 'the', 'and', 'in', 'for', 'a', 'to']);

export function titleCase(value: string): string {
  return value
    .split(' ')
    .map((word, index) =>
      index > 0 && titleCaseExceptions.has(word.toLowerCase())
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

const formatLabels: Record<string, string> = {
  in_person: 'In person',
  online: 'Online',
  hybrid: 'In person & online',
};

export function eventFormatLabel(format: string): string {
  return formatLabels[format] ?? format;
}

const givingStatusLabels: Record<string, { label: string; description: string }> = {
  pending: {
    label: 'Awaiting payment',
    description: 'We are waiting for the payment provider to confirm this gift.',
  },
  processing: {
    label: 'Processing',
    description: 'The provider has the payment and is confirming it.',
  },
  successful: { label: 'Received', description: 'The church has received this gift.' },
  failed: { label: 'Failed', description: 'The payment did not go through. Nothing was taken.' },
  cancelled: { label: 'Cancelled', description: 'This gift was cancelled before payment.' },
  demo_not_processed: {
    label: 'Demo: not processed',
    description: 'Demo mode does not take payments. No money was moved.',
  },
};

export function givingStatusLabel(status: string) {
  return (
    givingStatusLabels[status] ?? {
      label: status,
      description: 'Check your giving history for the latest status.',
    }
  );
}

const lessonKindLabels: Record<string, string> = {
  reading: 'Reading',
  video: 'Video',
  audio: 'Audio',
  quiz: 'Quiz',
  assignment: 'Assignment',
  live: 'Live session',
};

export function lessonKindLabel(kind: string): string {
  return lessonKindLabels[kind] ?? kind;
}

const groupTypeLabels: Record<string, string> = {
  ministry: 'Ministry',
  fellowship: 'Fellowship',
  cell: 'Cell group',
  group: 'Group',
};

export function groupTypeLabel(type: string): string {
  return groupTypeLabels[type] ?? type;
}

const prayerVisibilityLabels: Record<string, { label: string; description: string }> = {
  pastoral_team: {
    label: 'Pastoral team only',
    description: 'Read by the pastoral team. Not shown to other members.',
  },
  prayer_team: {
    label: 'Prayer team',
    description: 'Read by the church’s prayer team. Not shown to other members.',
  },
  prayer_community: {
    label: 'Prayer community',
    description: 'Shared with members of the approved prayer community.',
  },
};

export function prayerVisibilityLabel(visibility: string) {
  return (
    prayerVisibilityLabels[visibility] ?? {
      label: visibility,
      description: '',
    }
  );
}
