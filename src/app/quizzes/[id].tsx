import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError, describeError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type Quiz, type QuizResult } from '@/api/schemas';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { ProgressBar } from '@/components/ui/progress';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { fetchQuiz, submitQuizAttempt } from '@/features/learning/api';

/**
 * A quiz.
 *
 * Answers are marked on the server - correct options are never sent to the
 * device - and the score shown is the one the server returned.
 */
export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const quiz = useQuery({
    queryKey: queryKeys.quiz(id),
    queryFn: ({ signal }) => fetchQuiz(id, signal),
    enabled: Boolean(id),
  });

  const submit = useMutation({
    mutationFn: () => submitQuizAttempt({ quizId: id, answers }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quiz(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });

  function toggle(questionId: string, optionId: string, multiple: boolean) {
    setValidationMessage(null);
    setAnswers((current) => {
      const existing = current[questionId] ?? [];
      if (!multiple) return { ...current, [questionId]: [optionId] };
      return {
        ...current,
        [questionId]: existing.includes(optionId)
          ? existing.filter((item) => item !== optionId)
          : [...existing, optionId],
      };
    });
  }

  if (quiz.isPending) {
    return (
      <Screen>
        <NavBar title="Quiz" />
        <SkeletonList count={4} withThumbnail={false} />
      </Screen>
    );
  }

  if (quiz.isError) {
    return (
      <Screen>
        <NavBar title="Quiz" />
        <ErrorState error={quiz.error} onRetry={() => void quiz.refetch()} />
      </Screen>
    );
  }

  const data = quiz.data;

  if (submit.isSuccess) {
    return <QuizResultView quiz={data} result={submit.data} onRetake={() => submit.reset()} />;
  }

  const attemptsLeft =
    data.attempts_allowed == null ? null : data.attempts_allowed - data.attempts_used;
  const exhausted = attemptsLeft != null && attemptsLeft <= 0;
  const answered = Object.values(answers).filter((value) => value.length > 0).length;
  const submitError = submit.error ? describeError(submit.error) : null;
  const attemptsBlocked =
    ApiError.isApiError(submit.error) && submit.error.code === 'quiz_attempts_exhausted';

  return (
    <Screen>
      <NavBar title={data.title} />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.header}>
          <Eyebrow>
            {attemptsLeft == null
              ? 'Unlimited attempts'
              : `${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left`}
          </Eyebrow>
          <Text style={styles.title}>{data.title}</Text>
          {data.instructions ? (
            <Text variant="body" color="textSecondary">
              {data.instructions}
            </Text>
          ) : null}
          <Text variant="caption" color="textTertiary">
            Pass mark {data.passing_score}%.
          </Text>
          <View style={styles.progress}>
            <ProgressBar
              value={answered / data.questions.length}
              label={`${answered} of ${data.questions.length} answered`}
            />
          </View>
        </View>

        {exhausted ? (
          <View style={styles.block}>
            <Banner
              tone="warning"
              icon="lock"
              title="No attempts left"
              message="You have used every attempt for this quiz. The discipleship team can reset it if needed."
            />
          </View>
        ) : null}

        {data.questions.map((question, index) => (
          <View key={question.id} style={styles.question}>
            <Text variant="caption" color="accent" uppercase>
              Question {index + 1}
              {question.kind === 'multiple' ? ' · choose all that apply' : ''}
            </Text>
            <Text variant="headline" style={styles.prompt}>
              {question.prompt}
            </Text>
            {question.options.map((option) => (
              <Option
                key={option.id}
                label={option.label}
                multiple={question.kind === 'multiple'}
                selected={(answers[question.id] ?? []).includes(option.id)}
                disabled={exhausted}
                onPress={() => toggle(question.id, option.id, question.kind === 'multiple')}
              />
            ))}
          </View>
        ))}

        <View style={styles.block}>
          {validationMessage ? (
            <Banner tone="warning" message={validationMessage} />
          ) : null}
          {submitError && !attemptsBlocked ? (
            <Banner tone="danger" title={submitError.title} message={submitError.message} />
          ) : null}
          {attemptsBlocked ? (
            <Banner
              tone="warning"
              title="No attempts left"
              message="The server rejected this attempt because you have used them all."
            />
          ) : null}

          <Button
            label="Submit answers"
            fullWidth
            loading={submit.isPending}
            disabled={exhausted}
            onPress={() => {
              if (answered < data.questions.length) {
                setValidationMessage(
                  `Answer all ${data.questions.length} questions before submitting.`
                );
                return;
              }
              submit.mutate();
            }}
          />
          <Button label="Back to the lesson" variant="ghost" fullWidth onPress={() => router.back()} />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

function Option({
  label,
  selected,
  multiple,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  multiple: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
      feedback="none"
      style={[
        styles.option,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primarySoft : 'transparent',
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.marker,
          multiple ? styles.markerSquare : styles.markerRound,
          { borderColor: selected ? colors.primary : colors.borderStrong, backgroundColor: selected ? colors.primary : 'transparent' },
        ]}
      >
        {selected ? <Icon name="edit-3" size="xs" color="textOnAccent" /> : null}
      </View>
      <Text variant="body" style={styles.optionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function QuizResultView({
  quiz,
  result,
  onRetake,
}: {
  quiz: Quiz;
  result: QuizResult;
  onRetake: () => void;
}) {
  const router = useRouter();
  const colors = useColors();
  const attemptsLeft =
    quiz.attempts_allowed == null ? null : quiz.attempts_allowed - quiz.attempts_used - 1;

  return (
    <Screen>
      <NavBar title="Result" />
      <ScreenScroll padded bottomSpace={space.giant}>
        <View
          style={[
            styles.resultPlate,
            { backgroundColor: result.passed ? colors.successSoft : colors.warningSoft },
          ]}
        >
          <Eyebrow color={result.passed ? 'successOnSoft' : 'warningOnSoft'}>
            {result.passed ? 'Passed' : 'Not passed yet'}
          </Eyebrow>
          <Text
            style={[styles.score, { color: result.passed ? colors.successOnSoft : colors.warningOnSoft }]}
          >
            {result.score}%
          </Text>
          <Text variant="meta" color={result.passed ? 'successOnSoft' : 'warningOnSoft'}>
            {result.correct_count} of {result.total_count} correct · pass mark {quiz.passing_score}%
          </Text>
        </View>

        {result.feedback.length > 0 ? (
          <View style={styles.feedback}>
            {result.feedback.map((item, index) => {
              const question = quiz.questions.find((candidate) => candidate.id === item.question_id);
              return (
                <View key={item.question_id} style={styles.feedbackItem}>
                  <Icon
                    name={item.correct ? 'thumbs-up' : 'refresh-cw'}
                    size="md"
                    color={item.correct ? 'success' : 'danger'}
                  />
                  <View style={styles.feedbackText}>
                    <Text variant="bodyStrong">{question?.prompt ?? `Question ${index + 1}`}</Text>
                    {item.explanation ? (
                      <Text variant="meta" color="textSecondary">
                        {item.explanation}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.resultActions}>
          {!result.passed && (attemptsLeft == null || attemptsLeft > 0) ? (
            <Button label="Try again" fullWidth onPress={onRetake} />
          ) : null}
          <Button
            label="Back to the course"
            variant={result.passed ? 'primary' : 'secondary'}
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    gap: space.sm,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    lineHeight: 29,
  },
  progress: {
    paddingTop: space.md,
    maxWidth: 320,
  },
  block: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    gap: space.md,
  },
  question: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxxl,
    gap: space.sm,
  },
  prompt: {
    paddingBottom: space.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  marker: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerRound: {
    borderRadius: 11,
  },
  markerSquare: {
    borderRadius: radius.xs,
  },
  optionLabel: {
    flex: 1,
  },
  resultPlate: {
    marginTop: space.lg,
    padding: space.xl,
    borderRadius: radius.sm,
    gap: space.xs,
  },
  score: {
    fontFamily: fonts.sansBold,
    fontSize: 44,
    lineHeight: 50,
  },
  feedback: {
    paddingTop: space.xxl,
    gap: space.lg,
  },
  feedbackItem: {
    flexDirection: 'row',
    gap: space.md,
  },
  feedbackText: {
    flex: 1,
    gap: 2,
  },
  resultActions: {
    paddingTop: space.xxxl,
    gap: space.sm,
  },
});
