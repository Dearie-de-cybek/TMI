import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { resolveArtwork } from '@/lib/artwork';

const sizes = { sm: 32, md: 40, lg: 56, xl: 88 } as const;

export type AvatarSize = keyof typeof sizes;

/**
 * The avatars everyone gets until they choose a photo: a rounded gradient with a
 * single glyph. Twelve of them, each with its own colour, so a list of members is
 * never a column of identical grey circles.
 */
export const defaultAvatars: {
  key: string;
  colors: [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}[] = [
  { key: 'flame', colors: ['#F59E0B', '#DC2626'], icon: 'flame', label: 'Flame' },
  { key: 'leaf', colors: ['#34D399', '#047857'], icon: 'leaf', label: 'Leaf' },
  { key: 'sun', colors: ['#FDE047', '#F97316'], icon: 'sunny', label: 'Sun' },
  { key: 'water', colors: ['#38BDF8', '#1D4ED8'], icon: 'water', label: 'Water' },
  { key: 'star', colors: ['#C084FC', '#6D28D9'], icon: 'star', label: 'Star' },
  { key: 'heart', colors: ['#FB7185', '#BE123C'], icon: 'heart', label: 'Heart' },
  { key: 'dove', colors: ['#5EEAD4', '#0F766E'], icon: 'paper-plane', label: 'Dove' },
  { key: 'crown', colors: ['#FBBF24', '#92400E'], icon: 'ribbon', label: 'Crown' },
  { key: 'book', colors: ['#818CF8', '#3730A3'], icon: 'book', label: 'Book' },
  { key: 'rose', colors: ['#F472B6', '#9D174D'], icon: 'rose', label: 'Rose' },
  { key: 'shield', colors: ['#94A3B8', '#334155'], icon: 'shield', label: 'Shield' },
  { key: 'music', colors: ['#A3E635', '#4D7C0F'], icon: 'musical-notes', label: 'Song' },
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

/** A stable avatar for a person, so they keep the same one every time. */
export function avatarKeyFor(seed: string): string {
  return defaultAvatars[hash(seed) % defaultAvatars.length]!.key;
}

export function DefaultAvatar({
  avatarKey,
  size = 'md',
  dimension: explicit,
}: {
  avatarKey: string;
  size?: AvatarSize;
  /** Exact pixel size, for the picker grid. */
  dimension?: number;
}) {
  const dimension = explicit ?? sizes[size];
  const avatar = defaultAvatars.find((item) => item.key === avatarKey) ?? defaultAvatars[0]!;

  return (
    <LinearGradient
      colors={avatar.colors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.base,
        styles.fallback,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    >
      <Ionicons name={avatar.icon} size={dimension * 0.5} color="#FFFFFF" />
    </LinearGradient>
  );
}

/**
 * Avatars are the only circular element in the app. A photograph if there is
 * one, otherwise one of the default avatars — chosen by `choice` when the person
 * has picked one, or by their name so it stays the same every time.
 */
export function Avatar({
  name,
  uri,
  size = 'md',
  choice,
}: {
  name: string;
  uri?: string | null;
  size?: AvatarSize;
  /** A default avatar the person picked; wins over a photograph. */
  choice?: string | null;
}) {
  const dimension = sizes[size];

  if (choice) {
    return (
      <View accessible accessibilityLabel={`${name}'s avatar`}>
        <DefaultAvatar avatarKey={choice} size={size} />
      </View>
    );
  }

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
    <View accessible accessibilityLabel={`${name}'s avatar`}>
      <DefaultAvatar avatarKey={avatarKeyFor(name)} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
