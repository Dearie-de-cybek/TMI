import { ScrollView, StyleSheet, View } from 'react-native';

import { useColors } from '@/design/theme';
import { hairline, radius, space } from '@/design/tokens';

import { Icon } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

export type ChipOption<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
};

/**
 * Filter chips are rectangular with a 4pt corner, selected by a forest fill —
 * deliberately not pills, and never used for navigation.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  count,
  accessibilityHint,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  count?: number;
  accessibilityHint?: string;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count == null ? label : `${label}, ${count}`}
      accessibilityHint={accessibilityHint}
      feedback="opacity"
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : 'transparent',
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text variant="metaStrong" color={selected ? 'textOnAccent' : 'textSecondary'}>
        {label}
      </Text>
      {count != null ? (
        <Text variant="caption" color={selected ? 'textOnAccent' : 'textTertiary'}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  allowClear = false,
  label,
}: {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  allowClear?: boolean;
  label: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel={label}
    >
      {allowClear ? (
        <Chip label="All" selected={value === null} onPress={() => onChange(null)} />
      ) : null}
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          count={option.count}
          selected={value === option.value}
          onPress={() => onChange(value === option.value ? null : option.value)}
        />
      ))}
    </ScrollView>
  );
}

/**
 * Segmented control for switching between views of the same content
 * (for example Transcript / Study notes). Underline rather than a filled pill.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const colors = useColors();

  return (
    <View
      style={[styles.segmented, { borderBottomColor: colors.border }]}
      accessibilityRole="tablist"
      accessibilityLabel={label}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            feedback="opacity"
            style={[
              styles.segment,
              { borderBottomColor: selected ? colors.primary : 'transparent' },
            ]}
          >
            <Text variant="metaStrong" color={selected ? 'text' : 'textSecondary'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small status tag: course state, event format, payment state. */
export function Tag({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  icon?: Parameters<typeof Icon>[0]['name'];
}) {
  const colors = useColors();

  const tones = {
    neutral: { background: colors.surfaceMuted, text: 'textSecondary' },
    primary: { background: colors.primarySoft, text: 'primaryOnSoft' },
    accent: { background: colors.accentSoft, text: 'accentOnSoft' },
    success: { background: colors.successSoft, text: 'successOnSoft' },
    warning: { background: colors.warningSoft, text: 'warningOnSoft' },
    danger: { background: colors.dangerSoft, text: 'dangerOnSoft' },
  } as const;

  const resolved = tones[tone];

  return (
    <View style={[styles.tag, { backgroundColor: resolved.background }]}>
      {icon ? <Icon name={icon} size="xs" color={resolved.text} /> : null}
      <Text variant="caption" color={resolved.text} uppercase style={styles.tagLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    height: 36,
    minHeight: 36,
    borderRadius: radius.sm,
    borderWidth: hairline,
  },
  row: {
    gap: space.sm,
    paddingHorizontal: space.gutter,
    paddingVertical: space.xs,
  },
  segmented: {
    flexDirection: 'row',
    borderBottomWidth: hairline,
  },
  segment: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 2,
    minHeight: 48,
    justifyContent: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  tagLabel: {
    letterSpacing: 0.6,
  },
});
