import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { TAB_BAR_HEIGHT } from '@/components/app/tab-bar';
import { Avatar } from '@/components/ui/avatar';
import { Banner } from '@/components/ui/banner';
import { Tag } from '@/components/ui/chips';
import { SettingsRow } from '@/components/ui/content-row';
import { PageHeader } from '@/components/ui/header';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { Eyebrow, Text } from '@/components/ui/text';
import { env } from '@/config/env';
import { useRuntimeConfig } from '@/config/runtime';
import { space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { fetchEnrollments } from '@/features/learning/api';
import { formatDate } from '@/lib/datetime';
import { pluralise } from '@/lib/format';

export default function ProfileScreen() {
  const router = useRouter();
  const member = useAuth((state) => state.member);
  const signedIn = useAuth((state) => state.status === 'signedIn');
  const signOut = useAuth((state) => state.signOut);
  const requiresVerification = useAuth((state) => state.requiresVerification);
  const apiMode = useRuntimeConfig((state) => state.apiMode);

  const enrollments = useQuery({
    queryKey: queryKeys.enrollments,
    queryFn: fetchEnrollments,
    enabled: signedIn,
  });

  if (!signedIn || !member) {
    return (
      <Screen>
        <PageHeader eyebrow="Your account" title="Profile" />
        <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
          <View style={styles.gutter}>
            <SignInPrompt
              title="Sign in to TwainMan Ministry"
              message="Your saved teaching, course progress, prayer requests and giving record all live with your account."
              reason="profile"
              next="/profile"
            />
          </View>

          <Group label="App">
            <SettingsRow
              label="Appearance and text size"
              icon="sun"
              onPress={() => router.push('/settings/appearance')}
            />
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

  return (
    <Screen>
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        actions={[
          { icon: 'edit-2', label: 'Edit profile', onPress: () => router.push('/settings/profile') },
        ]}
      />

      <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
        <View style={styles.identity}>
          <Avatar name={member.name} uri={member.avatar_url} size="xl" />
          <View style={styles.identityText}>
            <Text variant="title">{member.name}</Text>
            <Text variant="meta" color="textSecondary">
              {member.email}
            </Text>
            {member.joined_at ? (
              <Text variant="caption" color="textTertiary">
                With the church since {formatDate(member.joined_at)}
              </Text>
            ) : null}
            {member.interests.length > 0 ? (
              <View style={styles.interests}>
                {member.interests.slice(0, 3).map((interest) => (
                  <Tag key={interest} label={interest} />
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {requiresVerification || !member.email_verified ? (
          <View style={styles.gutter}>
            <Banner
              tone="warning"
              icon="mail"
              title="Your email is not verified yet"
              message="Verifying it lets the church reach you about courses and giving receipts."
              action={{ label: 'Verify now', onPress: () => router.push('/verify') }}
            />
          </View>
        ) : null}

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

        <Group label="Preferences">
          <SettingsRow
            label="Notifications"
            icon="bell"
            onPress={() => router.push('/settings/notifications')}
          />
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
              Alert.alert('Sign out?', 'Your saved content stays with your account.', [
                { text: 'Stay signed in', style: 'cancel' },
                {
                  text: 'Sign out',
                  style: 'destructive',
                  onPress: () => {
                    void signOut().then(() => router.replace('/'));
                  },
                },
              ])
            }
          />
        </Group>
      </ScreenScroll>
    </Screen>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      {label ? (
        <Eyebrow color="textTertiary" style={styles.groupLabel}>
          {label}
        </Eyebrow>
      ) : null}
      <Rule />
      {children}
      <Rule />
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
    paddingBottom: space.xxl,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    paddingTop: space.sm,
  },
  group: {
    paddingTop: space.xxl,
  },
  groupLabel: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.sm,
  },
});
