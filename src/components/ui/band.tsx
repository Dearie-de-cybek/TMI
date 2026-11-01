import { type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/design/theme';
import { type ColorToken } from '@/design/tokens';
import { space } from '@/design/tokens';

/**
 * A full-bleed section ground.
 *
 * Home is a long page holding unrelated things - teaching, Scripture, courses,
 * what is on, notices, prayer. Rather than fencing each one in a card, the page
 * changes paper underneath them: a wash of purple, a wash of gold, plain ivory.
 * The tints sit a hair above 1.05:1 against the page, so you feel the change of
 * section without ever being asked to look at it.
 *
 * Neighbouring bands must not repeat a tone, or the division disappears.
 */
export type BandTone = 'page' | 'primary' | 'accent' | 'neutral' | 'inverse';

const grounds: Record<BandTone, ColorToken> = {
  page: 'background',
  primary: 'bandPrimary',
  accent: 'bandAccent',
  neutral: 'bandNeutral',
  inverse: 'surfaceInverse',
};

export function Band({
  tone = 'page',
  children,
  style,
  flush = false,
}: PropsWithChildren<{
  tone?: BandTone;
  style?: StyleProp<ViewStyle>;
  /** Removes the vertical padding, for bands that hold a full-bleed image. */
  flush?: boolean;
}>) {
  const colors = useColors();

  return (
    <View style={[!flush && styles.padded, { backgroundColor: colors[grounds[tone]] }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingBottom: space.xxl,
  },
});
