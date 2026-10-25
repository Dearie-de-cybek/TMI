import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { type Devotional, type LiveSession, type Sermon } from '@/api/schemas';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { resolveArtwork } from '@/lib/artwork';
import { formatDate, formatDateTimeWithZone, formatMinutes, isWithinNextHours } from '@/lib/datetime';
import { joinMeta } from '@/lib/format';

/**
 * The featured teaching.
 *
 * With artwork it is full-bleed with an ink scrim; without, it becomes a
 * typographic plate on the inverted forest surface. Both treatments put the
 * serif title first — this is the one place per screen that is allowed to be big.
 */
export function FeaturedSermon({
  sermon,
  eyebrow,
  onPress,
}: {
  sermon: Sermon;
  eyebrow?: string;
  onPress: () => void;
}) {
  const colors = useColors();
  // `artwork_url` may be a URL or `asset:<key>` for a bundled church photograph.
  const artwork = resolveArtwork(sermon.artwork_url);
  const hasArtwork = artwork !== null;
  const length = sermon.audio?.duration_seconds ?? sermon.video?.duration_seconds ?? null;
  const hasMedia = Boolean(sermon.audio ?? sermon.video);

  return (
    <Pressable
      onPress={onPress}
      feedback="opacity"
      accessibilityLabel={`Featured teaching: ${sermon.title} by ${sermon.speaker.name}`}
      style={[
        styles.featured,
        hasArtwork ? styles.featuredWithArtwork : styles.featuredTypographic,
        { backgroundColor: hasArtwork ? colors.surfaceMuted : colors.surfaceInverse },
      ]}
    >
      {hasArtwork ? (
        <>
          <Image
            source={'local' in artwork! ? artwork!.local : { uri: artwork!.uri }}
            style={styles.featuredImage}
            contentFit="cover"
            contentPosition="center"
            transition={200}
          />
          {/* Bottom-weighted, so the photograph keeps its light and the
              overlaid type still clears contrast. */}
          <LinearGradient
            colors={['transparent', colors.scrim, colors.scrimStrong]}
            locations={[0.25, 0.62, 1]}
            style={styles.scrim}
            pointerEvents="none"
          />
        </>
      ) : null}

      <View style={[styles.featuredContent, hasArtwork && styles.featuredContentOverImage]}>
        <Eyebrow color={hasArtwork ? 'textOnInverse' : 'accent'}>
          {eyebrow ?? sermon.series?.title ?? 'Latest teaching'}
        </Eyebrow>
        <Text
          color="textOnInverse"
          style={styles.featuredTitle}
          numberOfLines={3}
        >
          {sermon.title}
        </Text>
        <Text variant="meta" color={hasArtwork ? 'textOnInverse' : 'textOnInverseSecondary'}>
          {joinMeta([sermon.speaker.name, formatDate(sermon.preached_at), formatMinutes(length)])}
        </Text>

        <View style={styles.featuredAction}>
          <View style={[styles.playBadge, { borderColor: colors.textOnInverse }]}>
            <Icon name={hasMedia ? 'play' : 'file-text'} size="xs" color="textOnInverse" />
          </View>
          <Text variant="metaStrong" color="textOnInverse">
            {hasMedia ? 'Listen or watch' : 'Read the notes'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * The daily devotional: Scripture set in the editorial serif on a tonal plate,
 * with the reflection below it. No decoration — the passage is the design.
 */
export function ScripturePlate({
  devotional,
  onPress,
  bare = false,
}: {
  devotional: Devotional;
  onPress?: () => void;
  /** Drops the plate's own ground, for use inside a coloured section band. */
  bare?: boolean;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      feedback={onPress ? 'opacity' : 'none'}
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={`Today's devotional: ${devotional.title}`}
      style={[
        styles.plate,
        bare ? styles.plateBare : { backgroundColor: colors.primarySoft },
      ]}
    >
      <Eyebrow color="accentOnSoft">Today</Eyebrow>
      <Text variant="scripture" color={bare ? 'text' : 'primaryOnSoft'} style={styles.scripture}>
        “{devotional.scripture_text}”
      </Text>
      <Text variant="caption" color={bare ? 'accentOnSoft' : 'primaryOnSoft'}>
        {devotional.scripture_reference}
      </Text>
      <View style={[styles.plateRule, { backgroundColor: colors.accent }]} />
      <Text variant="bodyStrong" color={bare ? 'text' : 'primaryOnSoft'}>
        {devotional.title}
      </Text>
      <Text
        variant="body"
        color={bare ? 'textSecondary' : 'primaryOnSoft'}
        numberOfLines={4}
        style={styles.plateBody}
      >
        {devotional.body}
      </Text>
    </Pressable>
  );
}

/** Thin strip for a live or imminent session. Shown only when there is one. */
export function LiveSessionStrip({
  session,
  onPress,
}: {
  session: LiveSession;
  onPress: () => void;
}) {
  const colors = useColors();
  const soon = isWithinNextHours(session.starts_at, 2);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${session.title}, ${formatDateTimeWithZone(session.starts_at, session.timezone)}`}
      style={[styles.live, { backgroundColor: colors.surfaceInverse }]}
      feedback="opacity"
    >
      <View style={[styles.liveDot, { backgroundColor: soon ? colors.accent : colors.textOnInverseSecondary }]} />
      <View style={styles.liveBody}>
        <Text variant="metaStrong" color="textOnInverse" numberOfLines={1}>
          {session.title}
        </Text>
        <Text variant="caption" color="textOnInverseSecondary" numberOfLines={1}>
          {formatDateTimeWithZone(session.starts_at, session.timezone)}
        </Text>
      </View>
      <Icon name="arrow-right" size="sm" color="textOnInverse" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  featured: {
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  /** Tall enough for the scrim to read as an image block. */
  featuredWithArtwork: {
    minHeight: 280,
  },
  /** Without artwork the plate is sized by its type, not by a phantom image. */
  featuredTypographic: {
    paddingTop: space.xl,
  },
  featuredImage: {
    ...StyleSheet.absoluteFill,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
  },
  featuredContent: {
    padding: space.gutter,
    gap: space.xs,
  },
  featuredContentOverImage: {
    paddingTop: space.giant,
  },
  featuredTitle: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.6,
    marginVertical: space.xs,
  },
  featuredAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
  },
  playBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plate: {
    padding: space.xl,
    borderRadius: radius.sm,
    gap: space.xs,
  },
  plateBare: {
    paddingHorizontal: 0,
    paddingTop: space.sm,
  },
  scripture: {
    marginTop: space.sm,
  },
  plateRule: {
    height: 1,
    marginVertical: space.lg,
    width: 48,
  },
  plateBody: {
    marginTop: space.xxs,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveBody: {
    flex: 1,
  },
});
