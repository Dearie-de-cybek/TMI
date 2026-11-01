import { Image } from 'expo-image';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';

import { useTheme } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { resolveArtwork } from '@/lib/artwork';

import { Text } from './text';

/**
 * Artwork slot.
 *
 * The church's photographs carry this app, so almost every slot has one: a URL
 * from the API, or `asset:<key>` for one of the bundled photographs.
 *
 * When there is genuinely nothing, the slot becomes a quiet tonal plate - the
 * title's initial in the editorial serif above a gold rule. No invented shapes,
 * no decoration standing in for content.
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

export function ContentImage({
  uri,
  seed,
  label,
  width,
  height,
  rounded = true,
  contentPosition = 'center',
  style,
}: {
  /** A URL, or `asset:<key>` for a bundled church photograph. */
  uri?: string | null;
  /** Stable string (usually the title) used by the fallback plate. */
  seed: string;
  /** Accessible description. Falls back to decorative when omitted. */
  label?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  rounded?: boolean;
  /** Where to anchor the crop - faces usually want `top center`. */
  contentPosition?: 'center' | 'top center' | 'bottom center';
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
        contentPosition={contentPosition}
        transition={reduceMotion ? 0 : 180}
        accessible={Boolean(label)}
        accessibilityLabel={label}
        accessibilityRole="image"
      />
    );
  }

  return (
    <View
      accessible={Boolean(label)}
      accessibilityLabel={label ? `${label}. No photograph yet.` : undefined}
      style={[
        styles.plate,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text color="textSecondary" style={styles.initial}>
        {seed.trim().slice(0, 1).toUpperCase() || '·'}
      </Text>
      <View style={[styles.rule, { backgroundColor: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    padding: space.sm,
    gap: space.sm,
  },
  initial: {
    fontFamily: fonts.sansBold,
    fontSize: 26,
    lineHeight: 30,
  },
  rule: {
    width: 20,
    height: 2,
    opacity: 0.8,
  },
});
