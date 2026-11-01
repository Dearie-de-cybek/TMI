import { ScrollView, StyleSheet, View } from 'react-native';

import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';

import { Icon } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

export type ChipOption<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
};

/**
 * Filter chips are rectangular with a 4pt corner, selected by a forest fill -
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
          backgroundColor: selected ? colors.ink : colors.surfaceMuted,
        },
      ]}
    >
      <Text variant="metaStrong" color={selected ? 'onInk' : 'text'}>
        {label}
      </Text>
      {count != null ? (
        <Text variant="caption" color={selected ? 'onInk' : 'textTertiary'}>
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
      // Without this the row expands to fill the remaining column height.
      style={styles.rowScroller}
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
 * (for example Transcript / Study notes): a grey track with a white pill on the
 * chosen one.
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
      style={[styles.segmented, { backgroundColor: colors.surfaceMuted }]}
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
            feedback="none"
            style={[
              styles.segment,
              selected ? { backgroundColor: colors.surface } : null,
              selected ? styles.segmentSelected : null,
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
    paddingHorizontal: space.lg,
    height: 40,
    minHeight: 40,
    borderRadius: radius.pill,
  },
  row: {
    gap: space.sm,
    paddingHorizontal: space.gutter,
    paddingVertical: space.xs,
    alignItems: 'center',
  },
  rowScroller: {
    flexGrow: 0,
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: radius.pill,
  },
  segmentSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
