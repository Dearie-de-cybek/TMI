import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryKeys } from '@/api/query-client';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { TAB_BAR_HEIGHT } from '@/components/app/tab-bar';
import { DevotionCard } from '@/components/content/devotion';
import {
  CategoryCard,
  HeroCard,
  HeroCarousel,
  VerseHero,
  type HeroItem,
} from '@/components/content/home-cards';
import { LiveSessionStrip } from '@/components/content/featured';
import { AnnouncementRow, CourseRow, EventRow, SermonTile } from '@/components/content/rows';
import { Band } from '@/components/ui/band';
import { Banner } from '@/components/ui/banner';
import { Icon } from '@/components/ui/icon';
import { Rise } from '@/components/ui/motion';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SkeletonFeature, SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { churchImages } from '@/lib/artwork';
import { fetchCurrentDecree } from '@/features/devotion/api';
import { useDevotionProgress } from '@/features/devotion/progress-store';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';
import { fetchHomeFeed } from '@/features/home/api';

const categories: {
  title: string;
  description: string;
  href: Href;
  images: [number, number];
}[] = [
  {
    title: 'Sermons',
    description: 'Every teaching, with notes and a way to ask.',
    href: '/sermons',
    images: [churchImages.teachingSuit, churchImages.worshipLead],
  },
  {
    title: 'Prayer and devotion',
    description: 'The monthly decree and a word each day.',
    href: '/devotion',
    images: [churchImages.prayerHandsRaised, churchImages.prayerQuiet],
  },
  {
    title: 'Courses',
    description: 'Study with your cohort, lesson by lesson.',
    href: '/courses',
    images: [churchImages.teachingSeated, churchImages.teachingKeyboard],
  },
  {
    title: 'Events',
    description: 'Gatherings and conferences you can register for.',
    href: '/events',
    images: [churchImages.eventBlessingTheWork, churchImages.eventBackAndBetter],
  },
  {
    title: 'Ministries',
    description: 'Departments and fellowships to serve in.',
    href: '/community',
    images: [churchImages.fellowshipMen, churchImages.youthAuditorium],
  },
  {
    title: 'About TwainMan',
    description: 'Who we are, when we meet, what we believe.',
    href: '/about',
    images: [churchImages.congregationBanner, churchImages.communionTable],
  },
];

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
  const insets = useSafeAreaInsets();
  useDevotionSync();
  const streakDays = useDevotionProgress((state) => state.streakDays);
  const decree = useQuery({
    queryKey: queryKeys.decree('current'),
    queryFn: ({ signal }) => fetchCurrentDecree(signal),
  });
  const readDevotionalIds = useDevotionProgress((state) => state.readDevotionalIds);
  const firstName = feed?.member_first_name ?? member?.name.split(' ')[0] ?? null;

  const heroItems: HeroItem[] = [];
  if (feed?.devotional) {
    const devotional = feed.devotional;
    heroItems.push({
      key: 'verse',
      render: ({ width, height }) => (
        <VerseHero
          width={width}
          height={height}
          id={`verse-${devotional.id}`}
          artwork={devotional.artwork_url}
          verse={devotional.scripture_text}
          reference={devotional.scripture_reference}
          read={readDevotionalIds.includes(devotional.id)}
          onPress={() => router.push(`/devotion/devotional/${devotional.id}`)}
          onRead={() => router.push(`/devotion/devotional/${devotional.id}`)}
        />
      ),
    });
  }
  if (feed?.featured_sermon) {
    const sermon = feed.featured_sermon;
    heroItems.push({
      key: 'sermon',
      render: ({ width, height }) => (
        <HeroCard
          width={width}
          height={height}
          artwork={sermon.artwork_url}
          position="center"
          kicker={sermon.series?.title ?? 'Latest teaching'}
          title={sermon.title}
          subtitle={sermon.speaker.name}
          action="Listen or watch"
          label={`Latest teaching: ${sermon.title} by ${sermon.speaker.name}`}
          onPress={() => router.push(`/sermons/${sermon.id}`)}
        />
      ),
    });
  }
  if (decree.data) {
    const current = decree.data;
    heroItems.push({
      key: 'decree',
      render: ({ width, height }) => (
        <HeroCard
          width={width}
          height={height}
          artwork={current.artwork_url}
          kicker={`${current.month_label} · prophetic decree`}
          title={current.theme}
          subtitle={`From ${current.author}`}
          action="Pray this month’s decree"
          label={`This month's decree: ${current.theme}`}
          onPress={() => router.push('/devotion')}
        />
      ),
    });
  }

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Text variant="display" style={styles.greeting} numberOfLines={2}>
          {signedIn && firstName ? `${greeting()}, ${firstName}` : 'Welcome'}
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/devotion')}
            accessibilityLabel={
              streakDays > 0 ? `${streakDays} day prayer streak` : 'Start a prayer streak'
            }
            feedback="opacity"
            style={[styles.streak, { backgroundColor: colors.surfaceMuted }]}
          >
            <Ionicons name="flash" size={18} color={streakDays > 0 ? colors.primary : colors.textTertiary} />
            <Text variant="labelStrong">{streakDays}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            accessibilityLabel="Notifications"
            feedback="opacity"
            style={styles.bell}
          >
            <Ionicons name="notifications-outline" size={26} color={colors.text} />
            {(feed?.unread_notifications ?? 0) > 0 ? (
              <View style={[styles.dot, { backgroundColor: colors.primary, borderColor: colors.background }]} />
            ) : null}
          </Pressable>
        </View>
      </View>

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
          {/* Search. */}
          <View style={styles.gutter}>
            <Pressable
              onPress={() => router.push('/search')}
              accessibilityRole="search"
              accessibilityLabel="Search teaching, courses, events and more"
              feedback="opacity"
              style={[styles.search, { backgroundColor: colors.surfaceMuted }]}
            >
              <Ionicons name="search" size={20} color={colors.textTertiary} />
              <Text variant="body" color="textTertiary">
                Search teaching, courses, events…
              </Text>
            </Pressable>
          </View>

          {feed.live_session ? (
            <View style={[styles.gutter, styles.live]}>
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

          {/* The verse, the teaching, the month's decree — swipe through them. */}
          <Rise style={styles.carousel}>
            <HeroCarousel items={heroItems} />
          </Rise>

          {/* Prayer — where the member left off in this month's decree. */}
          <Rise delay={80} style={[styles.gutter, styles.block]}>
            <DevotionCard />
          </Rise>

          {/* Everything the church offers, one card each. */}
          <View style={[styles.gutter, styles.block]}>
            <Text variant="title" style={styles.sectionTitle}>
              Explore
            </Text>
            <View style={styles.categories}>
              {categories.map((category, index) => (
                <Rise key={category.title} delay={index * 50}>
                  <CategoryCard
                    title={category.title}
                    description={category.description}
                    images={category.images}
                    onPress={() => router.push(category.href)}
                  />
                </Rise>
              ))}
            </View>
          </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingBottom: space.lg,
  },
  greeting: {
    flex: 1,
    paddingTop: space.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
  bell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
  },
  live: {
    paddingTop: space.lg,
  },
  carousel: {
    paddingTop: space.xl,
  },
  block: {
    paddingTop: space.xxl,
  },
  sectionTitle: {
    paddingBottom: space.lg,
  },
  categories: {
    gap: space.md,
  },
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
