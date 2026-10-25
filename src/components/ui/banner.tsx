import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { type ColorToken } from '@/design/tokens';

import { Icon, type IconName } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

export type BannerTone = 'info' | 'accent' | 'success' | 'warning' | 'danger';

const toneStyles: Record<
  BannerTone,
  { background: ColorToken; text: ColorToken; icon: IconName }
> = {
  info: { background: 'surfaceMuted', text: 'textSecondary', icon: 'info' },
  accent: { background: 'accentSoft', text: 'accentOnSoft', icon: 'bookmark' },
  success: { background: 'successSoft', text: 'successOnSoft', icon: 'check-circle' },
  warning: { background: 'warningSoft', text: 'warningOnSoft', icon: 'alert-triangle' },
  danger: { background: 'dangerSoft', text: 'dangerOnSoft', icon: 'alert-circle' },
};

/**
 * Inline notice used for demo-mode disclosures, offline state, pending payments
 * and anything else the member must read before trusting what is on screen.
 */
export function Banner({
  tone = 'info',
  title,
  message,
  icon,
  action,
  style,
}: {
  tone?: BannerTone;
  title?: string;
  message: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const resolved = toneStyles[tone];

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors[resolved.background] }, style]}
    >
      <View style={styles.iconColumn}>
        <Icon name={icon ?? resolved.icon} size="sm" color={resolved.text} />
      </View>
      <View style={styles.body}>
        {title ? (
          <Text variant="metaStrong" color={resolved.text}>
            {title}
          </Text>
        ) : null}
        <Text variant="meta" color={resolved.text}>
          {message}
        </Text>
        {action ? (
          <Pressable inline onPress={action.onPress} style={styles.action}>
            <Text variant="metaStrong" color={resolved.text} style={styles.actionLabel}>
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.sm,
  },
  iconColumn: {
    paddingTop: 2,
  },
  body: {
    flex: 1,
    gap: space.xxs,
  },
  action: {
    minHeight: 0,
    marginTop: space.xs,
  },
  actionLabel: {
    textDecorationLine: 'underline',
  },
});
