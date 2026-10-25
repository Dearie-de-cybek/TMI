import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { CourseRow } from '@/components/content/rows';
import { ChipRow } from '@/components/ui/chips';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { space } from '@/design/tokens';
import { useIsSignedIn, useRequireAuth } from '@/features/auth/use-require-auth';
import { fetchCourses, fetchPrograms } from '@/features/learning/api';

export default function CoursesScreen() {
  const router = useRouter();
  const colors = useColors();
  const signedIn = useIsSignedIn();
  const requireAuth = useRequireAuth();
  const [program, setProgram] = useState<string | null>(null);

  const programs = useQuery({
    queryKey: queryKeys.programs,
    queryFn: fetchPrograms,
    staleTime: 10 * 60_000,
  });

  const courses = useQuery({
    queryKey: queryKeys.courses({ program }),
    queryFn: ({ signal }) => fetchCourses({ program }, signal),
  });

  const enrolled = courses.data?.data.filter((course) => course.my_enrollment) ?? [];
  const available = courses.data?.data.filter((course) => !course.my_enrollment) ?? [];

  return (
    <Screen>
      <NavBar title="Courses" subtitle="Discipleship and Bible study" />

      {programs.data && programs.data.length > 0 ? (
        <ChipRow
          label="Filter by programme"
          allowClear
          value={program}
          onChange={setProgram}
          options={programs.data.map((item) => ({
            value: item.id,
            label: item.title,
            count: item.course_count,
          }))}
        />
      ) : null}

      <Pressable
        onPress={() => {
          if (!requireAuth({ reason: 'enroll', next: '/courses/activate' })) return;
          router.push('/courses/activate');
        }}
        style={[styles.codeRow, { borderColor: colors.border }]}
        accessibilityLabel="Enter a course access code"
      >
        <Icon name="key" size="md" color="accent" />
        <View style={styles.codeText}>
          <Text variant="labelStrong">Have an access code?</Text>
          <Text variant="caption" color="textSecondary">
            Enter the code the discipleship team gave you to open a course.
          </Text>
        </View>
        <Icon name="chevron-right" size="sm" color="textTertiary" />
      </Pressable>

      {courses.isPending ? (
        <SkeletonList count={4} />
      ) : courses.isError ? (
        <ErrorState error={courses.error} onRetry={() => void courses.refetch()} />
      ) : (
        <FlatList
          data={[...enrolled, ...available]}
          keyExtractor={(item) => item.id}
          refreshing={courses.isRefetching}
          onRefresh={() => void courses.refetch()}
          ItemSeparatorComponent={() => <Rule inset={space.gutter} />}
          ListHeaderComponent={
            enrolled.length > 0 ? (
              <Text variant="eyebrow" color="accent" uppercase style={styles.sectionLabel}>
                Your courses
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="book-open"
              title={program ? 'Nothing in this programme yet' : 'No courses published'}
              message={
                signedIn
                  ? 'The discipleship team opens courses through the year. You will see them here, and in your notifications if you have them switched on.'
                  : 'The discipleship team opens courses through the year. Sign in to enrol when one is open.'
              }
              action={program ? { label: 'Show all', onPress: () => setProgram(null) } : undefined}
            />
          }
          renderItem={({ item, index }) => (
            <>
              {enrolled.length > 0 && index === enrolled.length ? (
                <Text variant="eyebrow" color="textTertiary" uppercase style={styles.sectionLabel}>
                  Open to join
                </Text>
              ) : null}
              <CourseRow course={item} onPress={() => router.push(`/courses/${item.id}`)} />
            </>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  codeText: {
    flex: 1,
    gap: 2,
  },
  sectionLabel: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    paddingBottom: space.sm,
  },
});
