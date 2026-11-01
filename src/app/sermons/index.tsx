import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { type Sermon } from '@/api/schemas';
import { SermonRow } from '@/components/content/rows';
import { Button } from '@/components/ui/button';
import { Chip, SegmentedControl } from '@/components/ui/chips';
import { NavBar } from '@/components/ui/header';
import { Rule, Screen } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { space } from '@/design/tokens';
import { fetchSermonFilters, fetchSermons, type SermonQuery } from '@/features/sermons/api';
import { pluralise } from '@/lib/format';

type Filters = {
  speaker: string | null;
  series: string | null;
  topic: string | null;
};

const emptyFilters: Filters = { speaker: null, series: null, topic: null };

/**
 * The sermon library.
 *
 * Filters come from the backend rather than being inferred from the loaded page,
 * so filtering by a speaker whose sermons are not on screen still works.
 */
export default function SermonLibraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ topic?: string }>();
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, topic: params.topic ?? null });
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [sheetOpen, setSheetOpen] = useState(false);

  const query: SermonQuery = useMemo(
    () => ({ ...filters, sort }),
    [filters, sort]
  );

  const filterOptions = useQuery({
    queryKey: queryKeys.sermonFilters,
    queryFn: fetchSermonFilters,
    staleTime: 10 * 60_000,
  });

  const sermons = useInfiniteQuery({
    queryKey: queryKeys.sermons(query),
    queryFn: ({ pageParam, signal }) => fetchSermons({ ...query, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
  });

  const items: Sermon[] = useMemo(
    () => sermons.data?.pages.flatMap((page) => page.data) ?? [],
    [sermons.data]
  );
  const total = sermons.data?.pages[0]?.meta.total ?? 0;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const activeLabels = useMemo(() => {
    const labels: { key: keyof Filters; label: string }[] = [];
    if (filters.speaker) {
      const match = filterOptions.data?.speakers.find((item) => item.id === filters.speaker);
      labels.push({ key: 'speaker', label: match?.name ?? 'Speaker' });
    }
    if (filters.series) {
      const match = filterOptions.data?.series.find((item) => item.id === filters.series);
      labels.push({ key: 'series', label: match?.title ?? 'Series' });
    }
    if (filters.topic) labels.push({ key: 'topic', label: filters.topic });
    return labels;
  }, [filterOptions.data, filters]);

  return (
    <Screen>
      <NavBar
        title="Sermons"
        actions={[
          { icon: 'search', label: 'Search sermons', onPress: () => router.push('/search') },
          {
            icon: 'sliders',
            label: 'Filter sermons',
            onPress: () => setSheetOpen(true),
            badge: activeFilterCount,
          },
        ]}
      />

      <View style={styles.sortRow}>
        <SegmentedControl
          label="Sort sermons"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
          ]}
        />
      </View>

      {activeLabels.length > 0 ? (
        <View style={styles.activeFilters}>
          {activeLabels.map((entry) => (
            <Chip
              key={entry.key}
              label={`${entry.label}  ✕`}
              selected
              onPress={() => setFilters((current) => ({ ...current, [entry.key]: null }))}
              accessibilityHint="Removes this filter"
            />
          ))}
        </View>
      ) : null}

      {sermons.isPending ? (
        <SkeletonList count={6} />
      ) : sermons.isError ? (
        <ErrorState error={sermons.error} onRetry={() => void sermons.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Rule inset={space.gutter} />}
          refreshing={sermons.isRefetching}
          onRefresh={() => void sermons.refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (sermons.hasNextPage && !sermons.isFetchingNextPage) void sermons.fetchNextPage();
          }}
          ListHeaderComponent={
            total > 0 ? (
              <Text variant="caption" color="textTertiary" style={styles.count}>
                {pluralise(total, 'teaching', 'teachings')}
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="mic"
              title={activeFilterCount > 0 ? 'Nothing matches those filters' : 'No sermons yet'}
              message={
                activeFilterCount > 0
                  ? 'Try clearing a filter, or browse everything.'
                  : 'Teaching will appear here as the media team publishes it.'
              }
              action={
                activeFilterCount > 0
                  ? { label: 'Clear filters', onPress: () => setFilters(emptyFilters) }
                  : undefined
              }
            />
          }
          ListFooterComponent={
            sermons.isFetchingNextPage ? (
              <View style={styles.footer}>
                <SkeletonList count={2} />
              </View>
            ) : undefined
          }
          renderItem={({ item }) => (
            <SermonRow sermon={item} onPress={() => router.push(`/sermons/${item.id}`)} />
          )}
        />
      )}

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter sermons"
        description="Filters apply across the whole library, not just the sermons on screen."
        footer={
          <View style={styles.sheetFooter}>
            <Button
              label="Clear all"
              variant="ghost"
              onPress={() => setFilters(emptyFilters)}
              disabled={activeFilterCount === 0}
            />
            <Button label="Show results" onPress={() => setSheetOpen(false)} />
          </View>
        }
      >
        {filterOptions.isPending ? (
          <SkeletonList count={3} withThumbnail={false} />
        ) : filterOptions.isError ? (
          <ErrorState
            compact
            error={filterOptions.error}
            onRetry={() => void filterOptions.refetch()}
          />
        ) : (
          <>
            <FilterGroup
              label="Speaker"
              options={(filterOptions.data?.speakers ?? []).map((item) => ({
                value: item.id,
                label: item.name,
                count: item.count,
              }))}
              value={filters.speaker}
              onChange={(value) => setFilters((current) => ({ ...current, speaker: value }))}
            />
            <FilterGroup
              label="Series"
              options={(filterOptions.data?.series ?? []).map((item) => ({
                value: item.id,
                label: item.title,
                count: item.count,
              }))}
              value={filters.series}
              onChange={(value) => setFilters((current) => ({ ...current, series: value }))}
            />
            <FilterGroup
              label="Topic"
              options={(filterOptions.data?.topics ?? []).map((item) => ({
                value: item.value,
                label: item.value,
                count: item.count,
              }))}
              value={filters.topic}
              onChange={(value) => setFilters((current) => ({ ...current, topic: value }))}
            />
          </>
        )}
      </Sheet>
    </Screen>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; count?: number }[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  if (options.length === 0) return null;

  return (
    <View style={styles.group}>
      <Eyebrow color="textTertiary">{label}</Eyebrow>
      <View style={styles.groupChips}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            count={option.count}
            selected={value === option.value}
            onPress={() => onChange(value === option.value ? null : option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sortRow: {
    paddingHorizontal: space.gutter,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
  },
  count: {
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
  },
  footer: {
    paddingVertical: space.md,
  },
  group: {
    gap: space.sm,
  },
  groupChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space.sm,
  },
});
