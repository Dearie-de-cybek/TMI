import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { describeError, fieldError } from '@/api/errors';
import { AuthShell } from '@/components/app/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/app/toast';
import { resetPassword } from '@/features/auth/api';
import { resetPasswordSchema, validate, type FieldErrors } from '@/lib/validation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const toast = useToast();

  const [values, setValues] = useState({
    email: params.email ?? '',
    token: params.token ?? '',
    password: '',
    passwordConfirmation: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setError(null);
    const result = validate(resetPasswordSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await resetPassword(result.data);
      toast('Password reset. Sign in with your new password.', { tone: 'success', icon: 'key' });
      router.replace('/sign-in');
    } catch (caught) {
      setError(caught);
      setErrors({
        email: fieldError(caught, 'email'),
        token: fieldError(caught, 'token'),
        password: fieldError(caught, 'password'),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const described = error ? describeError(error) : null;

  return (
    <AuthShell
      title="Choose a new password"
      description="Enter the code from your email along with a new password."
    >
      {described ? <Banner tone="danger" title={described.title} message={described.message} /> : null}
      <TextField
        label="Email address"
        value={values.email}
        onChangeText={(value) => setField('email', value)}
        error={errors.email}
        autoCapitalize="none"
        keyboardType="email-address"
        icon="mail"
      />
      <TextField
        label="Reset code"
        value={values.token}
        onChangeText={(value) => setField('token', value)}
        error={errors.token}
        autoCapitalize="characters"
        icon="key"
      />
      <TextField
        label="New password"
        value={values.password}
        onChangeText={(value) => setField('password', value)}
        error={errors.password}
        hint="At least 8 characters."
        secure
        autoComplete="new-password"
        icon="lock"
      />
      <TextField
        label="Repeat new password"
        value={values.passwordConfirmation}
        onChangeText={(value) => setField('passwordConfirmation', value)}
        error={errors.passwordConfirmation}
        secure
        autoComplete="new-password"
        icon="lock"
      />
      <Button label="Reset password" fullWidth loading={submitting} onPress={() => void submit()} />
    </AuthShell>
  );
}
