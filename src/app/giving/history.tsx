import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { Tag } from '@/components/ui/chips';
import { NavBar } from '@/components/ui/header';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { space } from '@/design/tokens';
import { useIsSignedIn } from '@/features/auth/use-require-auth';
import { fetchTransactions } from '@/features/giving/api';
import { formatDate } from '@/lib/datetime';
import { formatMoney, givingStatusLabel } from '@/lib/format';

const tones = {
  successful: 'success',
  failed: 'danger',
  cancelled: 'neutral',
  pending: 'warning',
  processing: 'warning',
  demo_not_processed: 'neutral',
} as const;

export default function GivingHistoryScreen() {
  const router = useRouter();
  const signedIn = useIsSignedIn();

  const transactions = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: () => fetchTransactions(),
    enabled: signedIn,
  });

  if (!signedIn) {
    return (
      <Screen>
        <NavBar title="Giving history" />
        <ScreenScroll padded>
          <SignInPrompt
            title="Your giving record is private to you"
            message="Sign in to see the gifts recorded against your account and the receipts the church has issued."
            reason="give"
            next="/giving/history"
          />
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <NavBar title="Giving history" />
      {transactions.isPending ? (
        <SkeletonList count={5} withThumbnail={false} />
      ) : transactions.isError ? (
        <ErrorState error={transactions.error} onRetry={() => void transactions.refetch()} />
      ) : (
        <FlatList
          data={transactions.data.data}
          keyExtractor={(item) => item.id}
          refreshing={transactions.isRefetching}
          onRefresh={() => void transactions.refetch()}
          ItemSeparatorComponent={() => <Rule inset={space.gutter} />}
          ListEmptyComponent={
            <EmptyState
              icon="gift"
              title="Nothing recorded yet"
              message="Gifts made in the app appear here with the status the church’s payment provider confirmed."
              action={{ label: 'Give', onPress: () => router.replace('/give') }}
            />
          }
          renderItem={({ item }) => {
            const status = givingStatusLabel(item.status);
            return (
              <Pressable
                onPress={() => router.push(`/giving/${encodeURIComponent(item.reference)}`)}
                accessibilityLabel={`${formatMoney(item.amount_minor, item.currency)} to ${item.category_name}, ${status.label}`}
                style={styles.row}
              >
                <View style={styles.text}>
                  <Text variant="bodyStrong">
                    {formatMoney(item.amount_minor, item.currency)}
                  </Text>
                  <Text variant="meta" color="textSecondary">
                    {item.category_name}
                    {item.recurrence === 'monthly' ? ' · monthly' : ''}
                  </Text>
                  <Text variant="caption" color="textTertiary">
                    {formatDate(item.created_at)} · {item.reference}
                  </Text>
                </View>
                <Tag label={status.label} tone={tones[item.status]} />
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
