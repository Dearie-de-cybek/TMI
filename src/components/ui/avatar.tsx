import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { resolveArtwork } from '@/lib/artwork';

import { useColors } from '@/design/theme';
import { fonts } from '@/design/tokens';

import { Text } from './text';

const sizes = { sm: 32, md: 40, lg: 56, xl: 88 } as const;

function initialsOf(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)).toUpperCase();
}

/**
 * Avatars are the only circular element in the app. Without a photo they fall
 * back to serif initials on a forest tint rather than a generic person glyph.
 */
export function Avatar({
  name,
  uri,
  size = 'md',
}: {
  name: string;
  uri?: string | null;
  size?: keyof typeof sizes;
}) {
  const colors = useColors();
  const dimension = sizes[size];

  // `uri` may be a URL or `asset:<key>` for a bundled church photograph.
  const portrait = resolveArtwork(uri);

  if (portrait) {
    return (
      <Image
        source={'local' in portrait ? portrait.local : { uri: portrait.uri }}
        accessibilityLabel={`${name}'s profile picture`}
        style={[styles.base, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
        contentFit="cover"
        transition={160}
      />
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={name}
      style={[
        styles.base,
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: colors.primarySoft,
        },
      ]}
    >
      <Text
        color="primaryOnSoft"
        style={{ fontFamily: fonts.sansBold, fontSize: dimension * 0.38 }}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
}

export { initialsOf };

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
