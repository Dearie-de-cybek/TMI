import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { TAB_BAR_HEIGHT } from '@/components/app/tab-bar';
import { GroupRow } from '@/components/content/rows';
import { ChipRow } from '@/components/ui/chips';
import { PageHeader } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { space } from '@/design/tokens';
import { fetchGroups } from '@/features/community/api';

const types = [
  { value: 'ministry', label: 'Ministries' },
  { value: 'fellowship', label: 'Fellowships' },
  { value: 'cell', label: 'Cell groups' },
] as const;

/**
 * Community lists the ministries and groups the church runs, and the routes into
 * prayer and pastoral care. It is not a social network: there is no member
 * directory and no member-to-member messaging, because the backend does not
 * provide either.
 */
export default function CommunityScreen() {
  const router = useRouter();
  const colors = useColors();
  const [type, setType] = useState<string | null>(null);

  const groups = useQuery({
    queryKey: queryKeys.groups({ type }),
    queryFn: ({ signal }) => fetchGroups({ type }, signal),
  });

  const mine = groups.data?.data.filter((group) => group.membership.status === 'member') ?? [];
  const others = groups.data?.data.filter((group) => group.membership.status !== 'member') ?? [];

  return (
    <Screen>
      <PageHeader eyebrow="Together" title="Community" />

      <Pressable
        onPress={() => router.push('/prayer')}
        style={[styles.prayerRow, { borderColor: colors.border }]}
        accessibilityLabel="Prayer and pastoral care"
      >
        <Icon name="heart" size="md" color="primary" />
        <View style={styles.prayerText}>
          <Text variant="labelStrong">Prayer and pastoral care</Text>
          <Text variant="caption" color="textSecondary">
            Send a request, or find how to reach the pastoral team.
          </Text>
        </View>
        <Icon name="chevron-right" size="sm" color="textTertiary" />
      </Pressable>

      <ChipRow
        label="Filter groups by kind"
        allowClear
        value={type}
        onChange={setType}
        options={types.map((item) => ({ value: item.value, label: item.label }))}
      />

      {groups.isPending ? (
        <SkeletonList count={4} />
      ) : groups.isError ? (
        <ErrorState error={groups.error} onRetry={() => void groups.refetch()} />
      ) : (
        <FlatList
          data={[...mine, ...others]}
          keyExtractor={(item) => item.id}
          refreshing={groups.isRefetching}
          onRefresh={() => void groups.refetch()}
          ItemSeparatorComponent={() => <Rule inset={space.gutter} />}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + space.xxl }}
          ListHeaderComponent={
            mine.length > 0 ? (
              <Text variant="eyebrow" color="accent" uppercase style={styles.sectionLabel}>
                Where you serve
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title={type ? 'None of those yet' : 'No groups published'}
              message={
                type
                  ? 'Try another kind of group, or look at everything.'
                  : 'The church publishes its ministries and groups here.'
              }
              action={type ? { label: 'Show all', onPress: () => setType(null) } : undefined}
            />
          }
          renderItem={({ item, index }) => (
            <>
              {mine.length > 0 && index === mine.length ? (
                <Text variant="eyebrow" color="textTertiary" uppercase style={styles.sectionLabel}>
                  Ministries and groups
                </Text>
              ) : null}
              <GroupRow group={item} onPress={() => router.push(`/community/${item.id}`)} />
            </>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  prayerText: {
    flex: 1,
    gap: 2,
  },
  sectionLabel: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.sm,
  },
});
