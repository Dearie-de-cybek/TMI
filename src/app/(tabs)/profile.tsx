import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { TAB_BAR_HEIGHT } from '@/components/app/tab-bar';
import { BadgeShelf } from '@/components/content/badges';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/chips';
import { SettingsRow } from '@/components/ui/content-row';
import { useDialog } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/header';
import { Rise } from '@/components/ui/motion';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { env } from '@/config/env';
import { useRuntimeConfig } from '@/config/runtime';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { fetchCurrentDecree } from '@/features/devotion/api';
import { useBadges } from '@/features/devotion/badges';
import { useDevotionProgress } from '@/features/devotion/progress-store';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';
import { fetchEnrollments } from '@/features/learning/api';
import { formatDate } from '@/lib/datetime';
import { pluralise } from '@/lib/format';

/**
 * Me.
 *
 * Who you are, how you are keeping the altar, and everything you have made your
 * own - in that order. The numbers sit in white cards, the lists are grouped
 * rounded blocks, and the one coloured thing is the streak. A Give button stays
 * pinned under the lists.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const member = useAuth((state) => state.member);
  const signedIn = useAuth((state) => state.status === 'signedIn');
  const signOut = useAuth((state) => state.signOut);
  const requiresVerification = useAuth((state) => state.requiresVerification);
  const apiMode = useRuntimeConfig((state) => state.apiMode);
  const { confirm } = useDialog();

  useDevotionSync();
  const progress = useDevotionProgress();
  const badges = useBadges();

  const enrollments = useQuery({
    queryKey: queryKeys.enrollments,
    queryFn: fetchEnrollments,
    enabled: signedIn,
  });

  const decree = useQuery({
    queryKey: queryKeys.decree('current'),
    queryFn: ({ signal }) => fetchCurrentDecree(signal),
  });

  if (!signedIn || !member) {
    return (
      <Screen>
        <PageHeader title="Me" />
        <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
          <View style={styles.gutter}>
            <SignInPrompt
              title="Sign in to TwainMan Ministry"
              message="Your saved teaching, course progress, prayer requests and giving record all live with your account."
              reason="profile"
              next="/profile"
            />
          </View>

          <Group label="Settings">
            <SettingsRow
              label="Appearance and text size"
              icon="sun"
              onPress={() => router.push('/settings/appearance')}
            />
            <Rule inset={space.gutter} />
            <SettingsRow label="Prayer reminders" icon="bell" onPress={() => router.push('/devotion/reminders')} />
            <Rule inset={space.gutter} />
            <SettingsRow label="About TwainMan" icon="info" onPress={() => router.push('/about')} />
            <Rule inset={space.gutter} />
            <SettingsRow label="Help and contact" icon="help-circle" onPress={() => router.push('/settings/help')} />
            <Rule inset={space.gutter} />
            <SettingsRow label="Privacy policy" icon="shield" onPress={() => router.push('/legal/privacy')} />
            <Rule inset={space.gutter} />
            <SettingsRow label="Terms of use" icon="file-text" onPress={() => router.push('/legal/terms')} />
          </Group>
        </ScreenScroll>
      </Screen>
    );
  }

  const enrolledCount = enrollments.data?.data.length ?? 0;
  const totalDecrees = decree.data?.sections.length ?? 0;
  const prayedThisMonth =
    decree.data && progress.period === decree.data.period
      ? decree.data.sections.filter((section) => progress.prayedSectionIds.includes(section.id)).length
      : 0;

  return (
    <Screen>
      <PageHeader title="Me" />

      <ScreenScroll bottomSpace={space.xxl}>
        <View style={styles.identity}>
          <MemberAvatar size="xl" />
          <View style={styles.identityText}>
            <Text variant="title" numberOfLines={2}>
              {member.name}
            </Text>
            <Text variant="meta" color="textSecondary" numberOfLines={1}>
              {member.email}
            </Text>
            {member.joined_at ? (
              <Text variant="caption" color="textTertiary">
                With the church since {formatDate(member.joined_at)}
              </Text>
            ) : null}
            <View style={styles.editRow}>
              <Button
                label="Edit profile"
                variant="secondary"
                size="sm"
                onPress={() => router.push('/settings/profile')}
              />
            </View>
          </View>
        </View>

        {member.interests.length > 0 ? (
          <View style={[styles.gutter, styles.interests]}>
            {member.interests.slice(0, 4).map((interest) => (
              <Tag key={interest} label={interest} />
            ))}
          </View>
        ) : null}

        {requiresVerification || !member.email_verified ? (
          <View style={[styles.gutter, styles.verify]}>
            <Banner
              tone="warning"
              icon="mail"
              title="Your email is not verified yet"
              message="Verifying it lets the church reach you about courses and giving receipts."
              action={{ label: 'Verify now', onPress: () => router.push('/verify') }}
            />
          </View>
        ) : null}

        <Rise style={[styles.gutter, styles.stats]}>
          <View style={styles.statRow}>
            <StatCard
              label="Prayer streak"
              value={progress.streakDays}
              unit={progress.streakDays === 1 ? 'day' : 'days'}
              footnote={`Best: ${progress.longestStreakDays}`}
              icon="flash"
              accent={progress.streakDays > 0}
              onPress={() => router.push('/devotion')}
            />
            <StatCard
              label="Decrees prayed"
              value={prayedThisMonth}
              unit={totalDecrees > 0 ? `of ${totalDecrees}` : undefined}
              footnote="This month"
              icon="heart"
              onPress={() => router.push('/devotion')}
            />
          </View>
          <View style={styles.statRow}>
            <StatCard
              label="Words read"
              value={progress.readDevotionalIds.length}
              footnote="Daily devotionals"
              icon="book"
              onPress={() => router.push('/devotion/devotionals')}
            />
            <StatCard
              label="Courses"
              value={enrolledCount}
              footnote="Enrolled"
              icon="school"
              onPress={() => router.push('/courses')}
            />
          </View>
        </Rise>

        <View style={[styles.gutter, styles.badges]}>
          <BadgeShelf badges={badges} onViewAll={() => router.push('/badges')} />
        </View>

        <Group label="Your content">
          <SettingsRow label="Saved teaching" icon="bookmark" onPress={() => router.push('/saved')} />
          <Rule inset={space.gutter} />
          <SettingsRow
            label="Your courses"
            icon="book-open"
            value={enrolledCount > 0 ? pluralise(enrolledCount, 'course') : undefined}
            onPress={() => router.push('/courses')}
          />
          <Rule inset={space.gutter} />
          <SettingsRow label="Prayer requests" icon="heart" onPress={() => router.push('/prayer')} />
          <Rule inset={space.gutter} />
          <SettingsRow label="Giving history" icon="gift" onPress={() => router.push('/giving/history')} />
          <Rule inset={space.gutter} />
          <SettingsRow label="Ministries and groups" icon="users" onPress={() => router.push('/community')} />
        </Group>

        <Group label="Settings">
          <SettingsRow label="Notifications" icon="bell" onPress={() => router.push('/settings/notifications')} />
          <Rule inset={space.gutter} />
          <SettingsRow label="Prayer reminders" icon="clock" onPress={() => router.push('/devotion/reminders')} />
          <Rule inset={space.gutter} />
          <SettingsRow
            label="Appearance and text size"
            icon="sun"
            onPress={() => router.push('/settings/appearance')}
          />
          <Rule inset={space.gutter} />
          <SettingsRow
            label="Interests"
            icon="tag"
            value={member.interests.length > 0 ? `${member.interests.length} chosen` : 'None'}
            onPress={() => router.push('/interests')}
          />
        </Group>

        <Group label="Account">
          <SettingsRow label="Edit profile" icon="user" onPress={() => router.push('/settings/profile')} />
          <Rule inset={space.gutter} />
          <SettingsRow label="Password and security" icon="lock" onPress={() => router.push('/settings/security')} />
          <Rule inset={space.gutter} />
          <SettingsRow label="Account and data" icon="database" onPress={() => router.push('/settings/account')} />
        </Group>

        <Group label="Help">
          <SettingsRow label="About TwainMan" icon="info" onPress={() => router.push('/about')} />
          <Rule inset={space.gutter} />
          <SettingsRow label="Help and contact" icon="help-circle" onPress={() => router.push('/settings/help')} />
          <Rule inset={space.gutter} />
          <SettingsRow label="Privacy policy" icon="shield" onPress={() => router.push('/legal/privacy')} />
          <Rule inset={space.gutter} />
          <SettingsRow label="Terms of use" icon="file-text" onPress={() => router.push('/legal/terms')} />
          {env.allowModeSwitch ? (
            <>
              <Rule inset={space.gutter} />
              <SettingsRow
                label="Data source"
                icon="tool"
                value={apiMode === 'demo' ? 'Demo data' : 'Church server'}
                hint="Development only"
                onPress={() => router.push('/settings/data-source')}
              />
            </>
          ) : null}
        </Group>

        <Group label="">
          <SettingsRow
            label="Sign out"
            icon="log-out"
            destructive
            onPress={() =>
              void confirm({
                eyebrow: 'Your account',
                icon: 'log-out',
                title: 'Sign out?',
                message:
                  'Your saved teaching, course progress and giving record stay with your account.',
                confirmLabel: 'Sign out',
                cancelLabel: 'Stay signed in',
                destructive: true,
              }).then((confirmed) => {
                if (confirmed) void signOut().then(() => router.replace('/'));
              })
            }
          />
        </Group>
      </ScreenScroll>

      <View style={[styles.sticky, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Text variant="meta" color="textSecondary" style={styles.stickyCopy}>
          The work of the house is carried by people like you.
        </Text>
        <Button label="Give" variant="gold" icon="heart" size="lg" fullWidth onPress={() => router.push('/give')} />
      </View>
    </Screen>
  );
}

/** A white card with a big number, as on the activity page of a Bible app. */
function StatCard({
  label,
  value,
  unit,
  footnote,
  icon,
  accent = false,
  onPress,
}: {
  label: string;
  value: number;
  unit?: string;
  footnote?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      feedback="opacity"
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`}
      style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text variant="labelStrong" style={styles.statLabel}>
        {label}
      </Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit ? (
          <Text variant="meta" color="textSecondary" style={styles.statUnit}>
            {unit}
          </Text>
        ) : (
          <Ionicons name={icon} size={26} color={accent ? colors.primary : colors.textTertiary} />
        )}
      </View>
      {footnote ? (
        <Text variant="caption" color="textTertiary">
          {footnote}
        </Text>
      ) : null}
    </Pressable>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();

  return (
    <View style={styles.group}>
      {label ? (
        <Text variant="title" style={styles.groupLabel}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gutter: {
    paddingHorizontal: space.gutter,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.gutter,
    paddingBottom: space.lg,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  editRow: {
    paddingTop: space.md,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    paddingBottom: space.lg,
  },
  verify: {
    paddingBottom: space.lg,
  },
  stats: {
    paddingTop: space.md,
    gap: space.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  stat: {
    flex: 1,
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  statLabel: {
    letterSpacing: -0.1,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
  },
  statValue: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.5,
  },
  statUnit: {
    paddingBottom: 8,
  },
  badges: {
    paddingTop: space.xxl,
  },
  badgeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: space.lg,
  },
  group: {
    paddingTop: space.xxl,
    paddingHorizontal: space.gutter,
  },
  groupLabel: {
    paddingBottom: space.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sticky: {
    gap: space.sm,
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    paddingBottom: space.md,
    borderTopWidth: 1,
  },
  stickyCopy: {
    textAlign: 'center',
  },
});
