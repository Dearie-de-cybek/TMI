import { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '@/design/tokens';

import { Icon } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

/**
 * The recurring section head: a bold title, and an optional "See all ›" link on
 * the right. Used on Home, Discover and detail screens. The `eyebrow` prop is
 * kept for callers that still pass one, but it is no longer drawn - the title
 * says what the section is.
 */
export function SectionHeader({
  title,
  action,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.titleRow}>
        <Text variant="title" style={styles.title}>
          {title}
        </Text>
        {action ? (
          <Pressable
            onPress={action.onPress}
            accessibilityLabel={action.label}
            feedback="opacity"
            inline
            style={styles.action}
          >
            <Text variant="metaStrong" color="text">
              {action.label}
            </Text>
            <Icon name="chevron-right" size="sm" color="text" />
          </Pressable>
        ) : null}
      </View>
      {description ? (
        <Text variant="meta" color="textSecondary" style={styles.description}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

/** Vertical rhythm wrapper for a section's content. */
export function Section({ children }: PropsWithChildren) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: space.xxl,
    paddingBottom: space.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  title: {
    flexShrink: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 0,
  },
  description: {
    marginTop: space.xs,
    maxWidth: 520,
  },
  section: {
    paddingBottom: space.sm,
  },
});
