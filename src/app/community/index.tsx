import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { MinistryCard } from '@/components/content/discover-cards';
import { ChipRow } from '@/components/ui/chips';
import { NavBar } from '@/components/ui/header';
import { Pressable } from '@/components/ui/pressable';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { fetchGroups } from '@/features/community/api';

const types = [
  { value: 'ministry', label: 'Ministries' },
  { value: 'fellowship', label: 'Fellowships' },
  { value: 'cell', label: 'Cell groups' },
] as const;

/**
 * Ministries and fellowships, as a two-column grid of cards. It is not a social
 * network: there is no member directory and no member-to-member messaging,
 * because the backend does not provide either. Prayer and pastoral care sit at
 * the top because it is the other thing people come here for.
 *
 * The screen is reached from Discover and Home rather than from the tab bar, so
 * it has a back button.
 */
export default function CommunityScreen() {
  const router = useRouter();
  const colors = useColors();
  const { width } = useWindowDimensions();
  const [type, setType] = useState<string | null>(null);

  const groups = useQuery({
    queryKey: queryKeys.groups({ type }),
    queryFn: ({ signal }) => fetchGroups({ type }, signal),
  });

  // Two columns with the gutter on both sides and a gap between.
  const cardWidth = (width - space.gutter * 2 - space.md) / 2;

  const mine = groups.data?.data.filter((group) => group.membership.status === 'member') ?? [];
  const others = groups.data?.data.filter((group) => group.membership.status !== 'member') ?? [];
  const ordered = [...mine, ...others];

  return (
    <Screen>
      <NavBar title="Ministries and groups" />

      {groups.isPending ? (
        <SkeletonList count={4} />
      ) : groups.isError ? (
        <ErrorState error={groups.error} onRetry={() => void groups.refetch()} />
      ) : (
        <FlatList
          data={ordered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshing={groups.isRefetching}
          onRefresh={() => void groups.refetch()}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <Pressable
                onPress={() => router.push('/prayer')}
                feedback="opacity"
                accessibilityLabel="Prayer and pastoral care"
                style={[styles.prayer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="heart-outline" size={26} color={colors.primary} />
                <View style={styles.prayerText}>
                  <Text variant="bodyStrong">Prayer and pastoral care</Text>
                  <Text variant="meta" color="textSecondary">
                    Send a request, or find how to reach the pastoral team.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>

              <ChipRow
                label="Filter groups by kind"
                allowClear
                value={type}
                onChange={setType}
                options={types.map((item) => ({ value: item.value, label: item.label }))}
              />

              {mine.length > 0 ? (
                <Text variant="meta" color="textSecondary" style={styles.note}>
                  Groups you serve in are shown first.
                </Text>
              ) : null}
            </View>
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
          renderItem={({ item }) => (
            <MinistryCard
              group={item}
              width={cardWidth}
              onPress={() => router.push(`/community/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: space.giant,
    gap: space.md,
  },
  column: {
    gap: space.md,
    paddingHorizontal: space.gutter,
  },
  prayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.gutter,
    marginBottom: space.lg,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  prayerText: {
    flex: 1,
    gap: 2,
  },
  note: {
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
});
