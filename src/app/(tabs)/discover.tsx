import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { TAB_BAR_HEIGHT } from '@/components/app/tab-bar';
import { CourseRow, SermonRow } from '@/components/content/rows';
import { PageHeader } from '@/components/ui/header';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { Section, SectionHeader } from '@/components/ui/section';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { fetchCourses } from '@/features/learning/api';
import { fetchSermons } from '@/features/sermons/api';

/**
 * Discover is the way into everything the church publishes. The five tabs do not
 * try to hold every feature — this screen is the index.
 */
const destinations: { href: Href; icon: IconName; title: string; description: string }[] = [
  {
    href: '/devotion',
    icon: 'sun',
    title: 'Prayer and devotion',
    description: 'The monthly decree, a daily word, and your streak.',
  },
  {
    href: '/sermons',
    icon: 'mic',
    title: 'Sermons',
    description: 'Every teaching, by speaker, series, topic or passage.',
  },
  {
    href: '/courses',
    icon: 'book-open',
    title: 'Courses and programmes',
    description: 'Discipleship courses, lessons and live sessions.',
  },
  {
    href: '/events',
    icon: 'calendar',
    title: 'Events',
    description: 'Gatherings, classes and anything you can register for.',
  },
  {
    href: '/announcements',
    icon: 'file-text',
    title: 'Announcements',
    description: 'Notices from the church and from your ministries.',
  },
  {
    href: '/community',
    icon: 'users',
    title: 'Ministries and groups',
    description: 'Where to serve and who to meet.',
  },
  {
    href: '/about',
    icon: 'info',
    title: 'About TwainMan',
    description: 'Who we are, when we meet and what we believe.',
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const colors = useColors();

  const recentSermons = useQuery({
    queryKey: queryKeys.sermons({ scope: 'discover-recent' }),
    queryFn: ({ signal }) => fetchSermons({ page: 1 }, signal),
    select: (response) => response.data.slice(0, 4),
  });

  const openCourses = useQuery({
    queryKey: queryKeys.courses({ scope: 'discover-open' }),
    queryFn: ({ signal }) => fetchCourses({ page: 1 }, signal),
    select: (response) =>
      response.data.filter((course) => course.enrollment_mode !== 'closed').slice(0, 3),
  });

  return (
    <Screen>
      <PageHeader eyebrow="Explore" title="Discover" />

      <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
        <Pressable
          onPress={() => router.push('/search')}
          accessibilityRole="search"
          accessibilityLabel="Search sermons, courses, events and more"
          style={[
            styles.searchField,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Icon name="search" size="sm" color="textTertiary" />
          <Text variant="body" color="textTertiary">
            Search teaching, courses, events…
          </Text>
        </Pressable>

        <View style={styles.destinations}>
          {destinations.map((destination, index) => (
            <View key={destination.title}>
              {index > 0 ? <Rule /> : null}
              <Pressable
                onPress={() => router.push(destination.href)}
                accessibilityLabel={destination.title}
                style={styles.destination}
              >
                <Icon name={destination.icon} size="md" color="primary" />
                <View style={styles.destinationText}>
                  <Text variant="bodyStrong">{destination.title}</Text>
                  <Text variant="meta" color="textSecondary">
                    {destination.description}
                  </Text>
                </View>
                <Icon name="chevron-right" size="sm" color="textTertiary" />
              </Pressable>
            </View>
          ))}
        </View>

        <Section>
          <View style={styles.gutter}>
            <SectionHeader
              eyebrow="Teaching"
              title="Recently preached"
              action={{ label: 'All sermons', onPress: () => router.push('/sermons') }}
            />
          </View>
          {recentSermons.isPending ? (
            <SkeletonList count={3} />
          ) : recentSermons.isError ? (
            <ErrorState compact error={recentSermons.error} onRetry={() => void recentSermons.refetch()} />
          ) : recentSermons.data.length === 0 ? (
            <EmptyState
              compact
              icon="mic"
              title="No sermons published yet"
              message="Teaching will appear here as soon as the media team publishes it."
            />
          ) : (
            recentSermons.data.map((sermon, index) => (
              <View key={sermon.id}>
                {index > 0 ? <Rule inset={space.gutter} /> : null}
                <SermonRow sermon={sermon} onPress={() => router.push(`/sermons/${sermon.id}`)} />
              </View>
            ))
          )}
        </Section>

        <Section>
          <View style={styles.gutter}>
            <SectionHeader
              eyebrow="Discipleship"
              title="Courses you can join"
              action={{ label: 'All courses', onPress: () => router.push('/courses') }}
            />
          </View>
          {openCourses.isPending ? (
            <SkeletonList count={2} />
          ) : openCourses.isError ? (
            <ErrorState compact error={openCourses.error} onRetry={() => void openCourses.refetch()} />
          ) : openCourses.data.length === 0 ? (
            <EmptyState
              compact
              icon="book-open"
              title="No open enrolments"
              message="The discipleship team opens courses through the year. Check back, or ask about the next cohort."
            />
          ) : (
            openCourses.data.map((course, index) => (
              <View key={course.id}>
                {index > 0 ? <Rule inset={space.gutter} /> : null}
                <CourseRow course={course} onPress={() => router.push(`/courses/${course.id}`)} />
              </View>
            ))
          )}
        </Section>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: {
    paddingHorizontal: space.gutter,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.gutter,
    marginBottom: space.xl,
    paddingHorizontal: space.lg,
    height: 48,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  destinations: {
    paddingTop: space.xs,
  },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  destinationText: {
    flex: 1,
    gap: 2,
  },
});
