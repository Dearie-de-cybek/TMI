import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { describeError, fieldError } from '@/api/errors';
import { AuthShell } from '@/components/app/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { env } from '@/config/env';
import { useRuntimeConfig } from '@/config/runtime';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { signUpSchema, validate, type FieldErrors } from '@/lib/validation';

export default function SignUpScreen() {
  const router = useRouter();
  const colors = useColors();
  const signUpWith = useAuth((state) => state.signUpWith);
  const requiresVerification = useAuth((state) => state.requiresVerification);
  const demoMode = useRuntimeConfig((state) => state.apiMode) === 'demo';

  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirmation: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof typeof values>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setSubmitError(null);
    const result = validate(signUpSchema, { ...values, acceptedTerms });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await signUpWith({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        password: result.data.password,
        passwordConfirmation: result.data.passwordConfirmation,
        acceptedTerms: true,
      });
      // The backend decides whether verification is required; the store records
      // what it said and the next screen follows that, not a local guess.
      router.replace(requiresVerification === null ? '/interests' : '/verify');
    } catch (error) {
      setSubmitError(error);
      setErrors({
        name: fieldError(error, 'name'),
        email: fieldError(error, 'email'),
        phone: fieldError(error, 'phone'),
        password: fieldError(error, 'password'),
        passwordConfirmation: fieldError(error, 'password_confirmation'),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const described = submitError ? describeError(submitError) : null;

  return (
    <AuthShell
      title="Join the church app"
      description="Your account connects you to your courses, saved teaching, giving record and prayer requests."
      footer={
        <View style={styles.footerRow}>
          <Text variant="meta" color="textSecondary">
            Already registered?
          </Text>
          <Pressable inline onPress={() => router.replace('/sign-in')}>
            <Text variant="metaStrong" color="primary">
              Sign in
            </Text>
          </Pressable>
        </View>
      }
    >
      {described ? <Banner tone="danger" title={described.title} message={described.message} /> : null}

      <TextField
        label="Full name"
        value={values.name}
        onChangeText={(value) => setField('name', value)}
        error={errors.name}
        autoComplete="name"
        textContentType="name"
        icon="user"
      />
      <TextField
        label="Email address"
        value={values.email}
        onChangeText={(value) => setField('email', value)}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        icon="mail"
      />
      <TextField
        label="Phone number"
        value={values.phone}
        onChangeText={(value) => setField('phone', value)}
        error={errors.phone}
        hint="Optional. The church uses it only for urgent pastoral contact."
        keyboardType="phone-pad"
        autoComplete="tel"
        icon="phone"
      />
      <TextField
        label="Password"
        value={values.password}
        onChangeText={(value) => setField('password', value)}
        error={errors.password}
        hint="At least 8 characters."
        secure
        autoComplete="new-password"
        icon="lock"
      />
      <TextField
        label="Repeat password"
        value={values.passwordConfirmation}
        onChangeText={(value) => setField('passwordConfirmation', value)}
        error={errors.passwordConfirmation}
        secure
        autoComplete="new-password"
        icon="lock"
      />

      <Pressable
        onPress={() => setAcceptedTerms((value) => !value)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
        accessibilityLabel="I accept the terms of use and privacy policy"
        style={styles.consentRow}
        feedback="none"
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: errors.acceptedTerms ? colors.danger : colors.borderStrong,
              backgroundColor: acceptedTerms ? colors.primary : 'transparent',
            },
          ]}
        >
          {acceptedTerms ? <Icon name="shield" size="xs" color="textOnAccent" /> : null}
        </View>
        <View style={styles.consentText}>
          <Text variant="meta" color="textSecondary">
            I accept the{' '}
            <Text
              variant="metaStrong"
              color="primary"
              onPress={() => router.push(`/legal/terms?url=${encodeURIComponent(env.church.termsUrl)}`)}
            >
              terms of use
            </Text>{' '}
            and the{' '}
            <Text
              variant="metaStrong"
              color="primary"
              onPress={() =>
                router.push(`/legal/privacy?url=${encodeURIComponent(env.church.privacyUrl)}`)
              }
            >
              privacy policy
            </Text>
            .
          </Text>
          {errors.acceptedTerms ? (
            <Text variant="caption" color="danger">
              {errors.acceptedTerms}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <Button label="Create account" fullWidth loading={submitting} onPress={() => void submit()} />

      {demoMode ? (
        <Banner
          tone="info"
          title="Demo mode"
          message="No account is created and no email is sent. The form runs its real validation so the flow can be checked end to end."
        />
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    flexWrap: 'wrap',
  },
  consentRow: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    paddingVertical: space.xs,
  },
  consentText: {
    flex: 1,
    gap: space.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
