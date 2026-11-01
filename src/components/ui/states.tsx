import { type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { describeError } from '@/api/errors';
import { useColors } from '@/design/theme';
import { space } from '@/design/tokens';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

/**
 * Empty state. Every list in the app has one, written for the specific absence
 * ("no sermons saved yet") rather than a generic "no data".
 */
export function EmptyState({
  icon = 'inbox',
  title,
  message,
  action,
  compact = false,
}: {
  icon?: IconName;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
  compact?: boolean;
}) {
  const colors = useColors();

  return (
    <View style={[styles.centered, compact ? styles.compact : styles.roomy]}>
      <View style={[styles.glyph, { borderColor: colors.border }]}>
        <Icon name={icon} size="md" color="textTertiary" />
      </View>
      <Text variant="headline" align="center">
        {title}
      </Text>
      <Text variant="meta" color="textSecondary" align="center" style={styles.message}>
        {message}
      </Text>
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="secondary" size="sm" />
      ) : null}
    </View>
  );
}

/**
 * Error state for a failed load. Only offers a retry when retrying could
 * plausibly help - an authorisation failure gets different wording and no button.
 */
export function ErrorState({
  error,
  onRetry,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const described = describeError(error);

  return (
    <View style={[styles.centered, compact ? styles.compact : styles.roomy]}>
      <View style={styles.glyph}>
        <Icon name="alert-circle" size="md" color="danger" />
      </View>
      <Text variant="headline" align="center">
        {described.title}
      </Text>
      <Text variant="meta" color="textSecondary" align="center" style={styles.message}>
        {described.message}
      </Text>
      {onRetry && described.retryable ? (
        <Button label="Try again" onPress={onRetry} variant="secondary" size="sm" icon="refresh-cw" />
      ) : null}
    </View>
  );
}

/** Spinner for operations with no outline to show (payment hand-off, sign-in). */
export function LoadingState({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.centered, styles.roomy]} accessibilityLabel={label} accessible>
      <ActivityIndicator color={colors.primary} />
      <Text variant="meta" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

/**
 * Renders the right state for an async read: skeleton while loading, error with
 * retry on failure, the empty state when the result is empty, content otherwise.
 */
export function AsyncBoundary<T>({
  query,
  skeleton,
  empty,
  isEmpty,
  children,
}: {
  query: {
    data: T | undefined;
    error: unknown;
    isPending: boolean;
    isError: boolean;
    refetch: () => void;
  };
  skeleton: ReactNode;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <>{skeleton}</>;
  if (query.isError || query.data === undefined) {
    return <ErrorState error={query.error} onRetry={query.refetch} />;
  }
  if (empty && isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xxl,
  },
  roomy: {
    paddingVertical: space.giant,
  },
  compact: {
    paddingVertical: space.xxl,
  },
  glyph: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    maxWidth: 320,
  },
});
