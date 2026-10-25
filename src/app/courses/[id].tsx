import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, StyleSheet, View } from 'react-native';

import { describeError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type LessonSummary, type LiveSession, type Material } from '@/api/schemas';
import { useToast } from '@/components/app/toast';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/chips';
import { ContentImage } from '@/components/ui/content-image';
import { NavBar } from '@/components/ui/header';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { ProgressBar } from '@/components/ui/progress';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { enrollInCourse, fetchCourse, fetchCourseSessions } from '@/features/learning/api';
import { formatDate, formatDateTimeWithZone, isPast } from '@/lib/datetime';
import { isSafeExternalUrl } from '@/lib/deep-links';
import { joinMeta, lessonKindLabel, pluralise } from '@/lib/format';

const lessonIcons: Record<LessonSummary['kind'], IconName> = {
  reading: 'file-text',
  video: 'play-circle',
  audio: 'headphones',
  quiz: 'check-square',
  assignment: 'edit-3',
  live: 'video',
};

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();

  const course = useQuery({
    queryKey: queryKeys.course(id),
    queryFn: ({ signal }) => fetchCourse(id, signal),
    enabled: Boolean(id),
  });

  const enrolled = Boolean(course.data?.my_enrollment);

  const sessions = useQuery({
    queryKey: queryKeys.courseSessions(id),
    queryFn: () => fetchCourseSessions(id),
    enabled: Boolean(id) && enrolled,
  });

  const enroll = useMutation({
    mutationFn: () => enrollInCourse(id),
    onSuccess: (result) => {
      toast(result.message ?? 'You are enrolled.', { tone: 'success', icon: 'check' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.course(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });

  if (course.isPending) {
    return (
      <Screen>
        <NavBar />
        <View style={styles.loading}>
          <Skeleton height={160} />
          <Skeleton width="45%" height={12} />
          <Skeleton width="80%" height={26} />
          <Skeleton height={80} />
        </View>
      </Screen>
    );
  }

  if (course.isError) {
    return (
      <Screen>
        <NavBar />
        <ErrorState error={course.error} onRetry={() => void course.refetch()} />
      </Screen>
    );
  }

  const data = course.data;
  const enrollment = data.my_enrollment;
  const enrollError = enroll.error ? describeError(enroll.error) : null;

  return (
    <Screen>
      <NavBar title={data.title} />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.hero}>
          <ContentImage
            uri={data.artwork_url}
            seed={data.title}
            height={150}
            label={`Artwork for ${data.title}`}
            style={{ borderRadius: radius.sm }}
          />
          <View style={styles.heroText}>
            <Eyebrow>{data.cohort?.name ?? 'Course'}</Eyebrow>
            <Text style={[styles.title, { color: colors.text }]}>{data.title}</Text>
            {data.summary ? (
              <Text variant="bodyLarge" color="textSecondary">
                {data.summary}
              </Text>
            ) : null}
            <Text variant="meta" color="textTertiary">
              {joinMeta([
                data.instructors.map((instructor) => instructor.name).join(', '),
                data.lesson_count > 0 ? pluralise(data.lesson_count, 'lesson') : null,
                data.starts_at ? `Starts ${formatDate(data.starts_at)}` : null,
              ])}
            </Text>
          </View>
        </View>

        <View style={styles.enrollBlock}>
          {enrollError ? (
            <Banner tone="danger" title={enrollError.title} message={enrollError.message} />
          ) : null}

          {enrollment ? (
            <View style={[styles.progressBlock, { backgroundColor: colors.primarySoft }]}>
              <Eyebrow color="accentOnSoft">Your progress</Eyebrow>
              <ProgressBar
                value={enrollment.percent_complete / 100}
                label={`${enrollment.completed_lessons} of ${enrollment.total_lessons} lessons complete`}
              />
              {data.resume_lesson_id ? (
                <Button
                  label={enrollment.completed_lessons === 0 ? 'Start the first lesson' : 'Resume'}
                  icon="play"
                  onPress={() => router.push(`/lessons/${data.resume_lesson_id}`)}
                  style={styles.resumeButton}
                />
              ) : enrollment.status === 'completed' ? (
                <Text variant="meta" color="primaryOnSoft">
                  You have completed every lesson in this course.
                </Text>
              ) : null}
            </View>
          ) : data.enrollment_mode === 'open' ? (
            <Button
              label="Enrol in this course"
              fullWidth
              loading={enroll.isPending}
              onPress={() => {
                if (!requireAuth({ reason: 'enroll', next: `/courses/${id}` })) return;
                enroll.mutate();
              }}
            />
          ) : data.enrollment_mode === 'code_required' ? (
            <>
              <Banner
                tone="accent"
                icon="key"
                title="This course needs an access code"
                message="The discipleship team issues a one-time code for each cohort. It is checked and used up on the church server."
              />
              <Button
                label="Enter an access code"
                fullWidth
                onPress={() => {
                  if (!requireAuth({ reason: 'enroll', next: '/courses/activate' })) return;
                  router.push('/courses/activate');
                }}
              />
            </>
          ) : data.enrollment_mode === 'invite_only' ? (
            <Banner
              tone="info"
              title="By invitation"
              message="Members are invited to this course by the discipleship team."
            />
          ) : (
            <Banner
              tone="info"
              title="Enrolment is closed"
              message="This cohort has started. Ask the church office when the next one opens."
            />
          )}
        </View>

        {data.description ? (
          <View style={styles.block}>
            <SectionHeader title="About this course" />
            <Text variant="bodyLarge">{data.description}</Text>
          </View>
        ) : null}

        {data.requirements.length > 0 ? (
          <View style={styles.block}>
            <SectionHeader title="What you need" />
            {data.requirements.map((requirement) => (
              <View key={requirement} style={styles.bullet}>
                <Icon name="check" size="xs" color="primary" />
                <Text variant="body" style={styles.bulletText}>
                  {requirement}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader
            eyebrow={enrolled ? undefined : 'Preview'}
            title="Lessons"
            description={
              enrolled
                ? undefined
                : 'Lesson content opens once the church has recorded your enrolment.'
            }
          />
        </View>

        {data.modules.length === 0 ? (
          <Text variant="meta" color="textTertiary" style={styles.blockText}>
            The lesson plan has not been published yet.
          </Text>
        ) : (
          data.modules.map((module) => (
            <View key={module.id} style={styles.module}>
              <View style={styles.moduleHeader}>
                <Text variant="metaStrong" color="textSecondary" uppercase style={styles.moduleTitle}>
                  {module.title}
                </Text>
              </View>
              {module.lessons.map((lesson, index) => (
                <View key={lesson.id}>
                  {index > 0 ? <Rule inset={space.gutter} /> : null}
                  <Pressable
                    onPress={() => {
                      if (lesson.locked) {
                        toast(lesson.lock_reason ?? 'This lesson is not open to you yet.', {
                          tone: 'warning',
                          icon: 'lock',
                        });
                        return;
                      }
                      router.push(`/lessons/${lesson.id}`);
                    }}
                    accessibilityLabel={`${lesson.title}. ${lessonKindLabel(lesson.kind)}${
                      lesson.completed ? '. Completed' : lesson.locked ? '. Locked' : ''
                    }`}
                    style={styles.lessonRow}
                  >
                    <Icon
                      name={lesson.completed ? 'check-circle' : lesson.locked ? 'lock' : lessonIcons[lesson.kind]}
                      size="md"
                      color={lesson.completed ? 'success' : lesson.locked ? 'textTertiary' : 'primary'}
                    />
                    <View style={styles.lessonText}>
                      <Text
                        variant="body"
                        color={lesson.locked ? 'textTertiary' : 'text'}
                        numberOfLines={2}
                      >
                        {lesson.title}
                      </Text>
                      <Text variant="caption" color="textTertiary">
                        {joinMeta([
                          lessonKindLabel(lesson.kind),
                          lesson.duration_minutes ? `${lesson.duration_minutes} min` : null,
                        ])}
                      </Text>
                    </View>
                    {lesson.locked ? null : (
                      <Icon name="chevron-right" size="sm" color="textTertiary" />
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          ))
        )}

        {enrolled ? <CourseSessions sessions={sessions.data} loading={sessions.isPending} /> : null}

        {data.materials.length > 0 ? (
          <>
            <View style={styles.block}>
              <SectionHeader title="Course materials" />
            </View>
            {data.materials.map((material, index) => (
              <View key={material.id}>
                {index > 0 ? <Rule inset={space.gutter} /> : null}
                <MaterialRow material={material} />
              </View>
            ))}
          </>
        ) : null}

        {data.communication?.whatsapp_group_url ? (
          <View style={styles.block}>
            <SectionHeader eyebrow="Your cohort" title="Class group" />
            <Text variant="body" color="textSecondary">
              {data.communication.whatsapp_group_name ?? 'The class group'} is run by the
              discipleship team on WhatsApp.
            </Text>
            <Button
              label="Open the group invite"
              variant="secondary"
              icon="external-link"
              iconPosition="trailing"
              onPress={() => {
                const url = data.communication!.whatsapp_group_url!;
                if (!isSafeExternalUrl(url)) {
                  toast('That link is not valid.', { tone: 'warning' });
                  return;
                }
                void Linking.openURL(url).catch(() =>
                  toast('WhatsApp could not be opened on this device.', { tone: 'warning' })
                );
              }}
            />
            <Text variant="caption" color="textTertiary">
              This opens WhatsApp. Joining happens there, not in this app, and the church can see
              who is in the group.
            </Text>
          </View>
        ) : null}

        {data.certificate ? (
          <View style={styles.block}>
            <SectionHeader eyebrow="Issued by the church" title="Certificate" />
            <Text variant="body" color="textSecondary">
              Issued {formatDate(data.certificate.issued_at)}.
            </Text>
            {data.certificate.url && isSafeExternalUrl(data.certificate.url) ? (
              <Button
                label="View certificate"
                variant="secondary"
                icon="award"
                onPress={() => void WebBrowser.openBrowserAsync(data.certificate!.url!)}
              />
            ) : null}
          </View>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

function CourseSessions({
  sessions,
  loading,
}: {
  sessions: LiveSession[] | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.block}>
        <Skeleton height={60} />
      </View>
    );
  }
  if (!sessions || sessions.length === 0) return null;

  return (
    <>
      <View style={styles.block}>
        <SectionHeader title="Live sessions" />
      </View>
      {sessions.map((session, index) => {
        const past = isPast(session.starts_at);
        const url = past ? session.recording_url : session.join_url;

        return (
          <View key={session.id}>
            {index > 0 ? <Rule inset={space.gutter} /> : null}
            <View style={styles.sessionRow}>
              <View style={styles.lessonText}>
                <Text variant="body">{session.title}</Text>
                <Text variant="caption" color="textTertiary">
                  {formatDateTimeWithZone(session.starts_at, session.timezone)}
                </Text>
                {session.attendance !== 'unknown' ? (
                  <View style={styles.attendance}>
                    <Tag
                      label={session.attendance === 'present' ? 'Attended' : 'Marked absent'}
                      tone={session.attendance === 'present' ? 'success' : 'neutral'}
                    />
                  </View>
                ) : null}
              </View>
              {url && isSafeExternalUrl(url) ? (
                <Button
                  label={past ? 'Watch' : 'Join'}
                  size="sm"
                  variant="secondary"
                  onPress={() => void WebBrowser.openBrowserAsync(url)}
                />
              ) : (
                <Text variant="caption" color="textTertiary">
                  {past ? 'No recording' : 'Link to follow'}
                </Text>
              )}
            </View>
          </View>
        );
      })}
      <Text variant="caption" color="textTertiary" style={styles.blockText}>
        Sessions open in the webinar tool the church uses. Attendance is recorded by the church, not
        by this app.
      </Text>
    </>
  );
}

function MaterialRow({ material }: { material: Material }) {
  const toast = useToast();
  const icons: Record<Material['kind'], IconName> = {
    pdf: 'file',
    link: 'link',
    audio: 'headphones',
    video: 'play-circle',
    document: 'file-text',
  };

  return (
    <Pressable
      onPress={() => {
        if (!isSafeExternalUrl(material.url)) {
          toast('That file link is not valid.', { tone: 'warning' });
          return;
        }
        void WebBrowser.openBrowserAsync(material.url);
      }}
      accessibilityLabel={`Open ${material.title}`}
      style={styles.lessonRow}
    >
      <Icon name={icons[material.kind]} size="md" color="primary" />
      <View style={styles.lessonText}>
        <Text variant="body">{material.title}</Text>
        <Text variant="caption" color="textTertiary" uppercase>
          {material.kind}
        </Text>
      </View>
      <Icon name="external-link" size="sm" color="textTertiary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: space.gutter,
    gap: space.md,
  },
  hero: {
    paddingHorizontal: space.gutter,
    gap: space.lg,
  },
  heroText: {
    gap: space.sm,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.5,
  },
  enrollBlock: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    gap: space.md,
  },
  progressBlock: {
    padding: space.lg,
    borderRadius: radius.sm,
    gap: space.sm,
  },
  resumeButton: {
    marginTop: space.sm,
  },
  block: {
    paddingHorizontal: space.gutter,
    gap: space.md,
    paddingBottom: space.sm,
  },
  blockText: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
  },
  bullet: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
  },
  bulletText: {
    flex: 1,
  },
  module: {
    paddingTop: space.md,
  },
  moduleHeader: {
    paddingHorizontal: space.gutter,
    paddingVertical: space.sm,
  },
  moduleTitle: {
    letterSpacing: 0.8,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  lessonText: {
    flex: 1,
    gap: 2,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  attendance: {
    paddingTop: space.xs,
  },
});
