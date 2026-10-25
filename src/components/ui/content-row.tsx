import { type ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { useColors } from '@/design/theme';
import { space } from '@/design/tokens';

import { ContentImage } from './content-image';
import { Icon, type IconName } from './icon';
import { Pressable } from './pressable';
import { Eyebrow, Text } from './text';

/**
 * The workhorse list item: compact, left-aligned, separated by hairlines rather
 * than wrapped in a card. Thumbnails are optional so text-led content (announcements,
 * prayer requests) does not get a meaningless square next to it.
 */
export function ContentRow({
  eyebrow,
  title,
  meta,
  thumbnailUri,
  thumbnailSeed,
  thumbnailSize = 64,
  thumbnailWidth,
  onPress,
  accessory,
  accessoryIcon = 'chevron-right',
  footer,
  testID,
}: {
  eyebrow?: string;
  title: string;
  meta?: string;
  thumbnailUri?: string | null;
  /** Provide to render an artwork slot; omit for text-only rows. */
  thumbnailSeed?: string;
  thumbnailSize?: number;
  /** Widens the artwork slot — illustrated covers need room to read. */
  thumbnailWidth?: number;
  onPress?: () => void;
  accessory?: ReactNode;
  accessoryIcon?: IconName | null;
  footer?: ReactNode;
  testID?: string;
}) {
  const body = (
    <View style={styles.row}>
      {thumbnailSeed ? (
        <ContentImage
          uri={thumbnailUri}
          seed={thumbnailSeed}
          width={thumbnailWidth ?? thumbnailSize}
          height={thumbnailSize}
        />
      ) : null}

      <View style={styles.text}>
        {eyebrow ? <Eyebrow color="accent">{eyebrow}</Eyebrow> : null}
        <Text variant="bodyStrong" numberOfLines={2} style={styles.title}>
          {title}
        </Text>
        {meta ? (
          <Text variant="meta" color="textSecondary" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {footer}
      </View>

      {accessory ?? (accessoryIcon ? <Icon name={accessoryIcon} size="sm" color="textTertiary" /> : null)}
    </View>
  );

  if (!onPress) {
    return <View style={styles.static}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={[eyebrow, title, meta].filter(Boolean).join('. ')}
      testID={testID}
      style={styles.pressable}
    >
      {body}
    </Pressable>
  );
}

/** Settings / profile list item: label, optional value, chevron or switch. */
export function SettingsRow({
  label,
  value,
  icon,
  onPress,
  toggle,
  destructive = false,
  hint,
}: {
  label: string;
  value?: string;
  icon?: IconName;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (next: boolean) => void; disabled?: boolean };
  destructive?: boolean;
  hint?: string;
}) {
  const colors = useColors();

  const content = (
    <View style={styles.settingsRow}>
      {icon ? <Icon name={icon} size="md" color={destructive ? 'danger' : 'textSecondary'} /> : null}
      <View style={styles.settingsText}>
        <Text variant="label" color={destructive ? 'danger' : 'text'}>
          {label}
        </Text>
        {hint ? (
          <Text variant="caption" color="textTertiary">
            {hint}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="meta" color="textSecondary" numberOfLines={1} style={styles.settingsValue}>
          {value}
        </Text>
      ) : null}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          disabled={toggle.disabled}
          accessibilityLabel={label}
          trackColor={{ false: colors.surfacePressed, true: colors.primary }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.surfacePressed}
        />
      ) : onPress ? (
        <Icon name="chevron-right" size="sm" color="textTertiary" />
      ) : null}
    </View>
  );

  if (toggle || !onPress) {
    return <View>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} accessibilityLabel={label}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    paddingHorizontal: space.gutter,
  },
  static: {
    paddingHorizontal: space.gutter,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.lg,
  },
  text: {
    flex: 1,
    gap: 3,
  },
  title: {
    lineHeight: 21,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.md,
    minHeight: 52,
  },
  settingsText: {
    flex: 1,
  },
  settingsValue: {
    maxWidth: 140,
    textAlign: 'right',
  },
});
