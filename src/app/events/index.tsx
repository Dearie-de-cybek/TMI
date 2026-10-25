import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { EventRow } from '@/components/content/rows';
import { SegmentedControl } from '@/components/ui/chips';
import { NavBar } from '@/components/ui/header';
import { Rule, Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { space } from '@/design/tokens';
import { fetchEvents, type EventScope } from '@/features/events/api';

export default function EventsScreen() {
  const router = useRouter();
  const [scope, setScope] = useState<EventScope>('upcoming');

  const events = useQuery({
    queryKey: queryKeys.events(scope),
    queryFn: ({ signal }) => fetchEvents(scope, 1, signal),
  });

  return (
    <Screen>
      <NavBar title="Events" />

      <View style={styles.tabs}>
        <SegmentedControl
          label="Event period"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
          ]}
        />
      </View>

      {events.isPending ? (
        <SkeletonList count={5} />
      ) : events.isError ? (
        <ErrorState error={events.error} onRetry={() => void events.refetch()} />
      ) : (
        <FlatList
          data={events.data.data}
          keyExtractor={(item) => item.id}
          refreshing={events.isRefetching}
          onRefresh={() => void events.refetch()}
          ItemSeparatorComponent={() => <Rule inset={space.gutter} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title={scope === 'upcoming' ? 'Nothing scheduled yet' : 'No past events on record'}
              message={
                scope === 'upcoming'
                  ? 'The church publishes gatherings and classes here. Check back, or look at what has already happened.'
                  : 'Events appear here once they have taken place.'
              }
              action={
                scope === 'upcoming'
                  ? { label: 'See past events', onPress: () => setScope('past') }
                  : { label: 'See what is coming', onPress: () => setScope('upcoming') }
              }
            />
          }
          renderItem={({ item }) => (
            <EventRow event={item} onPress={() => router.push(`/events/${item.id}`)} />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    paddingHorizontal: space.gutter,
  },
});
