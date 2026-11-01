import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { type GivingStatus } from '@/api/schemas';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/ui/header';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { fetchGivingIntent } from '@/features/giving/api';
import { formatDateTimeWithZone } from '@/lib/datetime';
import { isSafeExternalUrl } from '@/lib/deep-links';
import { formatMoney, givingStatusLabel } from '@/lib/format';

const presentation: Record<
  GivingStatus,
  { icon: IconName; tone: 'success' | 'warning' | 'danger' | 'info' }
> = {
  pending: { icon: 'clock', tone: 'warning' },
  processing: { icon: 'loader', tone: 'warning' },
  successful: { icon: 'heart', tone: 'success' },
  failed: { icon: 'x-circle', tone: 'danger' },
  cancelled: { icon: 'slash', tone: 'info' },
  demo_not_processed: { icon: 'tool', tone: 'info' },
};

/**
 * The state of one gift, as the server reports it.
 *
 * The screen asks the backend for the provider-verified status and re-asks
 * while it is still pending. Coming back from the checkout page proves nothing,
 * so nothing here is derived from that.
 */
export default function GivingStatusScreen() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const router = useRouter();
  const colors = useColors();

  const intent = useQuery({
    queryKey: queryKeys.givingIntent(reference),
    queryFn: () => fetchGivingIntent(reference),
    enabled: Boolean(reference),
    // Keep asking while the provider has not settled it yet.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 4_000 : false;
    },
  });

  if (intent.isPending) {
    return (
      <Screen>
        <NavBar title="Your gift" />
        <View style={styles.loading}>
          <Skeleton height={120} />
          <Skeleton width="60%" height={16} />
        </View>
      </Screen>
    );
  }

  if (intent.isError) {
    return (
      <Screen>
        <NavBar title="Your gift" />
        <ErrorState error={intent.error} onRetry={() => void intent.refetch()} />
        <View style={styles.block}>
          <Banner
            tone="info"
            message="If you completed a payment, it is safe to close this screen, the church will still receive it. Your giving history will show the confirmed result."
          />
        </View>
      </Screen>
    );
  }

  const data = intent.data;
  const label = givingStatusLabel(data.status);
  const look = presentation[data.status];
  const settling = data.status === 'pending' || data.status === 'processing';

  return (
    <Screen>
      <NavBar title="Your gift" />
      <ScreenScroll padded bottomSpace={space.giant}>
        <View
          style={[
            styles.plate,
            {
              backgroundColor:
                look.tone === 'success'
                  ? colors.successSoft
                  : look.tone === 'danger'
                    ? colors.dangerSoft
                    : look.tone === 'warning'
                      ? colors.warningSoft
                      : colors.surfaceMuted,
            },
          ]}
        >
          <Icon
            name={look.icon}
            size="lg"
            color={
              look.tone === 'success'
                ? 'successOnSoft'
                : look.tone === 'danger'
                  ? 'dangerOnSoft'
                  : look.tone === 'warning'
                    ? 'warningOnSoft'
                    : 'textSecondary'
            }
          />
          <Eyebrow
            color={
              look.tone === 'success'
                ? 'successOnSoft'
                : look.tone === 'danger'
                  ? 'dangerOnSoft'
                  : look.tone === 'warning'
                    ? 'warningOnSoft'
                    : 'textSecondary'
            }
          >
            {label.label}
          </Eyebrow>
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatMoney(data.amount_minor, data.currency)}
          </Text>
          <Text variant="meta" color="textSecondary">
            {data.category_name}
            {data.recurrence === 'monthly' ? ' · every month' : ''}
          </Text>
          <Text variant="body" color="textSecondary" style={styles.statusMessage}>
            {label.description}
          </Text>
        </View>

        <View style={styles.facts}>
          <Fact label="Reference" value={data.reference} />
          <Fact label="Started" value={formatDateTimeWithZone(data.created_at)} />
          {data.provider ? <Fact label="Handled by" value={data.provider} /> : null}
          {data.failure_reason ? <Fact label="Reason" value={data.failure_reason} /> : null}
        </View>

        {settling ? (
          <Banner
            tone="warning"
            icon="clock"
            title="Waiting on the payment provider"
            message="This updates by itself. If you closed the payment page without finishing, the gift will be marked cancelled."
            action={{ label: 'Check again now', onPress: () => void intent.refetch() }}
          />
        ) : null}

        {data.status === 'failed' ? (
          <Banner
            tone="danger"
            title="Nothing was taken"
            message="The payment did not go through, so no money has left your account. You can try again."
          />
        ) : null}

        {data.status === 'demo_not_processed' ? (
          <Banner
            tone="info"
            icon="tool"
            title="Demo mode"
            message="This gift was not sent to a payment provider and no money moved. It is here so the giving states can be checked."
          />
        ) : null}

        <View style={styles.actions}>
          {data.receipt_url && isSafeExternalUrl(data.receipt_url) ? (
            <Button
              label="View receipt"
              variant="secondary"
              icon="file-text"
              fullWidth
              onPress={() => void WebBrowser.openBrowserAsync(data.receipt_url!)}
            />
          ) : null}

          {data.status === 'failed' || data.status === 'cancelled' ? (
            <Button label="Try again" fullWidth onPress={() => router.replace('/give')} />
          ) : null}

          <Button
            label="Giving history"
            variant="ghost"
            fullWidth
            onPress={() => router.replace('/giving/history')}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text variant="caption" color="textTertiary">
        {label}
      </Text>
      <Text variant="metaStrong" style={styles.factValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: space.gutter,
    gap: space.md,
  },
  plate: {
    marginTop: space.lg,
    padding: space.xl,
    borderRadius: radius.sm,
    gap: space.xs,
  },
  amount: {
    fontFamily: fonts.sansBold,
    fontSize: 34,
    lineHeight: 40,
    marginTop: space.xs,
  },
  statusMessage: {
    marginTop: space.sm,
  },
  facts: {
    paddingVertical: space.xxl,
    gap: space.md,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
  },
  factValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  block: {
    padding: space.gutter,
  },
  actions: {
    paddingTop: space.xl,
    gap: space.sm,
  },
});
