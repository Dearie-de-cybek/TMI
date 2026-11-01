import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ApiError, describeError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type AskConversation, type AskMessage } from '@/api/schemas';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { QuoteBlock } from '@/components/ui/quote';
import { KeyboardAware, Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { askSermon, fetchAskConversation, fetchSermon } from '@/features/sermons/api';
import { formatDuration } from '@/lib/datetime';
import { askQuestionSchema, validate } from '@/lib/validation';

const starters = [
  'What were the main points?',
  'Which passages were used?',
  'What was said about forgiveness?',
];

/**
 * Ask the Sermon.
 *
 * Questions go to the backend, which answers from that sermon's transcript and
 * the church's approved study notes. The screen keeps the sermon in view, shows
 * the passages an answer came from, and says plainly when the material does not
 * answer the question rather than filling the gap.
 */
export default function AskSermonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const sermon = useQuery({
    queryKey: queryKeys.sermon(id),
    queryFn: ({ signal }) => fetchSermon(id, signal),
    enabled: Boolean(id),
  });

  const conversation = useQuery({
    queryKey: queryKeys.askConversation(id),
    queryFn: () => fetchAskConversation(id),
    enabled: Boolean(id),
  });

  const ask = useMutation({
    mutationFn: (value: string) => askSermon({ sermonId: id, question: value }),
    onSuccess: (result) => {
      queryClient.setQueryData<AskConversation>(queryKeys.askConversation(id), (previous) => ({
        id: result.id,
        sermon_id: result.sermon_id,
        messages: [...(previous?.messages ?? []), ...result.messages],
      }));
      setQuestion('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    },
  });

  function submit(value: string) {
    const result = validate(askQuestionSchema, { question: value });
    if (!result.ok) {
      setError(result.errors.question);
      return;
    }
    setError(undefined);
    ask.mutate(result.data.question);
  }

  const messages = conversation.data?.messages ?? [];
  const askFailure = ask.error ? describeError(ask.error) : null;
  const serviceUnavailable =
    ApiError.isApiError(ask.error) && ask.error.kind === 'unavailable';

  return (
    <Screen>
      <NavBar
        title="Ask about this sermon"
        subtitle={sermon.data ? sermon.data.title : undefined}
      />

      <KeyboardAware>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {sermon.data ? (
            <View style={[styles.context, { backgroundColor: colors.surfaceMuted }]}>
              <Eyebrow color="textTertiary">You are asking about</Eyebrow>
              <Text variant="bodyStrong" numberOfLines={2}>
                {sermon.data.title}
              </Text>
              <Text variant="caption" color="textSecondary">
                {sermon.data.speaker.name}
              </Text>
            </View>
          ) : null}

          <Banner
            tone="info"
            icon="info"
            message="Answers are assembled from this sermon's transcript and the church's study notes. They are not new statements from the pastor, and they are not a substitute for speaking with the pastoral team."
          />

          {conversation.isPending ? (
            <View style={styles.loading}>
              <Skeleton height={14} width="60%" />
              <Skeleton height={64} />
            </View>
          ) : conversation.isError ? (
            <ErrorState compact error={conversation.error} onRetry={() => void conversation.refetch()} />
          ) : messages.length === 0 ? (
            <View style={styles.starters}>
              <Text variant="metaStrong" color="textSecondary">
                Try one of these
              </Text>
              {starters.map((starter) => (
                <Pressable
                  key={starter}
                  onPress={() => submit(starter)}
                  disabled={ask.isPending}
                  style={[styles.starter, { borderColor: colors.border }]}
                  accessibilityLabel={`Ask: ${starter}`}
                >
                  <Text variant="body">{starter}</Text>
                  <Icon name="arrow-up-right" size="sm" color="textTertiary" />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.messages}>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </View>
          )}

          {ask.isPending ? (
            <View style={[styles.thinking, { backgroundColor: colors.surfaceMuted }]}>
              <Text variant="meta" color="textSecondary">
                Looking through the transcript…
              </Text>
            </View>
          ) : null}

          {askFailure ? (
            <Banner
              tone={serviceUnavailable ? 'warning' : 'danger'}
              title={serviceUnavailable ? 'The study assistant is unavailable' : askFailure.title}
              message={
                serviceUnavailable
                  ? 'This is temporary. The transcript and study notes are still on the sermon page.'
                  : askFailure.message
              }
              action={
                askFailure.retryable && question.length > 0
                  ? { label: 'Try again', onPress: () => submit(question) }
                  : undefined
              }
            />
          ) : null}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TextField
            label="Your question"
            value={question}
            onChangeText={setQuestion}
            error={error}
            placeholder="What did the sermon say about…"
            multiline
            containerStyle={styles.composerField}
            onSubmitEditing={() => submit(question)}
          />
          <Button
            label="Ask"
            icon="send"
            loading={ask.isPending}
            disabled={question.trim().length === 0}
            onPress={() => submit(question)}
          />
        </View>
      </KeyboardAware>
    </Screen>
  );
}

function MessageBubble({ message }: { message: AskMessage }) {
  const colors = useColors();
  const fromMember = message.role === 'member';

  return (
    <View style={fromMember ? styles.memberRow : styles.assistantRow}>
      <View
        style={[
          styles.bubble,
          fromMember
            ? { backgroundColor: colors.primary, borderTopRightRadius: radius.xs }
            : { backgroundColor: colors.surfaceMuted, borderTopLeftRadius: radius.xs },
        ]}
      >
        <Text variant="body" color={fromMember ? 'textOnAccent' : 'text'}>
          {message.content}
        </Text>
      </View>

      {message.unanswered_reason ? (
        <Text variant="caption" color="textTertiary" style={styles.citationNote}>
          The sermon material did not cover this.
        </Text>
      ) : null}

      {message.citations.length > 0 ? (
        <View style={styles.citations}>
          <Eyebrow color="textTertiary">From the sermon</Eyebrow>
          {message.citations.map((citation, index) => (
            <QuoteBlock
              key={index}
              compact
              label={
                [
                  citation.start_seconds != null ? formatDuration(citation.start_seconds) : null,
                  citation.scripture_reference ?? null,
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
            >
              {citation.quote}
            </QuoteBlock>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.gutter,
    gap: space.lg,
    paddingBottom: space.xxxl,
  },
  context: {
    padding: space.lg,
    borderRadius: radius.sm,
    gap: 2,
  },
  loading: {
    gap: space.sm,
  },
  starters: {
    gap: space.sm,
  },
  starter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  messages: {
    gap: space.xl,
  },
  memberRow: {
    alignItems: 'flex-end',
    gap: space.xs,
  },
  assistantRow: {
    alignItems: 'flex-start',
    gap: space.xs,
  },
  bubble: {
    maxWidth: '92%',
    padding: space.lg,
    borderRadius: radius.md,
  },
  citations: {
    gap: space.sm,
    paddingTop: space.xs,
  },
  citationNote: {
    paddingTop: 2,
  },
  thinking: {
    padding: space.md,
    borderRadius: radius.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    paddingBottom: space.lg,
    borderTopWidth: 1,
  },
  composerField: {
    flex: 1,
  },
});
