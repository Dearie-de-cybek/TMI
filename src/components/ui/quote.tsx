import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';

import { Text } from './text';

/**
 * A quotation block.
 *
 * A big gold opening quotation mark sits at the top-left over a soft purple
 * card, and the words set below it in the reading serif. It replaces the thin
 * vertical rule that used to mark a quote: a rule says "indented", a quotation
 * mark says "someone said this". Plain strings are set in the italic serif;
 * anything else (for example a smaller line of text) is shown as given.
 */
export function QuoteBlock({
  children,
  label,
  attribution,
  compact = false,
}: {
  children: ReactNode;
  /** Small line beside the quotation mark ("Sit with this", "Update · 2d ago"). */
  label?: string;
  /** Who said it, under the words. */
  attribution?: string;
  /** A smaller mark and tighter padding, for quotes inside a list. */
  compact?: boolean;
}) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: colors.primarySoft },
      ]}
    >
      <View style={styles.top}>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            styles.mark,
            compact && styles.markCompact,
            { color: colors.accentFill },
          ]}
        >
          {'“'}
        </Text>
        {label ? (
          <Text variant="metaStrong" color="primaryOnSoft" style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
      </View>

      {typeof children === 'string' ? (
        <Text style={[styles.words, compact && styles.wordsCompact, { color: colors.text }]}>
          {children}
        </Text>
      ) : (
        children
      )}

      {attribution ? (
        <Text variant="metaStrong" color="primaryOnSoft" style={styles.attribution}>
          {attribution}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xl,
    gap: space.xs,
  },
  cardCompact: {
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: space.lg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 56,
  },
  mark: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 96,
    lineHeight: 108,
    height: 70,
  },
  markCompact: {
    fontSize: 60,
    lineHeight: 70,
    height: 44,
  },
  label: {
    flexShrink: 1,
    paddingBottom: space.sm,
  },
  words: {
    fontFamily: fonts.serifItalic,
    fontSize: 20,
    lineHeight: 31,
  },
  wordsCompact: {
    fontSize: 16,
    lineHeight: 25,
  },
  attribution: {
    paddingTop: space.sm,
  },
});
