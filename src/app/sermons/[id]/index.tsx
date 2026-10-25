import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { describeError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type Sermon } from '@/api/schemas';
import { useToast } from '@/components/app/toast';
import { SermonRow } from '@/components/content/rows';
import { AudioPlayer } from '@/components/media/audio-player';
import { SermonVideoPlayer } from '@/components/media/video-player';
import { Banner } from '@/components/ui/banner';
import { SegmentedControl, Tag } from '@/components/ui/chips';
import { ContentImage } from '@/components/ui/content-image';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import {
  fetchRelatedSermons,
  fetchSermon,
  fetchStudyNotes,
  fetchTranscript,
  saveSermon,
  unsaveSermon,
} from '@/features/sermons/api';
import { useSermonPlayer } from '@/features/sermons/use-sermon-player';
import { formatDate, formatDuration, formatMinutes } from '@/lib/datetime';
import { joinMeta } from '@/lib/format';

type Panel = 'about' | 'transcript' | 'study';

export default function SermonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const signedIn = useAuth((state) => state.status === 'signedIn');
  const requireAuth = useRequireAuth();

  const [panel, setPanel] = useState<Panel>('about');
  const [mediaMode, setMediaMode] = useState<'audio' | 'video'>('audio');

  const sermonQuery = useQuery({
    queryKey: queryKeys.sermon(id),
    queryFn: ({ signal }) => fetchSermon(id, signal),
    enabled: Boolean(id),
  });
  const sermon = sermonQuery.data;

  const player = useSermonPlayer(mediaMode === 'audio' ? sermon : undefined, signedIn);

  const save = useMutation({
    mutationFn: (next: boolean) => (next ? saveSermon(id) : unsaveSermon(id)),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sermon(id) });
      const previous = queryClient.getQueryData<Sermon>(queryKeys.sermon(id));
      if (previous) {
        queryClient.setQueryData<Sermon>(queryKeys.sermon(id), { ...previous, saved: next });
      }
      return { previous };
    },
    onError: (error, _next, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.sermon(id), context.previous);
      toast(describeError(error).title, { tone: 'warning', icon: 'alert-circle' });
    },
    onSuccess: (_result, next) => {
      toast(next ? 'Saved to your library.' : 'Removed from your library.', { icon: 'bookmark' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.saved });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });

  if (sermonQuery.isPending) {
    return (
      <Screen>
        <NavBar />
        <View style={styles.loading}>
          <Skeleton height={200} />
          <Skeleton width="40%" height={12} />
          <Skeleton width="85%" height={28} />
          <Skeleton width="60%" height={14} />
          <Skeleton height={120} />
        </View>
      </Screen>
    );
  }

  if (sermonQuery.isError || !sermon) {
    return (
      <Screen>
        <NavBar />
        <ErrorState error={sermonQuery.error} onRetry={() => void sermonQuery.refetch()} />
      </Screen>
    );
  }

  const hasVideo = Boolean(sermon.video);
  const hasAudio = Boolean(sermon.audio);
  const length = sermon.audio?.duration_seconds ?? sermon.video?.duration_seconds ?? null;

  const panels: { value: Panel; label: string }[] = [
    { value: 'about', label: 'About' },
    ...(sermon.has_transcript ? [{ value: 'transcript' as const, label: 'Transcript' }] : []),
    ...(sermon.has_study_notes ? [{ value: 'study' as const, label: 'Study notes' }] : []),
  ];

  async function share() {
    try {
      await Share.share({
        title: sermon!.title,
        message: `${sermon!.title} — ${sermon!.speaker.name}, TwainMan Ministry`,
      });
    } catch {
      // The member dismissed the share sheet.
    }
  }

  return (
    <Screen>
      <NavBar
        transparent
        actions={[
          { icon: 'share', label: 'Share this sermon', onPress: () => void share() },
          {
            icon: sermon.saved ? 'bookmark' : 'bookmark',
            label: sermon.saved ? 'Remove from saved' : 'Save this sermon',
            onPress: () => {
              if (!requireAuth({ reason: 'save', next: `/sermons/${id}` })) return;
              save.mutate(!sermon.saved);
            },
          },
        ]}
      />

      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.hero}>
          <ContentImage
            uri={sermon.artwork_url}
            seed={sermon.title}
            label={`Artwork for ${sermon.title}`}
            height={180}
            style={{ borderRadius: radius.sm }}
          />
          <View style={styles.heroText}>
            <Eyebrow>{sermon.series?.title ?? sermon.topics[0] ?? 'Teaching'}</Eyebrow>
            <Text style={[styles.title, { color: colors.text }]}>{sermon.title}</Text>
            <Text variant="meta" color="textSecondary">
              {joinMeta([
                sermon.speaker.name,
                sermon.speaker.role,
                formatDate(sermon.preached_at),
                formatMinutes(length),
              ])}
            </Text>
          </View>

          {sermon.scripture_references.length > 0 ? (
            <View style={styles.tags}>
              {sermon.scripture_references.map((reference) => (
                <Tag key={reference} label={reference} tone="accent" icon="book" />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.media}>
          {hasVideo && hasAudio ? (
            <View style={styles.mediaToggle}>
              <SegmentedControl
                label="Choose audio or video"
                value={mediaMode}
                onChange={setMediaMode}
                options={[
                  { value: 'audio', label: 'Listen' },
                  { value: 'video', label: 'Watch' },
                ]}
              />
            </View>
          ) : null}

          {mediaMode === 'video' && sermon.video ? (
            <SermonVideoPlayer uri={sermon.video.url} title={sermon.title} />
          ) : (
            <AudioPlayer player={player} title={sermon.title} />
          )}

          {!hasAudio && hasVideo && mediaMode === 'audio' ? (
            <Banner
              tone="info"
              message="Only video was published for this teaching."
              action={{ label: 'Watch instead', onPress: () => setMediaMode('video') }}
            />
          ) : null}
        </View>

        {sermon.ask_enabled ? (
          <Pressable
            onPress={() => {
              if (!requireAuth({ reason: 'member', next: `/sermons/${id}/ask` })) return;
              router.push(`/sermons/${id}/ask`);
            }}
            style={[styles.askRow, { borderColor: colors.border }]}
            accessibilityLabel="Ask a question about this sermon"
          >
            <Icon name="message-circle" size="md" color="primary" />
            <View style={styles.askText}>
              <Text variant="labelStrong">Ask about this sermon</Text>
              <Text variant="caption" color="textSecondary">
                Answers are drawn from the transcript and the church’s study notes.
              </Text>
            </View>
            <Icon name="chevron-right" size="sm" color="textTertiary" />
          </Pressable>
        ) : null}

        {panels.length > 1 ? (
          <View style={styles.panelTabs}>
            <SegmentedControl
              label="Sermon detail"
              value={panel}
              onChange={setPanel}
              options={panels}
            />
          </View>
        ) : null}

        {panel === 'about' ? (
          <AboutPanel sermon={sermon} />
        ) : panel === 'transcript' ? (
          <TranscriptPanel sermonId={id} onSeek={player.seekTo} canSeek={player.available} />
        ) : (
          <StudyPanel sermonId={id} />
        )}
      </ScreenScroll>
    </Screen>
  );
}

function AboutPanel({ sermon }: { sermon: Sermon }) {
  const router = useRouter();
  const related = useQuery({
    queryKey: queryKeys.relatedSermons(sermon.id),
    queryFn: () => fetchRelatedSermons(sermon.id),
  });

  return (
    <View>
      <View style={styles.panelBody}>
        {sermon.description ? (
          <Text variant="bodyLarge" style={styles.description}>
            {sermon.description}
          </Text>
        ) : sermon.summary ? (
          <Text variant="bodyLarge" style={styles.description}>
            {sermon.summary}
          </Text>
        ) : (
          <Text variant="body" color="textTertiary">
            No description was published for this teaching.
          </Text>
        )}

        {sermon.topics.length > 0 ? (
          <View style={styles.topics}>
            {sermon.topics.map((topic) => (
              <Tag key={topic} label={topic} />
            ))}
          </View>
        ) : null}
      </View>

      {related.data && related.data.length > 0 ? (
        <>
          <View style={styles.panelBody}>
            <SectionHeader eyebrow="Keep going" title="Related teaching" />
          </View>
          {related.data.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <Rule inset={space.gutter} /> : null}
              <SermonRow sermon={item} onPress={() => router.push(`/sermons/${item.id}`)} />
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

function TranscriptPanel({
  sermonId,
  onSeek,
  canSeek,
}: {
  sermonId: string;
  onSeek: (seconds: number) => void;
  canSeek: boolean;
}) {
  const colors = useColors();
  const transcript = useQuery({
    queryKey: queryKeys.transcript(sermonId),
    queryFn: ({ signal }) => fetchTranscript(sermonId, signal),
  });

  if (transcript.isPending) return <SkeletonList count={4} withThumbnail={false} />;
  if (transcript.isError) {
    return (
      <ErrorState error={transcript.error} onRetry={() => void transcript.refetch()} compact />
    );
  }
  if (transcript.data.segments.length === 0) {
    return (
      <EmptyState
        compact
        icon="file-text"
        title="No transcript yet"
        message="The media team publishes transcripts after a teaching is edited."
      />
    );
  }

  return (
    <View style={styles.panelBody}>
      {transcript.data.source === 'machine' ? (
        <Banner
          tone="info"
          message="This transcript was produced automatically, so it may contain small errors."
          style={styles.transcriptNotice}
        />
      ) : null}

      {transcript.data.segments.map((segment, index) => (
        <View key={`${segment.start_seconds}-${index}`} style={styles.segment}>
          <Pressable
            inline
            disabled={!canSeek}
            onPress={() => onSeek(segment.start_seconds)}
            accessibilityLabel={`Jump to ${formatDuration(segment.start_seconds)}`}
            style={styles.timestamp}
          >
            <Text variant="caption" color={canSeek ? 'primary' : 'textTertiary'}>
              {formatDuration(segment.start_seconds)}
            </Text>
          </Pressable>
          <View style={styles.segmentText}>
            {segment.speaker ? (
              <Text variant="caption" color="textTertiary" uppercase style={styles.speaker}>
                {segment.speaker}
              </Text>
            ) : null}
            <Text variant="bodyLarge" style={{ color: colors.text }}>
              {segment.text}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function StudyPanel({ sermonId }: { sermonId: string }) {
  const notes = useQuery({
    queryKey: queryKeys.studyNotes(sermonId),
    queryFn: ({ signal }) => fetchStudyNotes(sermonId, signal),
  });

  if (notes.isPending) return <SkeletonList count={3} withThumbnail={false} />;
  if (notes.isError) {
    return <ErrorState error={notes.error} onRetry={() => void notes.refetch()} compact />;
  }

  const data = notes.data;

  return (
    <View style={styles.panelBody}>
      <Banner
        tone={data.generated_by === 'ai' ? 'accent' : 'info'}
        icon={data.generated_by === 'ai' ? 'cpu' : 'edit-3'}
        title={
          data.generated_by === 'ai'
            ? data.review_status === 'approved'
              ? 'AI-assisted notes, reviewed by the ministry team'
              : 'AI-assisted notes, not yet reviewed'
            : 'Notes written by the ministry team'
        }
        message={
          data.generated_by === 'ai'
            ? 'These notes summarise the recording. They are not the preacher’s own words — check the transcript for what was actually said.'
            : 'Prepared alongside the teaching.'
        }
      />

      <StudyBlock title="In short">
        <Text variant="bodyLarge">{data.summary}</Text>
      </StudyBlock>

      {data.key_points.length > 0 ? (
        <StudyBlock title="Key points">
          {data.key_points.map((point, index) => (
            <NumberedItem key={point} index={index} text={point} />
          ))}
        </StudyBlock>
      ) : null}

      {data.scriptures.length > 0 ? (
        <StudyBlock title="Passages">
          {data.scriptures.map((scripture) => (
            <View key={scripture.reference} style={styles.scripture}>
              <Text variant="metaStrong" color="accent">
                {scripture.reference}
              </Text>
              {scripture.text ? (
                <Text variant="quote" color="textSecondary">
                  “{scripture.text}”
                </Text>
              ) : null}
            </View>
          ))}
        </StudyBlock>
      ) : null}

      {data.applications.length > 0 ? (
        <StudyBlock title="This week">
          {data.applications.map((application, index) => (
            <NumberedItem key={application} index={index} text={application} />
          ))}
        </StudyBlock>
      ) : null}

      {data.reflection_questions.length > 0 ? (
        <StudyBlock title="To talk about">
          {data.reflection_questions.map((question) => (
            <Text key={question} variant="bodyLarge" style={styles.question}>
              {question}
            </Text>
          ))}
        </StudyBlock>
      ) : null}
    </View>
  );
}

function StudyBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.studyBlock}>
      <SectionHeader title={title} />
      <View style={styles.studyBody}>{children}</View>
    </View>
  );
}

function NumberedItem({ index, text }: { index: number; text: string }) {
  return (
    <View style={styles.numbered}>
      <Text variant="caption" color="accent" style={styles.numberedIndex}>
        {String(index + 1).padStart(2, '0')}
      </Text>
      <Text variant="bodyLarge" style={styles.numberedText}>
        {text}
      </Text>
    </View>
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
    gap: space.xs,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  media: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    gap: space.md,
  },
  mediaToggle: {
    alignSelf: 'flex-start',
  },
  askRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.xxl,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  askText: {
    flex: 1,
    gap: 2,
  },
  panelTabs: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
  },
  panelBody: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    gap: space.lg,
  },
  description: {
    maxWidth: 620,
  },
  topics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  transcriptNotice: {
    marginBottom: space.sm,
  },
  segment: {
    flexDirection: 'row',
    gap: space.lg,
  },
  timestamp: {
    width: 52,
    paddingTop: 5,
    minHeight: 0,
  },
  segmentText: {
    flex: 1,
    gap: space.xxs,
  },
  speaker: {
    letterSpacing: 0.8,
  },
  studyBlock: {
    gap: space.xs,
  },
  studyBody: {
    gap: space.md,
  },
  numbered: {
    flexDirection: 'row',
    gap: space.md,
  },
  numberedIndex: {
    width: 22,
    paddingTop: 6,
  },
  numberedText: {
    flex: 1,
  },
  scripture: {
    gap: space.xs,
  },
  question: {
    paddingBottom: space.sm,
  },
});
