import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { TAB_BAR_HEIGHT } from '@/components/app/tab-bar';
import { CoverTile, MinistryCard, QuickTile, Shelf } from '@/components/content/discover-cards';
import { PageHeader } from '@/components/ui/header';
import { Rise } from '@/components/ui/motion';
import { Pressable } from '@/components/ui/pressable';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { fetchGroups } from '@/features/community/api';
import { fetchEvents } from '@/features/events/api';
import { fetchCourses } from '@/features/learning/api';
import { fetchSermons } from '@/features/sermons/api';
import { formatDate } from '@/lib/datetime';

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Discover is the way into everything the church publishes: six quick links,
 * then shelves of covers you can swipe through. The tabs do not try to hold
 * every feature — this screen is the index.
 */
const quickLinks: { href: Href; icon: IoniconName; title: string }[] = [
  { href: '/devotion', icon: 'sunny-outline', title: 'Devotion' },
  { href: '/sermons', icon: 'mic-outline', title: 'Sermons' },
  { href: '/courses', icon: 'book-outline', title: 'Courses' },
  { href: '/events', icon: 'calendar-outline', title: 'Events' },
  { href: '/community', icon: 'people-outline', title: 'Ministries' },
  { href: '/announcements', icon: 'megaphone-outline', title: 'Notices' },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const colors = useColors();

  const recentSermons = useQuery({
    queryKey: queryKeys.sermons({ scope: 'discover-recent' }),
    queryFn: ({ signal }) => fetchSermons({ page: 1 }, signal),
    select: (response) => response.data.slice(0, 8),
  });

  const ministries = useQuery({
    queryKey: queryKeys.groups({ scope: 'discover' }),
    queryFn: ({ signal }) => fetchGroups({}, signal),
    select: (response) => response.data.slice(0, 10),
  });

  const upcoming = useQuery({
    queryKey: queryKeys.events('discover-upcoming'),
    queryFn: ({ signal }) => fetchEvents('upcoming', 1, signal),
    select: (response) => response.data.slice(0, 8),
  });

  const openCourses = useQuery({
    queryKey: queryKeys.courses({ scope: 'discover-open' }),
    queryFn: ({ signal }) => fetchCourses({ page: 1 }, signal),
    select: (response) =>
      response.data.filter((course) => course.enrollment_mode !== 'closed').slice(0, 8),
  });

  const pairs: (typeof quickLinks)[] = [];
  for (let i = 0; i < quickLinks.length; i += 2) pairs.push(quickLinks.slice(i, i + 2));

  return (
    <Screen>
      <PageHeader title="Discover" />

      <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
        <View style={styles.gutter}>
          <Pressable
            onPress={() => router.push('/search')}
            accessibilityRole="search"
            accessibilityLabel="Search sermons, courses, events and more"
            feedback="opacity"
            style={[styles.search, { backgroundColor: colors.surfaceMuted }]}
          >
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <Text variant="body" color="textTertiary">
              Search teaching, courses, events…
            </Text>
          </Pressable>
        </View>

        <Rise style={[styles.gutter, styles.quickGrid]}>
          {pairs.map((pair, rowIndex) => (
            <View key={rowIndex} style={styles.quickRow}>
              {pair.map((link) => (
                <QuickTile
                  key={link.title}
                  icon={link.icon}
                  title={link.title}
                  onPress={() => router.push(link.href)}
                />
              ))}
            </View>
          ))}
        </Rise>

        <Shelf
          title="Recently preached"
          action={{ label: 'See all', onPress: () => router.push('/sermons') }}
        >
          {recentSermons.isPending ? (
            <View style={styles.shelfState}>
              <SkeletonList count={1} />
            </View>
          ) : recentSermons.isError ? (
            <View style={styles.shelfState}>
              <ErrorState compact error={recentSermons.error} onRetry={() => void recentSermons.refetch()} />
            </View>
          ) : recentSermons.data.length === 0 ? (
            <View style={styles.shelfState}>
              <EmptyState
                compact
                icon="mic"
                title="No sermons published yet"
                message="Teaching will appear here as soon as the media team publishes it."
              />
            </View>
          ) : (
            recentSermons.data.map((sermon) => (
              <CoverTile
                key={sermon.id}
                artwork={sermon.artwork_url}
                seed={sermon.title}
                kicker={sermon.speaker.name}
                title={sermon.title}
                onPress={() => router.push(`/sermons/${sermon.id}`)}
              />
            ))
          )}
        </Shelf>

        {ministries.data && ministries.data.length > 0 ? (
          <Shelf
            title="Ministries"
            action={{ label: 'See all', onPress: () => router.push('/community') }}
          >
            {ministries.data.map((group) => (
              <MinistryCard
                key={group.id}
                group={group}
                width={168}
                onPress={() => router.push(`/community/${group.id}`)}
              />
            ))}
          </Shelf>
        ) : null}

        {upcoming.data && upcoming.data.length > 0 ? (
          <Shelf
            title="Coming up"
            action={{ label: 'See all', onPress: () => router.push('/events') }}
          >
            {upcoming.data.map((event) => (
              <CoverTile
                key={event.id}
                artwork={event.artwork_url}
                seed={event.title}
                kicker={formatDate(event.starts_at)}
                title={event.title}
                onPress={() => router.push(`/events/${event.id}`)}
              />
            ))}
          </Shelf>
        ) : null}

        {openCourses.data && openCourses.data.length > 0 ? (
          <Shelf
            title="Courses you can join"
            action={{ label: 'See all', onPress: () => router.push('/courses') }}
          >
            {openCourses.data.map((course) => (
              <CoverTile
                key={course.id}
                artwork={course.artwork_url}
                seed={course.title}
                kicker="Course"
                title={course.title}
                onPress={() => router.push(`/courses/${course.id}`)}
              />
            ))}
          </Shelf>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: {
    paddingHorizontal: space.gutter,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
  },
  quickGrid: {
    paddingTop: space.lg,
    gap: space.md,
  },
  quickRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  shelfState: {
    width: 320,
  },
});
