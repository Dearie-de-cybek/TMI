import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useColors } from '@/design/theme';
import { typeScale, type ColorToken, type TypeToken } from '@/design/tokens';

export type TextProps = RNTextProps & {
  variant?: TypeToken;
  color?: ColorToken;
  /** Applies the tracked uppercase treatment used by eyebrow labels. */
  uppercase?: boolean;
  align?: TextStyle['textAlign'];
};

/**
 * The single text primitive. Every string in the app renders through it so the
 * type ramp, colour roles and font-scaling behaviour stay consistent.
 *
 * Font scaling is always on. Compact chrome (tab labels, badges, eyebrows) caps
 * the multiplier so those layouts survive the largest accessibility sizes.
 */
export function Text({
  variant = 'body',
  color = 'text',
  uppercase = false,
  align,
  style,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const colors = useColors();
  const compact = variant === 'tab' || variant === 'caption' || variant === 'eyebrow';

  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (compact ? 1.4 : undefined)}
      style={[
        typeScale[variant],
        { color: colors[color] },
        uppercase ? { textTransform: 'uppercase' } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}

/** Tracked uppercase label that sits above section titles and metadata groups. */
export function Eyebrow({ color = 'accent', ...rest }: Omit<TextProps, 'variant' | 'uppercase'>) {
  return <Text variant="eyebrow" color={color} uppercase {...rest} />;
}
