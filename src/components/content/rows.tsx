import { StyleSheet, View } from 'react-native';

import {
  type Announcement,
  type ChurchEvent,
  type CourseSummary,
  type Group,
  type Sermon,
} from '@/api/schemas';
import { ContentRow } from '@/components/ui/content-row';
import { ContentImage } from '@/components/ui/content-image';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { ProgressBar } from '@/components/ui/progress';
import { Tag } from '@/components/ui/chips';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import {
  formatDateShort,
  formatDateTimeWithZone,
  formatMinutes,
  formatRelative,
  isPast,
} from '@/lib/datetime';
import { eventFormatLabel, groupTypeLabel, joinMeta, pluralise } from '@/lib/format';

/** Longest media duration a sermon has, for the "38 min" metadata. */
function sermonLength(sermon: Sermon): number | null {
  return sermon.audio?.duration_seconds ?? sermon.video?.duration_seconds ?? null;
}

export function SermonRow({ sermon, onPress }: { sermon: Sermon; onPress: () => void }) {
  const length = sermonLength(sermon);
  const progress = sermon.progress;
  const fraction =
    progress && progress.duration_seconds
      ? progress.position_seconds / progress.duration_seconds
      : null;

  return (
    <ContentRow
      eyebrow={sermon.series?.title ?? sermon.topics[0]}
      title={sermon.title}
      meta={joinMeta([
        sermon.speaker.name,
        formatDateShort(sermon.preached_at),
        formatMinutes(length),
      ])}
      thumbnailSeed={sermon.title}
      thumbnailUri={sermon.artwork_url}
      onPress={onPress}
      accessoryIcon={sermon.saved ? 'bookmark' : 'chevron-right'}
      footer={
        fraction != null && fraction > 0.02 && !progress?.completed ? (
          <View style={styles.rowProgress}>
            <ProgressBar value={fraction} accessibilityLabel="Listening progress" />
          </View>
        ) : progress?.completed ? (
          <Text variant="caption" color="success" style={styles.rowProgress}>
            Finished
          </Text>
        ) : null
      }
    />
  );
}

/**
 * Events lead with a date plate rather than artwork — the date is the thing a
 * member scans for, and most church events have no image.
 */
export function EventRow({ event, onPress }: { event: ChurchEvent; onPress: () => void }) {
  const colors = useColors();
  const date = new Date(event.starts_at);
  const past = isPast(event.starts_at);
  const registered = event.registration.my_status === 'registered';

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${event.title}. ${formatDateTimeWithZone(event.starts_at, event.timezone)}`}
      style={styles.eventRow}
    >
      <View style={[styles.datePlate, { backgroundColor: colors.surfaceMuted, opacity: past ? 0.6 : 1 }]}>
        <Text style={[styles.dateDay, { color: colors.text }]}>
          {new Intl.DateTimeFormat(undefined, { day: 'numeric', timeZone: event.timezone }).format(date)}
        </Text>
        <Text variant="caption" color="textSecondary" uppercase>
          {new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: event.timezone }).format(date)}
        </Text>
      </View>

      <View style={styles.eventBody}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {event.title}
        </Text>
        <Text variant="meta" color="textSecondary" numberOfLines={1}>
          {joinMeta([
            formatDateTimeWithZone(event.starts_at, event.timezone),
            eventFormatLabel(event.format),
          ])}
        </Text>
        {event.venue_name ? (
          <Text variant="caption" color="textTertiary" numberOfLines={1}>
            {event.venue_name}
          </Text>
        ) : null}
        {registered ? (
          <View style={styles.eventTag}>
            <Tag label="You are registered" tone="success" icon="check" />
          </View>
        ) : event.registration.my_status === 'waitlisted' ? (
          <View style={styles.eventTag}>
            <Tag label="On the waiting list" tone="warning" />
          </View>
        ) : null}
      </View>

      <Icon name="chevron-right" size="sm" color="textTertiary" />
    </Pressable>
  );
}

export function CourseRow({ course, onPress }: { course: CourseSummary; onPress: () => void }) {
  const enrollment = course.my_enrollment;

  const tag =
    enrollment?.status === 'completed'
      ? { label: 'Completed', tone: 'success' as const }
      : enrollment
        ? null
        : course.enrollment_mode === 'code_required'
          ? { label: 'Access code', tone: 'accent' as const }
          : course.enrollment_mode === 'closed'
            ? { label: 'Closed', tone: 'neutral' as const }
            : course.enrollment_mode === 'invite_only'
              ? { label: 'By invitation', tone: 'neutral' as const }
              : { label: 'Open', tone: 'primary' as const };

  return (
    <ContentRow
      eyebrow={course.instructors[0]?.name}
      title={course.title}
      meta={joinMeta([
        course.lesson_count > 0 ? pluralise(course.lesson_count, 'lesson') : null,
        course.starts_at ? `From ${formatDateShort(course.starts_at)}` : null,
      ])}
      thumbnailSeed={course.title}
      thumbnailUri={course.artwork_url}
      thumbnailSize={72}
      thumbnailWidth={96}
      onPress={onPress}
      footer={
        <View style={styles.courseFooter}>
          {enrollment && enrollment.status !== 'completed' ? (
            <ProgressBar
              value={enrollment.percent_complete / 100}
              label={`${enrollment.completed_lessons} of ${enrollment.total_lessons} lessons`}
            />
          ) : null}
          {tag ? <Tag label={tag.label} tone={tag.tone} /> : null}
        </View>
      }
    />
  );
}

export function AnnouncementRow({
  announcement,
  onPress,
}: {
  announcement: Announcement;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${announcement.read ? '' : 'Unread. '}${announcement.title}`}
      style={styles.announcementRow}
    >
      <View style={styles.announcementMarker}>
        {announcement.read ? null : (
          <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
        )}
      </View>
      <View style={styles.announcementBody}>
        <View style={styles.announcementMeta}>
          {announcement.pinned ? <Icon name="bookmark" size="xs" color="accent" /> : null}
          <Eyebrow color="textTertiary">
            {joinMeta([
              announcement.scope.name ?? (announcement.scope.type === 'church' ? 'Church-wide' : null),
              formatRelative(announcement.published_at),
            ])}
          </Eyebrow>
        </View>
        <Text variant={announcement.read ? 'bodyStrong' : 'bodyStrong'} numberOfLines={2}>
          {announcement.title}
        </Text>
        {announcement.excerpt ? (
          <Text variant="meta" color="textSecondary" numberOfLines={2}>
            {announcement.excerpt}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function GroupRow({ group, onPress }: { group: Group; onPress: () => void }) {
  return (
    <ContentRow
      eyebrow={groupTypeLabel(group.type)}
      title={group.name}
      meta={joinMeta([
        group.meeting_schedule,
        group.member_count != null ? pluralise(group.member_count, 'member') : null,
      ])}
      thumbnailSeed={group.name}
      thumbnailUri={group.artwork_url}
      thumbnailSize={52}
      onPress={onPress}
      footer={
        group.membership.status === 'member' ? (
          <View style={styles.eventTag}>
            <Tag label="You are a member" tone="success" icon="check" />
          </View>
        ) : group.membership.status === 'pending' ? (
          <View style={styles.eventTag}>
            <Tag label="Request pending" tone="warning" />
          </View>
        ) : null
      }
    />
  );
}

/** Horizontal card for the "continue listening" strip on Home. */
export function SermonTile({ sermon, onPress }: { sermon: Sermon; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={sermon.title} style={styles.tile} feedback="opacity">
      <ContentImage
        uri={sermon.artwork_url}
        seed={sermon.title}
        width={152}
        height={108}
        style={{ borderRadius: radius.md }}
      />
      <Text variant="metaStrong" numberOfLines={2} style={styles.tileTitle}>
        {sermon.title}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {sermon.speaker.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowProgress: {
    marginTop: space.xs,
    maxWidth: 220,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  datePlate: {
    width: 56,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xs,
  },
  dateDay: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    lineHeight: 28,
  },
  eventBody: {
    flex: 1,
    gap: 2,
  },
  eventTag: {
    marginTop: space.xs,
  },
  courseFooter: {
    gap: space.sm,
    marginTop: space.xs,
    alignItems: 'flex-start',
  },
  announcementRow: {
    flexDirection: 'row',
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
    gap: space.sm,
  },
  announcementMarker: {
    width: 10,
    paddingTop: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  announcementBody: {
    flex: 1,
    gap: 3,
  },
  announcementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  tile: {
    width: 152,
    gap: space.xs,
    minHeight: 0,
  },
  tileTitle: {
    marginTop: space.xs,
  },
});
