import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { ContentImage } from '@/components/ui/content-image';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { space } from '@/design/tokens';
import { fetchRecentDevotionals } from '@/features/devotion/api';
import { useDevotionProgress } from '@/features/devotion/progress-store';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';
import { formatDate } from '@/lib/datetime';

/**
 * The recent daily devotionals, newest first, so a member who missed a few days
 * can catch up. A tick marks the ones already read.
 */
export default function DevotionalsScreen() {
  const router = useRouter();
  useDevotionSync();

  const devotionals = useQuery({
    queryKey: queryKeys.devotionals,
    queryFn: ({ signal }) => fetchRecentDevotionals(signal),
  });
  const readIds = useDevotionProgress((state) => state.readDevotionalIds);

  return (
    <Screen>
      <NavBar title="Daily devotionals" />

      {devotionals.isPending ? (
        <SkeletonList count={4} />
      ) : devotionals.isError ? (
        <ErrorState error={devotionals.error} onRetry={() => void devotionals.refetch()} />
      ) : (
        <FlatList
          data={devotionals.data}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Rule inset={space.gutter} />}
          ListEmptyComponent={
            <EmptyState
              icon="book-open"
              title="No devotionals yet"
              message="A new word is published each morning."
            />
          }
          renderItem={({ item }) => {
            const read = readIds.includes(item.id);
            return (
              <Pressable
                onPress={() => router.push(`/devotion/devotional/${item.id}`)}
                accessibilityLabel={`${item.title}, ${formatDate(item.date)}${read ? ', read' : ''}`}
                style={styles.row}
              >
                <ContentImage
                  uri={item.artwork_url}
                  seed={item.title}
                  width={64}
                  height={64}
                />
                <View style={styles.text}>
                  <Text variant="caption" color="accentOnSoft">
                    {formatDate(item.date)}
                  </Text>
                  <Text variant="bodyStrong" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text variant="caption" color="textTertiary">
                    {item.scripture_reference}
                  </Text>
                </View>
                <Icon
                  name={read ? 'check' : 'chevron-right'}
                  size="md"
                  color={read ? 'success' : 'textTertiary'}
                />
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
