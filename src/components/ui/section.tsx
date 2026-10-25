import { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColors } from '@/design/theme';
import { hairline, space } from '@/design/tokens';

import { Icon } from './icon';
import { Pressable } from './pressable';
import { Eyebrow, Text } from './text';

/**
 * The recurring editorial section head: brass eyebrow, serif title on a rule,
 * and an optional link on the right. Used on Home, Discover and detail screens
 * so sections read as chapters rather than as a grid of cards.
 */
export function SectionHeader({
  eyebrow,
  title,
  action,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}) {
  const colors = useColors();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.rule, { backgroundColor: colors.borderStrong }]} />
      {eyebrow ? <Eyebrow style={styles.eyebrow}>{eyebrow}</Eyebrow> : null}
      <View style={styles.titleRow}>
        <Text variant="headline" style={styles.title}>
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
            <Text variant="metaStrong" color="primary">
              {action.label}
            </Text>
            <Icon name="arrow-right" size="xs" color="primary" />
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
    paddingBottom: space.md,
  },
  rule: {
    height: hairline * 2,
    marginBottom: space.md,
  },
  eyebrow: {
    marginBottom: space.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
  },
  title: {
    flexShrink: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
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
