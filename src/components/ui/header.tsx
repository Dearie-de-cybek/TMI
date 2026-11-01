import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/design/theme';
import { hairline, space } from '@/design/tokens';

import { Icon, type IconName } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

export type HeaderAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** Small count rendered as a brass dot with a number. */
  badge?: number;
};

function ActionButton({ action }: { action: HeaderAction }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={action.onPress}
      accessibilityLabel={action.label}
      feedback="opacity"
      style={styles.action}
    >
      <Icon name={action.icon} size="md" color="text" />
      {action.badge && action.badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Text variant="caption" color="textOnAccent" style={styles.badgeLabel}>
            {action.badge > 9 ? '9+' : String(action.badge)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Header for the tab roots: one big bold title, with the page actions on the
 * same line. The `eyebrow` prop is accepted for older callers and not drawn.
 */
export function PageHeader({
  title,
  actions = [],
}: {
  eyebrow?: string;
  title: string;
  actions?: HeaderAction[];
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top + space.md }]}>
      <Text variant="display" style={styles.pageTitle}>
        {title}
      </Text>
      <View style={styles.actionRow}>
        {actions.map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </View>
    </View>
  );
}

/**
 * Header for pushed screens. Keeps a real back affordance (the gesture alone is
 * not enough for members using a screen reader) and an optional trailing action.
 */
export function NavBar({
  title,
  subtitle,
  actions = [],
  transparent = false,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  actions?: HeaderAction[];
  transparent?: boolean;
  onBack?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.nav,
        {
          paddingTop: insets.top + space.xs,
          backgroundColor: transparent ? 'transparent' : colors.background,
          borderBottomWidth: transparent ? 0 : hairline,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onBack ?? (() => router.back())}
        accessibilityLabel="Go back"
        feedback="opacity"
        style={styles.action}
      >
        <Icon name="chevron-left" size="lg" color="text" />
      </Pressable>

      <View style={styles.navTitle}>
        {title ? (
          <Text variant="labelStrong" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        {actions.map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </View>
    </View>
  );
}

/** Spacer matching `NavBar` height, for screens that render it transparently. */
export function NavBarSpacer({ children }: { children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.top + 48 }}>{children}</View>;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
    paddingBottom: space.lg,
  },
  pageTitle: {
    flex: 1,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: space.xs,
    paddingHorizontal: space.sm,
    gap: space.xs,
  },
  navTitle: {
    flex: 1,
    paddingHorizontal: space.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  action: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
});
