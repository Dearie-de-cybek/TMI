import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { describeError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type PrayerRequest } from '@/api/schemas';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { useToast } from '@/components/app/toast';
import { useDialog } from '@/components/ui/dialog';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/chips';
import { NavBar } from '@/components/ui/header';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { useIsSignedIn } from '@/features/auth/use-require-auth';
import { fetchMyPrayerRequests, fetchPastoralCare, withdrawPrayerRequest } from '@/features/prayer/api';
import { formatRelative } from '@/lib/datetime';
import { isSafeExternalUrl } from '@/lib/deep-links';
import { prayerVisibilityLabel } from '@/lib/format';

const statusTones: Record<PrayerRequest['status'], { label: string; tone: 'neutral' | 'primary' | 'success' }> =
  {
    submitted: { label: 'Received', tone: 'neutral' },
    in_prayer: { label: 'Being prayed for', tone: 'primary' },
    answered: { label: 'Answered', tone: 'success' },
    closed: { label: 'Closed', tone: 'neutral' },
  };

/**
 * Prayer.
 *
 * A member's own requests are the only ones shown. Nothing here is shared into
 * a public feed, and the screen says what each visibility option actually means
 * rather than promising confidentiality the church's systems cannot guarantee.
 */
export default function PrayerScreen() {
  const router = useRouter();
  const signedIn = useIsSignedIn();

  const requests = useQuery({
    queryKey: queryKeys.prayerRequests,
    queryFn: ({ signal }) => fetchMyPrayerRequests(signal),
    enabled: signedIn,
  });

  const care = useQuery({
    queryKey: queryKeys.pastoralCare,
    queryFn: fetchPastoralCare,
  });

  return (
    <Screen>
      <NavBar title="Prayer" />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.intro}>
          <Text variant="title">Ask the church to pray with you</Text>
          <Text variant="body" color="textSecondary">
            Requests go to the people you choose — the pastoral team, the prayer team, or the
            approved prayer community. They are never posted publicly in the app.
          </Text>
          <Button
            label="Send a prayer request"
            icon="edit-3"
            onPress={() => router.push('/prayer/new')}
            style={styles.introButton}
          />
        </View>

        {signedIn ? (
          <>
            <View style={styles.gutter}>
              <SectionHeader title="Your requests" />
            </View>
            {requests.isPending ? (
              <SkeletonList count={2} withThumbnail={false} />
            ) : requests.isError ? (
              <ErrorState compact error={requests.error} onRetry={() => void requests.refetch()} />
            ) : requests.data.data.length === 0 ? (
              <EmptyState
                compact
                icon="heart"
                title="You have not sent a request"
                message="When you do, you will be able to follow its status here and withdraw it at any time."
              />
            ) : (
              requests.data.data.map((request, index) => (
                <View key={request.id}>
                  {index > 0 ? <Rule inset={space.gutter} /> : null}
                  <RequestCard request={request} />
                </View>
              ))
            )}
          </>
        ) : (
          <View style={[styles.gutter, styles.signIn]}>
            <SignInPrompt
              title="Sign in to follow your requests"
              message="Signing in lets the pastoral team connect a request to you, and lets you see its status or withdraw it."
              reason="prayer"
              next="/prayer"
            />
          </View>
        )}

        <View style={styles.gutter}>
          <SectionHeader
            eyebrow="Pastoral care"
            title="Talk to someone"
            description="These are the routes the church has published. The app does not create its own."
          />
        </View>

        {care.isPending ? (
          <SkeletonList count={2} withThumbnail={false} />
        ) : care.isError ? (
          <ErrorState compact error={care.error} onRetry={() => void care.refetch()} />
        ) : (
          <>
            {care.data.contacts.map((contact, index) => (
              <View key={contact.id}>
                {index > 0 ? <Rule inset={space.gutter} /> : null}
                <ContactRow contact={contact} />
              </View>
            ))}
            {care.data.confidentiality_note ? (
              <View style={[styles.gutter, styles.note]}>
                <Banner tone="info" icon="shield" message={care.data.confidentiality_note} />
              </View>
            ) : null}
          </>
        )}
      </ScreenScroll>
    </Screen>
  );
}

function RequestCard({ request }: { request: PrayerRequest }) {
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { confirm } = useDialog();
  const status = statusTones[request.status];
  const visibility = prayerVisibilityLabel(request.visibility);

  const withdraw = useMutation({
    mutationFn: () => withdrawPrayerRequest(request.id),
    onSuccess: () => {
      toast('Your request has been withdrawn.', { icon: 'heart' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.prayerRequests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
    onError: (error) => toast(describeError(error).message, { tone: 'warning' }),
  });

  function confirmWithdraw() {
    void confirm({
      eyebrow: 'Prayer request',
      icon: 'trash-2',
      title: 'Withdraw this request?',
      message: 'It will be removed from the prayer list. This cannot be undone.',
      confirmLabel: 'Withdraw',
      cancelLabel: 'Keep it',
      destructive: true,
    }).then((confirmed) => {
      if (confirmed) withdraw.mutate();
    });
  }

  return (
    <View style={styles.request}>
      <View style={styles.requestHeader}>
        <Tag label={status.label} tone={status.tone} />
        <Text variant="caption" color="textTertiary">
          {formatRelative(request.created_at)}
        </Text>
      </View>
      <Text variant="body">{request.body}</Text>
      <View style={styles.requestMeta}>
        <Icon name="eye" size="xs" color="textTertiary" />
        <Text variant="caption" color="textTertiary">
          {visibility.label}
          {request.is_anonymous ? ' · sent anonymously' : ''}
        </Text>
      </View>

      {request.follow_ups.length > 0 ? (
        <View style={[styles.followUps, { borderLeftColor: colors.border }]}>
          {request.follow_ups.map((followUp) => (
            <View key={followUp.id} style={styles.followUp}>
              <Text variant="caption" color="textTertiary">
                Update · {formatRelative(followUp.created_at)}
              </Text>
              <Text variant="meta">{followUp.body}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {request.can_withdraw ? (
        <Pressable
          inline
          onPress={confirmWithdraw}
          disabled={withdraw.isPending}
          accessibilityLabel="Withdraw this request"
          style={styles.withdraw}
        >
          <Text variant="metaStrong" color="danger">
            {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ContactRow({
  contact,
}: {
  contact: { id: string; label: string; description?: string | null; kind: string; value: string; availability?: string | null };
}) {
  const toast = useToast();

  const icons: Record<string, IconName> = {
    phone: 'phone',
    email: 'mail',
    whatsapp: 'message-circle',
    form: 'external-link',
    in_person: 'map-pin',
  };

  async function open() {
    const target =
      contact.kind === 'phone'
        ? `tel:${contact.value.replace(/\s/g, '')}`
        : contact.kind === 'email'
          ? `mailto:${contact.value}`
          : contact.value;

    if (contact.kind === 'form' || contact.kind === 'whatsapp') {
      if (!isSafeExternalUrl(target)) {
        toast('That link is not valid.', { tone: 'warning' });
        return;
      }
      await WebBrowser.openBrowserAsync(target);
      return;
    }

    if (contact.kind === 'in_person') return;

    const supported = await Linking.canOpenURL(target).catch(() => false);
    if (!supported) {
      toast('This device cannot open that.', { tone: 'warning' });
      return;
    }
    await Linking.openURL(target);
  }

  return (
    <Pressable
      onPress={contact.kind === 'in_person' ? undefined : () => void open()}
      accessibilityLabel={`${contact.label}. ${contact.value}`}
      style={styles.contact}
    >
      <Icon name={icons[contact.kind] ?? 'info'} size="md" color="primary" />
      <View style={styles.contactText}>
        <Text variant="bodyStrong">{contact.label}</Text>
        {contact.description ? (
          <Text variant="meta" color="textSecondary">
            {contact.description}
          </Text>
        ) : null}
        <Text variant="caption" color="textTertiary">
          {contact.value}
          {contact.availability ? ` · ${contact.availability}` : ''}
        </Text>
      </View>
      {contact.kind === 'in_person' ? null : <Icon name="chevron-right" size="sm" color="textTertiary" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gutter: {
    paddingHorizontal: space.gutter,
  },
  intro: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    gap: space.md,
  },
  introButton: {
    marginTop: space.sm,
  },
  signIn: {
    paddingTop: space.xl,
  },
  request: {
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
    gap: space.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  followUps: {
    borderLeftWidth: 2,
    paddingLeft: space.md,
    gap: space.sm,
    marginTop: space.xs,
  },
  followUp: {
    gap: 2,
  },
  withdraw: {
    minHeight: 0,
    paddingTop: space.xs,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  note: {
    paddingTop: space.lg,
    borderRadius: radius.sm,
  },
});
