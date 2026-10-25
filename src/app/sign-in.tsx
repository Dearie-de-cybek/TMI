import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { describeError, fieldError } from '@/api/errors';
import { AuthShell } from '@/components/app/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useRuntimeConfig } from '@/config/runtime';
import { space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { signInSchema, validate, type FieldErrors } from '@/lib/validation';
import { safeInAppPath } from '@/lib/deep-links';

/**
 * Reasons the sign-in screen can be reached, so it explains itself rather than
 * appearing without context.
 */
const reasons: Record<string, string> = {
  expired: 'Your session has expired. Sign in to pick up where you left off.',
  member: 'Sign in to use this part of the app.',
  save: 'Sign in to save sermons to your account.',
  enroll: 'Sign in to enrol in a course.',
  give: 'Sign in so your giving can be recorded against your account.',
  prayer: 'Sign in to send a prayer request to the pastoral team.',
  register: 'Sign in to register for church events.',
  notifications: 'Sign in to see your notifications.',
  profile: 'Sign in to see your profile, courses and saved content.',
};

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reason?: string; next?: string }>();
  const signInWith = useAuth((state) => state.signInWith);
  const demoMode = useRuntimeConfig((state) => state.apiMode) === 'demo';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  const reasonMessage = params.reason ? reasons[params.reason] : undefined;

  async function submit() {
    setSubmitError(null);
    const result = validate(signInSchema, { email, password });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await signInWith(result.data);
      const next = safeInAppPath(params.next ?? null);
      if (next) {
        router.replace(next);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (error) {
      setSubmitError(error);
      setErrors({
        email: fieldError(error, 'email'),
        password: fieldError(error, 'password'),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const described = submitError ? describeError(submitError) : null;

  return (
    <AuthShell
      title="Welcome back"
      description={reasonMessage ?? 'Sign in with the email address the church has on record for you.'}
      footer={
        <View style={styles.footer}>
          <Pressable inline onPress={() => router.push('/forgot-password')}>
            <Text variant="metaStrong" color="primary">
              Forgotten your password?
            </Text>
          </Pressable>
          <View style={styles.footerRow}>
            <Text variant="meta" color="textSecondary">
              New to Kingdom Heralds?
            </Text>
            <Pressable inline onPress={() => router.replace('/sign-up')}>
              <Text variant="metaStrong" color="primary">
                Create an account
              </Text>
            </Pressable>
          </View>
        </View>
      }
    >
      {described && !described.retryable && Object.keys(errors).length === 0 ? (
        <Banner tone="danger" title={described.title} message={described.message} />
      ) : null}
      {described && described.retryable ? (
        <Banner tone="warning" title={described.title} message={described.message} />
      ) : null}

      <TextField
        label="Email address"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        icon="mail"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secure
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        icon="lock"
      />

      <Button label="Sign in" fullWidth loading={submitting} onPress={() => void submit()} />

      {demoMode ? (
        <Banner
          tone="info"
          title="Demo mode"
          message="Any email and a password of 8 or more characters signs you in. Use the password “wrongpass” to see the rejected-credentials state, or an email starting with “locked” for a suspended account. No account is created on a server."
        />
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: space.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    flexWrap: 'wrap',
  },
});
