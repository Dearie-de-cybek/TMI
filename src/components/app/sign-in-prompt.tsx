import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';

/**
 * Inline invitation to sign in, used in place of a member-only section rather
 * than as a wall in front of a whole screen.
 */
export function SignInPrompt({
  title,
  message,
  reason,
  next,
}: {
  title: string;
  message: string;
  /** Passed to the sign-in screen so it can explain why it opened. */
  reason: string;
  next?: string;
}) {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.primarySoft }]}>
      <Text variant="headline" color="primaryOnSoft">
        {title}
      </Text>
      <Text variant="meta" color="primaryOnSoft" style={styles.message}>
        {message}
      </Text>
      <View style={styles.actions}>
        <Button
          label="Sign in"
          onPress={() =>
            router.push({ pathname: '/sign-in', params: { reason, ...(next ? { next } : {}) } })
          }
        />
        <Button label="Create account" variant="ghost" onPress={() => router.push('/sign-up')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: space.xl,
    borderRadius: radius.sm,
    gap: space.xs,
  },
  message: {
    marginBottom: space.md,
    maxWidth: 420,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flexWrap: 'wrap',
  },
});
