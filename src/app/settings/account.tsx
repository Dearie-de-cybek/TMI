import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { describeError } from '@/api/errors';
import { AuthShell } from '@/components/app/auth-shell';
import { useToast } from '@/components/app/toast';
import { useDialog } from '@/components/ui/dialog';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { env } from '@/config/env';
import { space } from '@/design/tokens';
import { requestAccountDeletion } from '@/features/auth/api';
import { useAuth } from '@/features/auth/store';
import { formatDate } from '@/lib/datetime';

/**
 * Account and data.
 *
 * Deletion is a request, not an immediate wipe: membership records, giving
 * history and course enrolments have retention rules the church office owns.
 * The screen says exactly that rather than implying a one-tap erase.
 */
const held = [
  'Your name, email address and any phone number you gave us.',
  'Your course enrolments, lesson progress and quiz attempts.',
  'Sermons you saved and where you stopped listening.',
  'Prayer requests you sent, visible to the audience you chose.',
  'Gifts recorded against your account, held by the church’s finance records.',
];

export default function AccountSettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const member = useAuth((state) => state.member);
  const signOut = useAuth((state) => state.signOut);
  const { confirm, notice } = useDialog();

  const requestDeletion = useMutation({
    mutationFn: () => requestAccountDeletion(),
    onSuccess: (result) => {
      toast('Deletion request sent to the church office.', { icon: 'check' });
      void notice({ eyebrow: 'Account', title: 'Request recorded', message: result.message });
    },
  });

  if (!member) {
    return (
      <AuthShell title="Account" description="Sign in to manage your account.">
        <Button label="Sign in" fullWidth onPress={() => router.replace('/sign-in')} />
      </AuthShell>
    );
  }

  const described = requestDeletion.error ? describeError(requestDeletion.error) : null;

  return (
    <AuthShell
      title="Account and data"
      description="What the church holds about you, and how to have it removed."
    >
      <View style={styles.summary}>
        <Text variant="metaStrong" color="textSecondary">
          Signed in as
        </Text>
        <Text variant="bodyLarge">{member.name}</Text>
        <Text variant="meta" color="textSecondary">
          {member.email}
        </Text>
        {member.joined_at ? (
          <Text variant="caption" color="textTertiary">
            Member record created {formatDate(member.joined_at)}
          </Text>
        ) : null}
      </View>

      <View style={styles.list}>
        <Text variant="metaStrong" color="textSecondary">
          What is held
        </Text>
        {held.map((item) => (
          <Text key={item} variant="meta" color="textSecondary" style={styles.listItem}>
            • {item}
          </Text>
        ))}
        <Text variant="caption" color="textTertiary">
          The church’s privacy policy is the authoritative statement, including how long each kind
          of record is kept.
        </Text>
      </View>

      {described ? <Banner tone="danger" title={described.title} message={described.message} /> : null}

      {requestDeletion.isSuccess ? (
        <Banner
          tone="success"
          icon="check-circle"
          title="Your request is with the church office"
          message="They will contact you about anything that has to be kept for financial or safeguarding reasons."
        />
      ) : (
        <Button
          label="Request account deletion"
          variant="danger"
          fullWidth
          loading={requestDeletion.isPending}
          onPress={() =>
            void confirm({
              eyebrow: 'Account and data',
              icon: 'alert-triangle',
              title: 'Request account deletion?',
              message:
                'This sends a request to the church office. Giving records and some membership details may have to be kept by law.',
              confirmLabel: 'Send request',
              destructive: true,
            }).then((confirmed) => {
              if (confirmed) requestDeletion.mutate();
            })
          }
        />
      )}

      <Button
        label="Contact the church office"
        variant="secondary"
        icon="mail"
        fullWidth
        onPress={() => router.push('/settings/help')}
      />

      <Button
        label="Sign out"
        variant="ghost"
        fullWidth
        onPress={() => {
          void signOut().then(() => router.replace('/'));
        }}
      />

      <Text variant="caption" color="textTertiary">
        Questions about your data can go to {env.church.email}.
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  summary: {
    gap: 2,
  },
  list: {
    gap: space.xs,
  },
  listItem: {
    paddingLeft: space.xs,
  },
});
