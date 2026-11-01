import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { ApiError, describeError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { useToast } from '@/components/app/toast';
import { SermonVideoPlayer } from '@/components/media/video-player';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/chips';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, space } from '@/design/tokens';
import { completeLesson, fetchLesson } from '@/features/learning/api';
import { isSafeExternalUrl } from '@/lib/deep-links';
import { joinMeta, lessonKindLabel } from '@/lib/format';

/**
 * A lesson.
 *
 * Access and completion are both the server's decision: a 403 renders as "not
 * enrolled" rather than showing the body, and the progress figures shown after
 * completing come from the server's response.
 */
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();

  const lesson = useQuery({
    queryKey: queryKeys.lesson(id),
    queryFn: ({ signal }) => fetchLesson(id, signal),
    enabled: Boolean(id),
  });

  const complete = useMutation({
    mutationFn: () => completeLesson(id),
    onSuccess: (progress) => {
      toast(
        progress.certificate_issued
          ? 'Course complete. The church has issued your certificate.'
          : `Lesson complete. ${progress.enrollment.completed_lessons} of ${progress.enrollment.total_lessons} done.`,
        { tone: 'success', icon: 'award' }
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.lesson(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
      if (lesson.data?.course_id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.course(lesson.data.course_id) });
      }
    },
  });

  if (lesson.isPending) {
    return (
      <Screen>
        <NavBar />
        <View style={styles.loading}>
          <Skeleton width="35%" height={12} />
          <Skeleton width="80%" height={26} />
          <Skeleton height={14} />
          <Skeleton height={14} />
          <Skeleton width="60%" height={14} />
        </View>
      </Screen>
    );
  }

  if (lesson.isError) {
    const forbidden = ApiError.isApiError(lesson.error) && lesson.error.kind === 'forbidden';
    return (
      <Screen>
        <NavBar />
        {forbidden ? (
          <View style={styles.forbidden}>
            <Banner
              tone="warning"
              icon="lock"
              title="You do not have access to this lesson"
              message={
                describeError(lesson.error).message ||
                'Enrol in the course, or ask the discipleship team to add you to the cohort.'
              }
            />
            <Button label="Back to courses" variant="secondary" onPress={() => router.replace('/courses')} />
          </View>
        ) : (
          <ErrorState error={lesson.error} onRetry={() => void lesson.refetch()} />
        )}
      </Screen>
    );
  }

  const data = lesson.data;
  const completeError = complete.error ? describeError(complete.error) : null;

  return (
    <Screen>
      <NavBar title={lessonKindLabel(data.kind)} />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.header}>
          <Eyebrow>{joinMeta([`Lesson ${data.position}`, lessonKindLabel(data.kind)])}</Eyebrow>
          <Text style={[styles.title, { color: colors.text }]}>{data.title}</Text>
          <View style={styles.headerMeta}>
            {data.duration_minutes ? <Tag label={`${data.duration_minutes} min`} /> : null}
            {data.completed ? <Tag label="Completed" tone="success" icon="award" /> : null}
          </View>
        </View>

        {data.media?.url ? (
          <View style={styles.media}>
            <SermonVideoPlayer uri={data.media.url} title={data.title} />
          </View>
        ) : null}

        {data.body ? (
          <View style={styles.body}>
            {data.body.split('\n\n').map((paragraph, index) => (
              <Text key={index} variant="bodyLarge" style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ) : data.kind === 'live' ? (
          <View style={styles.body}>
            <Banner
              tone="info"
              icon="video"
              message="This lesson is a live session. The join link is on the course page when the church publishes it."
            />
          </View>
        ) : null}

        {data.materials.length > 0 ? (
          <View style={styles.materials}>
            <Text variant="metaStrong" color="textSecondary" uppercase style={styles.materialsLabel}>
              Materials
            </Text>
            {data.materials.map((material, index) => (
              <View key={material.id}>
                {index > 0 ? <Rule /> : null}
                <Pressable
                  onPress={() => {
                    if (!isSafeExternalUrl(material.url)) {
                      toast('That file link is not valid.', { tone: 'warning' });
                      return;
                    }
                    void WebBrowser.openBrowserAsync(material.url);
                  }}
                  accessibilityLabel={`Open ${material.title}`}
                  style={styles.materialRow}
                >
                  <Icon name="file" size="sm" color="primary" />
                  <Text variant="body" style={styles.materialTitle}>
                    {material.title}
                  </Text>
                  <Icon name="external-link" size="sm" color="textTertiary" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {data.quiz_id ? (
          <View style={styles.actions}>
            <Button
              label={data.completed ? 'Retake the quiz' : 'Take the quiz'}
              icon="award"
              fullWidth
              onPress={() => router.push(`/quizzes/${data.quiz_id}`)}
            />
          </View>
        ) : null}

        <View style={styles.actions}>
          {completeError ? (
            <Banner tone="danger" title={completeError.title} message={completeError.message} />
          ) : null}

          {data.completed ? (
            <Banner
              tone="success"
              icon="award"
              message="The church has recorded this lesson as complete."
            />
          ) : (
            <Button
              label="Mark as complete"
              fullWidth
              loading={complete.isPending}
              onPress={() => complete.mutate()}
            />
          )}

          <View style={styles.navRow}>
            {data.previous_lesson_id ? (
              <Button
                label="Previous"
                variant="ghost"
                icon="chevron-left"
                onPress={() => router.replace(`/lessons/${data.previous_lesson_id}`)}
              />
            ) : (
              <View />
            )}
            {data.next_lesson_id ? (
              <Button
                label="Next lesson"
                variant="secondary"
                icon="chevron-right"
                iconPosition="trailing"
                onPress={() => router.replace(`/lessons/${data.next_lesson_id}`)}
              />
            ) : null}
          </View>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: space.gutter,
    gap: space.md,
  },
  forbidden: {
    padding: space.gutter,
    gap: space.lg,
  },
  header: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    gap: space.sm,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: space.sm,
  },
  media: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
  },
  body: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    gap: space.lg,
    maxWidth: 640,
  },
  paragraph: {
    lineHeight: 27,
  },
  materials: {
    paddingTop: space.xxxl,
  },
  materialsLabel: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.sm,
    letterSpacing: 0.8,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  materialTitle: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    gap: space.md,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space.sm,
  },
  materialsLabelSpacer: {
    height: space.md,
  },
});
