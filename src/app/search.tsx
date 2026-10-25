import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryKeys } from '@/api/query-client';
import { type SearchResult } from '@/api/schemas';
import {
  AnnouncementRow,
  CourseRow,
  EventRow,
  GroupRow,
  SermonRow,
} from '@/components/content/rows';
import { Chip } from '@/components/ui/chips';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { hairline, radius, space, typeScale } from '@/design/tokens';
import {
  clearRecentSearches,
  fetchSuggestions,
  loadRecentSearches,
  rememberSearch,
  search,
  type SearchType,
} from '@/features/search/api';
import { useDebouncedValue } from '@/lib/hooks';

const typeFilters: { value: SearchType; label: string }[] = [
  { value: 'sermon', label: 'Sermons' },
  { value: 'course', label: 'Courses' },
  { value: 'event', label: 'Events' },
  { value: 'announcement', label: 'Notices' },
  { value: 'group', label: 'Groups' },
];

/**
 * Global search.
 *
 * The query goes to the server, so results cover everything published rather
 * than whatever a screen had already loaded. Results keep the layout of their
 * own content type — a sermon still looks like a sermon.
 */
export default function SearchScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [types, setTypes] = useState<SearchType[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  const debouncedQuery = useDebouncedValue(query, 350);
  const activeQuery = submitted || debouncedQuery;

  useEffect(() => {
    void loadRecentSearches().then(setRecent);
    const timer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, []);

  const suggestions = useQuery({
    queryKey: queryKeys.searchSuggestions(debouncedQuery),
    queryFn: ({ signal }) => fetchSuggestions(debouncedQuery, signal),
    enabled: debouncedQuery.trim().length >= 2 && submitted.length === 0,
  });

  const results = useQuery({
    queryKey: queryKeys.search(activeQuery, types),
    queryFn: ({ signal }) => search({ query: activeQuery, types }, signal),
    enabled: activeQuery.trim().length >= 2,
  });

  async function runSearch(value: string) {
    const trimmed = value.trim();
    setQuery(trimmed);
    setSubmitted(trimmed);
    if (trimmed.length >= 2) setRecent(await rememberSearch(trimmed));
  }

  function toggleType(type: SearchType) {
    setTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  }

  const showIdle = activeQuery.trim().length < 2;

  return (
    <Screen>
      <View style={[styles.searchBar, { paddingTop: insets.top + space.sm, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close search"
          feedback="opacity"
          style={styles.iconButton}
        >
          <Icon name="arrow-left" size="md" color="text" />
        </Pressable>

        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="search" size="sm" color="textTertiary" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              setSubmitted('');
            }}
            onSubmitEditing={() => void runSearch(query)}
            placeholder="Search Kingdom Heralds"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search"
          />
          {query.length > 0 ? (
            <Pressable
              inline
              onPress={() => {
                setQuery('');
                setSubmitted('');
              }}
              accessibilityLabel="Clear search"
              style={styles.clear}
            >
              <Icon name="x" size="sm" color="textSecondary" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + space.giant }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {typeFilters.map((filter) => (
            <Chip
              key={filter.value}
              label={filter.label}
              selected={types.includes(filter.value)}
              onPress={() => toggleType(filter.value)}
            />
          ))}
        </ScrollView>

        {showIdle ? (
          <View style={styles.idle}>
            {recent.length > 0 ? (
              <View style={styles.idleBlock}>
                <View style={styles.idleHeader}>
                  <Eyebrow color="textTertiary">Recent searches</Eyebrow>
                  <Pressable
                    inline
                    onPress={() => {
                      void clearRecentSearches();
                      setRecent([]);
                    }}
                  >
                    <Text variant="caption" color="primary">
                      Clear
                    </Text>
                  </Pressable>
                </View>
                {recent.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => void runSearch(item)}
                    style={styles.suggestion}
                    accessibilityLabel={`Search for ${item}`}
                  >
                    <Icon name="clock" size="sm" color="textTertiary" />
                    <Text variant="body">{item}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {suggestions.data && suggestions.data.length > 0 ? (
              <View style={styles.idleBlock}>
                <Eyebrow color="textTertiary">Suggestions</Eyebrow>
                {suggestions.data.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => void runSearch(item)}
                    style={styles.suggestion}
                    accessibilityLabel={`Search for ${item}`}
                  >
                    <Icon name="search" size="sm" color="textTertiary" />
                    <Text variant="body">{item}</Text>
                  </Pressable>
                ))}
              </View>
            ) : recent.length === 0 ? (
              <EmptyState
                icon="search"
                title="Search the whole church library"
                message="Sermons, courses, events, announcements and groups. Try a speaker’s name, a passage, or a topic like “mercy”."
              />
            ) : null}
          </View>
        ) : results.isPending ? (
          <SkeletonList count={5} />
        ) : results.isError ? (
          <ErrorState error={results.error} onRetry={() => void results.refetch()} />
        ) : results.data.results.length === 0 ? (
          <EmptyState
            icon="search"
            title={`Nothing found for “${activeQuery}”`}
            message={
              types.length > 0
                ? 'Try removing a filter, or searching for a speaker, series or passage.'
                : 'Check the spelling, or try a speaker, series or passage instead.'
            }
            action={
              types.length > 0 ? { label: 'Clear filters', onPress: () => setTypes([]) } : undefined
            }
          />
        ) : (
          <View>
            <Text variant="caption" color="textTertiary" style={styles.count}>
              {results.data.meta.total} result{results.data.meta.total === 1 ? '' : 's'}
            </Text>
            {results.data.results.map((result, index) => (
              <View key={resultKey(result, index)}>
                {index > 0 ? <Rule inset={space.gutter} /> : null}
                <ResultRow result={result} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function resultKey(result: SearchResult, index: number): string {
  switch (result.type) {
    case 'sermon':
      return `sermon-${result.sermon.id}`;
    case 'course':
      return `course-${result.course.id}`;
    case 'event':
      return `event-${result.event.id}`;
    case 'announcement':
      return `announcement-${result.announcement.id}`;
    case 'group':
      return `group-${result.group.id}`;
    default:
      return `result-${index}`;
  }
}

function ResultRow({ result }: { result: SearchResult }) {
  const router = useRouter();

  switch (result.type) {
    case 'sermon':
      return (
        <SermonRow sermon={result.sermon} onPress={() => router.push(`/sermons/${result.sermon.id}`)} />
      );
    case 'course':
      return (
        <CourseRow course={result.course} onPress={() => router.push(`/courses/${result.course.id}`)} />
      );
    case 'event':
      return <EventRow event={result.event} onPress={() => router.push(`/events/${result.event.id}`)} />;
    case 'announcement':
      return (
        <AnnouncementRow
          announcement={result.announcement}
          onPress={() => router.push(`/announcements/${result.announcement.id}`)}
        />
      );
    case 'group':
      return (
        <GroupRow group={result.group} onPress={() => router.push(`/community/${result.group.id}`)} />
      );
    case 'live_session':
      return null;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    borderBottomWidth: hairline,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    height: 44,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  input: {
    flex: 1,
    ...typeScale.body,
    paddingVertical: space.sm,
  },
  clear: {
    padding: space.xs,
    minHeight: 0,
  },
  filters: {
    gap: space.sm,
    paddingHorizontal: space.gutter,
    paddingVertical: space.md,
  },
  idle: {
    paddingTop: space.md,
  },
  idleBlock: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.xl,
    gap: space.xs,
  },
  idleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: space.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  count: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.sm,
  },
});
