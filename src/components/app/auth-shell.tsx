import { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { NavBar } from '@/components/ui/header';
import { KeyboardAware, Screen, ScreenScroll } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { space } from '@/design/tokens';

/**
 * Shared frame for the authentication forms: back affordance, a serif title and
 * one supporting line, then the form. Keeps every auth screen on the same
 * measure and spacing.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: PropsWithChildren<{ title: string; description?: string; footer?: React.ReactNode }>) {
  return (
    <Screen>
      <NavBar transparent />
      <KeyboardAware>
        <ScreenScroll padded bottomSpace={space.xxxl}>
          <View style={styles.header}>
            <Text variant="display">{title}</Text>
            {description ? (
              <Text variant="body" color="textSecondary" style={styles.description}>
                {description}
              </Text>
            ) : null}
          </View>
          <View style={styles.form}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScreenScroll>
      </KeyboardAware>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.sm,
    maxWidth: 480,
  },
  description: {
    maxWidth: 440,
  },
  form: {
    gap: space.xl,
  },
  footer: {
    paddingTop: space.xxl,
    gap: space.md,
  },
});
