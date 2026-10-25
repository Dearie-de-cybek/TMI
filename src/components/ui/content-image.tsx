import { Image } from 'expo-image';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';

import { useTheme } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';

import { Text } from './text';

/**
 * Artwork slot.
 *
 * When the church has supplied an image it is shown. When it has not, the slot
 * falls back to a composed typographic plate — a tonal field, a hairline frame
 * and the title's first letter in the editorial serif — rather than a stock
 * photograph or a decorative gradient. The tone is derived from the seed so the
 * same sermon always gets the same plate.
 */
const tones = ['primary', 'accent', 'ink'] as const;

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

function toneFor(seed: string): (typeof tones)[number] {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }
  return tones[hash % tones.length]!;
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
  uri?: string | null;
  /** Stable string (usually the title) used for the fallback letter and tone. */
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

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width, height, borderRadius, backgroundColor: colors.surfaceMuted }, style]}
        contentFit="cover"
        transition={reduceMotion ? 0 : 180}
        accessible={Boolean(label)}
        accessibilityLabel={label}
        accessibilityRole="image"
      />
    );
  }

  const tone = toneFor(seed);
  const background =
    tone === 'primary'
      ? colors.primarySoft
      : tone === 'accent'
        ? colors.accentSoft
        : colors.surfaceMuted;
  const letterColor =
    tone === 'primary' ? 'primaryOnSoft' : tone === 'accent' ? 'accentOnSoft' : 'textTertiary';

  return (
    <View
      accessible={Boolean(label)}
      accessibilityLabel={label ? `${label}. No artwork supplied.` : undefined}
      style={[
        styles.fallback,
        { width, height, borderRadius, backgroundColor: background, borderColor: colors.border },
        style,
      ]}
    >
      <Text color={letterColor} style={styles.letter}>
        {seed.trim().slice(0, 1).toUpperCase() || '·'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    padding: space.xs,
  },
  letter: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    lineHeight: 34,
    opacity: 0.8,
  },
});
