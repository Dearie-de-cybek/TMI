import { useRouter } from 'expo-router';
import { useState } from 'react';

import { describeError, fieldError } from '@/api/errors';
import { AuthShell } from '@/components/app/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { requestPasswordReset } from '@/features/auth/api';
import { forgotPasswordSchema, validate, type FieldErrors } from '@/lib/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<unknown>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    const result = validate(forgotPasswordSchema, { email });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await requestPasswordReset(result.data.email);
      setSentTo(result.data.email);
    } catch (caught) {
      setError(caught);
      setErrors({ email: fieldError(caught, 'email') });
    } finally {
      setSubmitting(false);
    }
  }

  const described = error ? describeError(error) : null;

  if (sentTo) {
    return (
      <AuthShell
        title="Check your email"
        description={`If ${sentTo} belongs to a member, a reset code is on its way. The code is valid for a short time.`}
      >
        <Button
          label="I have a code"
          fullWidth
          onPress={() =>
            router.replace({ pathname: '/reset-password', params: { email: sentTo } })
          }
        />
        <Button label="Back to sign in" variant="ghost" fullWidth onPress={() => router.replace('/sign-in')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email address on your account and we will send a reset code."
    >
      {described ? <Banner tone="danger" title={described.title} message={described.message} /> : null}
      <TextField
        label="Email address"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        icon="mail"
        returnKeyType="send"
        onSubmitEditing={() => void submit()}
      />
      <Button label="Send reset code" fullWidth loading={submitting} onPress={() => void submit()} />
    </AuthShell>
  );
}
