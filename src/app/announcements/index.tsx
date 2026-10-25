import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { AnnouncementRow } from '@/components/content/rows';
import { ChipRow } from '@/components/ui/chips';
import { NavBar } from '@/components/ui/header';
import { Rule, Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { space } from '@/design/tokens';
import { fetchAnnouncements } from '@/features/announcements/api';

const scopes = [
  { value: 'church', label: 'Church-wide' },
  { value: 'ministry', label: 'Ministries' },
  { value: 'course', label: 'Courses' },
] as const;

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [scope, setScope] = useState<string | null>(null);

  const announcements = useQuery({
    queryKey: queryKeys.announcements({ scope }),
    queryFn: ({ signal }) => fetchAnnouncements({ scope }, signal),
  });

  return (
    <Screen>
      <NavBar title="Announcements" />

      <ChipRow
        label="Filter announcements"
        allowClear
        value={scope}
        onChange={setScope}
        options={scopes.map((item) => ({ value: item.value, label: item.label }))}
      />

      {announcements.isPending ? (
        <SkeletonList count={5} withThumbnail={false} />
      ) : announcements.isError ? (
        <ErrorState error={announcements.error} onRetry={() => void announcements.refetch()} />
      ) : (
        <FlatList
          data={announcements.data.data}
          keyExtractor={(item) => item.id}
          refreshing={announcements.isRefetching}
          onRefresh={() => void announcements.refetch()}
          ItemSeparatorComponent={() => <Rule inset={space.gutter} />}
          ListEmptyComponent={
            <EmptyState
              icon="file-text"
              title={scope ? 'Nothing under that heading' : 'No announcements'}
              message={
                scope
                  ? 'Try another filter, or look at everything the church has posted.'
                  : 'Notices from the church and your ministries will appear here.'
              }
              action={scope ? { label: 'Show all', onPress: () => setScope(null) } : undefined}
            />
          }
          renderItem={({ item }) => (
            <AnnouncementRow
              announcement={item}
              onPress={() => router.push(`/announcements/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
