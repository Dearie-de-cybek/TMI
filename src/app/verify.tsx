import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { describeError, fieldError } from '@/api/errors';
import { AuthShell } from '@/components/app/auth-shell';
import { useToast } from '@/components/app/toast';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { space } from '@/design/tokens';
import { resendVerification, verifyAccount } from '@/features/auth/api';
import { useAuth } from '@/features/auth/store';
import { validate, verificationSchema, type FieldErrors } from '@/lib/validation';

/**
 * Email/phone verification. Reached only when the backend said verification is
 * required; the member can also leave and verify later, because unverified
 * accounts can still browse public content.
 */
export default function VerifyScreen() {
  const router = useRouter();
  const toast = useToast();
  const member = useAuth((state) => state.member);
  const requiresVerification = useAuth((state) => state.requiresVerification);
  const setMember = useAuth((state) => state.setMember);
  const clearVerificationRequirement = useAuth((state) => state.clearVerificationRequirement);

  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const destination =
    requiresVerification === 'phone' ? (member?.phone ?? 'your phone') : (member?.email ?? 'your email');

  async function submit() {
    setError(null);
    const result = validate(verificationSchema, { code });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const updated = await verifyAccount(result.data.code);
      setMember(updated);
      clearVerificationRequirement();
      toast('Account verified.', { tone: 'success', icon: 'check' });
      router.replace('/interests');
    } catch (caught) {
      setError(caught);
      setErrors({ code: fieldError(caught, 'code') });
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setResendState('sending');
    try {
      await resendVerification();
      setResendState('sent');
    } catch (caught) {
      setError(caught);
      setResendState('idle');
    }
  }

  const described = error ? describeError(error) : null;

  return (
    <AuthShell
      title="Verify your account"
      description={`We sent a six-digit code to ${destination}. Enter it to finish setting up your account.`}
    >
      {described ? <Banner tone="danger" title={described.title} message={described.message} /> : null}
      {resendState === 'sent' ? (
        <Banner tone="success" message="A new code is on its way." />
      ) : null}

      <TextField
        label="Verification code"
        value={code}
        onChangeText={setCode}
        error={errors.code}
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        icon="shield"
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
      />

      <Button label="Verify" fullWidth loading={submitting} onPress={() => void submit()} />

      <View style={styles.secondary}>
        <Button
          label="Send a new code"
          variant="secondary"
          fullWidth
          loading={resendState === 'sending'}
          onPress={() => void resend()}
        />
        <Button
          label="Verify later"
          variant="ghost"
          fullWidth
          onPress={() => router.replace('/')}
        />
        <Text variant="caption" color="textTertiary">
          You can browse sermons, events and announcements before verifying. Giving, courses and
          prayer requests need a verified account.
        </Text>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  secondary: {
    gap: space.sm,
  },
});
