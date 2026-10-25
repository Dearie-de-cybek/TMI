import { Image } from 'expo-image';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';

import { resolveArtwork } from '@/lib/artwork';
import { useTheme } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';

import { Text } from './text';

/**
 * Artwork slot.
 *
 * Three cases, in order of preference:
 *   1. a photograph the church supplied (a URL, or `asset:<key>` for one of the
 *      bundled TwainMan photographs);
 *   2. generated graphic art — a flat, deterministic composition in the church's
 *      purple and gold, in the spirit of an illustrated study series;
 *   3. nothing, if the caller asks for a plain tonal block.
 *
 * What it never does is reach for stock photography to fill a gap.
 */

/**
 * Layout-only subset shared by `ViewStyle` and expo-image's `ImageStyle`, so the
 * same `style` prop works for both branches without a cast.
 */
type ArtworkStyle = Pick<
  ViewStyle,
  | 'width'
  | 'height'
  | 'aspectRatio'
  | 'borderRadius'
  | 'marginTop'
  | 'marginBottom'
  | 'marginHorizontal'
  | 'alignSelf'
  | 'flex'
>;

/** Stable 0–1 value from a seed, so the same course always gets the same plate. */
function hash(seed: string, salt = 0): number {
  let value = 2166136261 + salt * 16777619;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return ((value >>> 0) % 10000) / 10000;
}

export function ContentImage({
  uri,
  seed,
  label,
  width,
  height,
  rounded = true,
  style,
}: {
  /** A URL, or `asset:<key>` for a bundled church photograph. */
  uri?: string | null;
  /** Stable string (usually the title) the generated artwork is derived from. */
  seed: string;
  /** Accessible description. Falls back to decorative when omitted. */
  label?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  rounded?: boolean;
  style?: ArtworkStyle;
}) {
  const { colors, reduceMotion } = useTheme();
  const borderRadius = rounded ? radius.md : radius.none;
  const artwork = resolveArtwork(uri);

  if (artwork) {
    return (
      <Image
        source={'local' in artwork ? artwork.local : { uri: artwork.uri }}
        style={[{ width, height, borderRadius, backgroundColor: colors.surfaceMuted }, style]}
        contentFit="cover"
        transition={reduceMotion ? 0 : 180}
        accessible={Boolean(label)}
        accessibilityLabel={label}
        accessibilityRole="image"
      />
    );
  }

  return (
    <GraphicPlate
      seed={seed}
      label={label}
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
}

/**
 * Generated artwork: a tonal ground, two soft overlapping discs, a gold rule and
 * the title's initial in the editorial serif. Flat shapes rather than gradients,
 * so it reads as drawn rather than rendered — and so a row of courses looks like
 * a set of covers instead of a row of empty frames.
 */
export function GraphicPlate({
  seed,
  label,
  width,
  height,
  borderRadius = radius.md,
  style,
}: {
  seed: string;
  label?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ArtworkStyle;
}) {
  const { colors } = useTheme();

  const tones = [
    { ground: colors.primarySoft, disc: colors.primary, mark: colors.primaryOnSoft },
    { ground: colors.accentSoft, disc: colors.accent, mark: colors.accentOnSoft },
    { ground: colors.surfaceInverse, disc: colors.accentFill, mark: colors.textOnInverse },
    { ground: colors.bandPrimary, disc: colors.primaryHover, mark: colors.primaryOnSoft },
  ] as const;

  const tone = tones[Math.floor(hash(seed) * tones.length)]!;
  const bigLeft = `${Math.round(hash(seed, 1) * 40 - 10)}%`;
  const bigTop = `${Math.round(hash(seed, 2) * 40 - 20)}%`;
  const smallRight = `${Math.round(hash(seed, 3) * 30 - 5)}%`;

  return (
    <View
      accessible={Boolean(label)}
      accessibilityLabel={label ? `${label}. Illustrated cover.` : undefined}
      style={[
        styles.plate,
        { width, height, borderRadius, backgroundColor: tone.ground },
        style,
      ]}
    >
      <View
        style={[
          styles.disc,
          styles.discLarge,
          { backgroundColor: tone.disc, left: bigLeft as DimensionValue, top: bigTop as DimensionValue },
        ]}
      />
      <View
        style={[
          styles.disc,
          styles.discSmall,
          { backgroundColor: tone.disc, right: smallRight as DimensionValue },
        ]}
      />
      <View style={[styles.rule, { backgroundColor: tone.mark }]} />
      <Text color="text" style={[styles.initial, { color: tone.mark }]}>
        {seed.trim().slice(0, 1).toUpperCase() || '·'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: space.md,
  },
  disc: {
    position: 'absolute',
    borderRadius: radius.pill,
  },
  discLarge: {
    width: '95%',
    aspectRatio: 1,
    opacity: 0.38,
  },
  discSmall: {
    width: '52%',
    aspectRatio: 1,
    bottom: '-18%',
    opacity: 0.28,
  },
  rule: {
    width: 28,
    height: 2,
    marginBottom: space.sm,
    opacity: 0.85,
  },
  initial: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 30,
    lineHeight: 34,
    opacity: 0.9,
  },
});
