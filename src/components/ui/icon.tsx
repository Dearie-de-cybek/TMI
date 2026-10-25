import Feather from '@expo/vector-icons/Feather';

import { useColors } from '@/design/theme';
import { type ColorToken } from '@/design/tokens';

/**
 * Feather is the only icon set in the app — its 1.5px stroke matches the
 * hairline rules used throughout the layout. Emoji are never used as icons.
 */
export type IconName = keyof typeof Feather.glyphMap;

const sizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export type IconSize = keyof typeof sizes;

export type IconProps = {
  name: IconName;
  size?: IconSize;
  color?: ColorToken;
};

export function Icon({ name, size = 'md', color = 'text' }: IconProps) {
  const colors = useColors();
  return <Feather name={name} size={sizes[size]} color={colors[color]} />;
}

export const iconSizes = sizes;
