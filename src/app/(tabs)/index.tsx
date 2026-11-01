import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { TAB_BAR_HEIGHT } from '@/components/app/tab-bar';
import { DevotionCard, VerseCard } from '@/components/content/devotion';
import { FeaturedSermon, LiveSessionStrip } from '@/components/content/featured';
import { AnnouncementRow, CourseRow, EventRow, SermonTile } from '@/components/content/rows';
import { Band } from '@/components/ui/band';
import { Banner } from '@/components/ui/banner';
import { PageHeader } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Rise } from '@/components/ui/motion';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SkeletonFeature, SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { useDevotionProgress } from '@/features/devotion/progress-store';
import { fetchHomeFeed } from '@/features/home/api';

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Home.
 *
 * A long page of unrelated things, so colour divides it into bands you can feel
 * without reading — and the tone means something rather than alternating for
 * decoration:
 *
 *   gold    → Scripture and the daily reading
 *   purple  → formation: your courses, and prayer
 *   ivory   → the life of the house: what is on, and notices
 *
 * Every band is still conditional on the backend sending content for it, so a
 * new member, a signed-out visitor and a member mid-course each get a page about
 * them rather than a grid of empty frames.
 */
export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const signedIn = useAuth((state) => state.status === 'signedIn');
  const member = useAuth((state) => state.member);

  const home = useQuery({
    queryKey: queryKeys.home,
    queryFn: ({ signal }) => fetchHomeFeed(signal),
  });

  const feed = home.data;
  const readDevotionalIds = useDevotionProgress((state) => state.readDevotionalIds);
  const firstName = feed?.member_first_name ?? member?.name.split(' ')[0] ?? null;

  return (
    <Screen>
      <PageHeader
        eyebrow={signedIn ? greeting() : 'TwainMan Ministry'}
        title={firstName ? firstName : 'Welcome'}
        actions={[
          { icon: 'search', label: 'Search', onPress: () => router.push('/search') },
          {
            icon: 'bell',
            label: 'Notifications',
            onPress: () => router.push('/notifications'),
            badge: feed?.unread_notifications ?? 0,
          },
        ]}
      />

      {home.isPending ? (
        <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
          <SkeletonFeature />
          <SkeletonList count={3} />
        </ScreenScroll>
      ) : home.isError || !feed ? (
        <ErrorState error={home.error} onRetry={() => void home.refetch()} />
      ) : (
        <ScreenScroll
          refreshing={home.isFetching}
          onRefresh={() => void home.refetch()}
          bottomSpace={TAB_BAR_HEIGHT + space.xxl}
        >
          {/* The teaching, and whatever is happening right now. */}
          <Band flush>
            {feed.live_session ? (
              <View style={styles.gutter}>
                <LiveSessionStrip
                  session={feed.live_session}
                  onPress={() =>
                    feed.live_session?.course_id
                      ? router.push(`/courses/${feed.live_session.course_id}`)
                      : router.push('/discover')
                  }
                />
              </View>
            ) : null}

            {feed.featured_sermon ? (
              <FeaturedSermon
                sermon={feed.featured_sermon}
                eyebrow={feed.featured_sermon.series?.title ?? 'Latest teaching'}
                onPress={() => router.push(`/sermons/${feed.featured_sermon!.id}`)}
              />
            ) : null}
          </Band>

          {/* Scripture — the way into the daily devotional. */}
          {feed.devotional ? (
            <Band tone="accent">
              <Rise style={styles.gutter}>
                <VerseCard
                  devotional={feed.devotional}
                  read={readDevotionalIds.includes(feed.devotional.id)}
                  onPress={() => router.push(`/devotion/devotional/${feed.devotional!.id}`)}
                />
                <View style={styles.devotionLinks}>
                  <Pressable
                    onPress={() => router.push('/devotion/devotionals')}
                    accessibilityLabel="Earlier devotionals"
                    inline
                  >
                    <Text variant="labelStrong" color="primary">
                      Earlier days
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/devotion')}
                    accessibilityLabel="Prayer and devotion"
                    inline
                  >
                    <Text variant="labelStrong" color="primary">
                      Prayer and devotion
                    </Text>
                  </Pressable>
                </View>
              </Rise>
            </Band>
          ) : null}

          {/* Prayer — where the member left off in this month's decree. */}
          <Band>
            <Rise delay={80} style={styles.gutter}>
              <DevotionCard />
            </Rise>
          </Band>

          {/* Formation. */}
          <Band tone="primary">
            <View style={styles.gutter}>
              <SectionHeader
                eyebrow="Keep going"
                title={signedIn && feed.continue_learning.length > 0 ? 'Your courses' : 'Discipleship'}
                action={{ label: 'All courses', onPress: () => router.push('/courses') }}
              />
            </View>
            {signedIn && feed.continue_learning.length > 0 ? (
              feed.continue_learning.map((course, index) => (
                <View key={course.id}>
                  {index > 0 ? <Rule inset={space.gutter} /> : null}
                  <CourseRow course={course} onPress={() => router.push(`/courses/${course.id}`)} />
                </View>
              ))
            ) : (
              <View style={styles.gutter}>
                <Banner
                  tone="accent"
                  title={signedIn ? 'Not in a course yet' : 'Courses run through the year'}
                  message="The discipleship team opens short courses through the year — have a look at what is open."
                  action={{ label: 'Browse courses', onPress: () => router.push('/courses') }}
                />
              </View>
            )}
          </Band>

          {/* The life of the house. */}
          <Band>
            <View style={styles.gutter}>
              <SectionHeader
                eyebrow="What is on"
                title="Coming up"
                action={{ label: 'All events', onPress: () => router.push('/events') }}
              />
            </View>
            {feed.upcoming_events.length === 0 ? (
              <EmptyState
                compact
                icon="calendar"
                title="Nothing scheduled yet"
                message="When the church publishes its next gathering it will appear here."
              />
            ) : (
              feed.upcoming_events.map((event, index) => (
                <View key={event.id}>
                  {index > 0 ? <Rule inset={space.gutter} /> : null}
                  <EventRow event={event} onPress={() => router.push(`/events/${event.id}`)} />
                </View>
              ))
            )}
          </Band>

          {feed.announcements.length > 0 ? (
            <Band tone="neutral">
              <View style={styles.gutter}>
                <SectionHeader
                  eyebrow="From the church"
                  title="Announcements"
                  action={{ label: 'See all', onPress: () => router.push('/announcements') }}
                />
              </View>
              {feed.announcements.map((announcement, index) => (
                <View key={announcement.id}>
                  {index > 0 ? <Rule inset={space.gutter} /> : null}
                  <AnnouncementRow
                    announcement={announcement}
                    onPress={() => router.push(`/announcements/${announcement.id}`)}
                  />
                </View>
              ))}
            </Band>
          ) : null}

          {signedIn && feed.recently_saved.length > 0 ? (
            <Band>
              <View style={styles.gutter}>
                <SectionHeader
                  eyebrow="Saved"
                  title="Come back to"
                  action={{ label: 'Saved', onPress: () => router.push('/saved') }}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tiles}
              >
                {feed.recently_saved.map((sermon) => (
                  <SermonTile
                    key={sermon.id}
                    sermon={sermon}
                    onPress={() => router.push(`/sermons/${sermon.id}`)}
                  />
                ))}
              </ScrollView>
            </Band>
          ) : null}

          {/* Prayer — back to the ministry's own colour. */}
          <Band tone="primary">
            <View style={styles.gutter}>
              <SectionHeader eyebrow="Prayer" title="Ask the church to pray" />
              <Text variant="body" color="textSecondary" style={styles.prayerCopy}>
                {signedIn && feed.my_prayer_summary && feed.my_prayer_summary.open_count > 0
                  ? `You have ${feed.my_prayer_summary.open_count} request${
                      feed.my_prayer_summary.open_count === 1 ? '' : 's'
                    } with the prayer team.`
                  : 'Send a request to the pastoral team, or to the prayer community if you would like it shared.'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/prayer')}
              style={[styles.prayerAction, { borderColor: colors.border }]}
              accessibilityLabel="Open prayer"
            >
              <Icon name="heart" size="md" color="primary" />
              <Text variant="labelStrong" style={styles.prayerLabel}>
                {signedIn ? 'Your prayer requests' : 'Prayer and pastoral care'}
              </Text>
              <Icon name="chevron-right" size="sm" color="textTertiary" />
            </Pressable>
          </Band>

          {!signedIn ? (
            <Band>
              <View style={styles.gutter}>
                <SignInPrompt
                  title="Sign in to make it yours"
                  message="Signing in keeps your place in a message, your course progress, your saved teaching and your giving record."
                  reason="profile"
                />
              </View>
            </Band>
          ) : null}
        </ScreenScroll>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  devotionLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: space.lg,
  },
  gutter: {
    paddingHorizontal: space.gutter,
  },
  tiles: {
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
  },
  prayerCopy: {
    paddingBottom: space.md,
  },
  prayerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  prayerLabel: {
    flex: 1,
  },
});
