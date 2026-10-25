import { useMutation } from '@tanstack/react-query';
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
import { changePassword } from '@/features/auth/api';
import { useAuth } from '@/features/auth/store';
import { changePasswordSchema, validate, type FieldErrors } from '@/lib/validation';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const signedIn = useAuth((state) => state.status === 'signedIn');
  const signOut = useAuth((state) => state.signOut);

  const [values, setValues] = useState({
    currentPassword: '',
    password: '',
    passwordConfirmation: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const change = useMutation({
    mutationFn: () => changePassword(values),
    onSuccess: async () => {
      toast('Password changed. Sign in again on this device.', { tone: 'success', icon: 'lock' });
      // Changing a password invalidates the session everywhere, so the local
      // token is dropped rather than left to fail on the next request.
      await signOut({ revokeOnServer: true });
      router.replace('/sign-in');
    },
    onError: (error) =>
      setErrors({
        currentPassword: fieldError(error, 'current_password'),
        password: fieldError(error, 'password'),
        passwordConfirmation: fieldError(error, 'password_confirmation'),
      }),
  });

  if (!signedIn) {
    return (
      <AuthShell title="Security" description="Sign in to manage your password.">
        <Button label="Sign in" fullWidth onPress={() => router.replace('/sign-in')} />
      </AuthShell>
    );
  }

  const described = change.error ? describeError(change.error) : null;

  return (
    <AuthShell
      title="Password and security"
      description="Your password is checked by the church server. This app never stores it."
    >
      {described && Object.values(errors).every((value) => !value) ? (
        <Banner tone="danger" title={described.title} message={described.message} />
      ) : null}

      <TextField
        label="Current password"
        value={values.currentPassword}
        onChangeText={(value) => setValues((current) => ({ ...current, currentPassword: value }))}
        error={errors.currentPassword}
        secure
        autoComplete="current-password"
        icon="lock"
      />
      <TextField
        label="New password"
        value={values.password}
        onChangeText={(value) => setValues((current) => ({ ...current, password: value }))}
        error={errors.password}
        hint="At least 8 characters. Longer is better than complicated."
        secure
        autoComplete="new-password"
        icon="lock"
      />
      <TextField
        label="Repeat new password"
        value={values.passwordConfirmation}
        onChangeText={(value) =>
          setValues((current) => ({ ...current, passwordConfirmation: value }))
        }
        error={errors.passwordConfirmation}
        secure
        autoComplete="new-password"
        icon="lock"
      />

      <Button
        label="Change password"
        fullWidth
        loading={change.isPending}
        onPress={() => {
          const result = validate(changePasswordSchema, values);
          if (!result.ok) {
            setErrors(result.errors);
            return;
          }
          setErrors({});
          change.mutate();
        }}
      />

      <View style={styles.notes}>
        <Text variant="metaStrong" color="textSecondary">
          How your session is kept
        </Text>
        <Text variant="meta" color="textSecondary">
          Signing in stores a single access token in your device’s keychain — not your password. The
          token is sent only to the church API, and signing out removes it from this device and
          revokes it on the server.
        </Text>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  notes: {
    gap: space.xs,
    paddingTop: space.lg,
  },
});
