import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError, describeError, fieldError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { AuthShell } from '@/components/app/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useRuntimeConfig } from '@/config/runtime';
import { space } from '@/design/tokens';
import { activateAccessCode } from '@/features/learning/api';
import { accessCodeSchema, validate } from '@/lib/validation';

/**
 * One-time access code activation.
 *
 * The code is sent to the server, which validates it, checks eligibility and
 * consumes it. The app only renders the outcome — it never decides whether a
 * code is valid, and a successful screen here always means the server granted
 * the enrolment.
 */
const outcomeMessages: Record<string, { title: string; message: string }> = {
  access_code_invalid: {
    title: 'That code is not recognised',
    message: 'Check for typos. Codes look like KH-LEAD-2026, and letters are not case-sensitive.',
  },
  access_code_expired: {
    title: 'That code has expired',
    message: 'Ask the discipleship team for a new one — codes are issued per cohort.',
  },
  access_code_used: {
    title: 'That code has already been used',
    message: 'Each code works once. If you believe it was used in error, contact the church office.',
  },
  access_code_ineligible: {
    title: 'Not eligible for that course yet',
    message:
      'The course has a prerequisite you have not completed. The course page lists what is required.',
  },
};

export default function ActivateCourseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const demoMode = useRuntimeConfig((state) => state.apiMode) === 'demo';

  const [code, setCode] = useState('');
  const [fieldErrorText, setFieldErrorText] = useState<string | undefined>(undefined);

  const activate = useMutation({
    mutationFn: (value: string) => activateAccessCode(value),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.course(result.enrollment.course_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
    onError: (error) => {
      setFieldErrorText(fieldError(error, 'code'));
    },
  });

  function submit() {
    const result = validate(accessCodeSchema, { code });
    if (!result.ok) {
      setFieldErrorText(result.errors.code);
      return;
    }
    setFieldErrorText(undefined);
    activate.mutate(result.data.code);
  }

  if (activate.isSuccess) {
    const enrollment = activate.data.enrollment;
    return (
      <AuthShell
        title="You are in"
        description={activate.data.message ?? 'The course has been added to your account.'}
      >
        <Banner
          tone="success"
          title="Access granted by the church server"
          message="Your enrolment is recorded against your account, so your progress follows you between devices."
        />
        <View style={styles.actions}>
          <Button
            label="Open the course"
            fullWidth
            onPress={() => router.replace(`/courses/${enrollment.course_id}`)}
          />
          <Button label="Back to courses" variant="ghost" fullWidth onPress={() => router.replace('/courses')} />
        </View>
      </AuthShell>
    );
  }

  const code_ = ApiError.isApiError(activate.error) ? activate.error.code : undefined;
  const outcome = code_ ? outcomeMessages[code_] : undefined;
  const described = activate.error ? describeError(activate.error) : null;

  return (
    <AuthShell
      title="Enter your access code"
      description="Some courses are opened with a one-time code from the discipleship team. The code is checked and used up on the church server."
    >
      {outcome ? (
        <Banner tone="warning" title={outcome.title} message={outcome.message} />
      ) : described && !fieldErrorText ? (
        <Banner tone="danger" title={described.title} message={described.message} />
      ) : null}

      <TextField
        label="Access code"
        value={code}
        onChangeText={(value) => setCode(value.toUpperCase())}
        error={fieldErrorText}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="KH-LEAD-2026"
        icon="key"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Button
        label="Activate"
        fullWidth
        loading={activate.isPending}
        disabled={code.trim().length === 0}
        onPress={submit}
      />

      <Text variant="caption" color="textTertiary">
        Codes are issued per cohort and work once. If yours does not work, the church office can
        issue another.
      </Text>

      {demoMode ? (
        <Banner
          tone="info"
          title="Demo codes"
          message="KH-LEAD-2026 is accepted. KH-LEAD-OLD1 is expired, KH-LEAD-USED is already used, and KH-FOUND-123 is not eligible — so each outcome can be checked."
        />
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: space.sm,
  },
});
