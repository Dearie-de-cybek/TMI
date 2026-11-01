import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { type Group } from '@/api/schemas';
import { ContentImage } from '@/components/ui/content-image';
import { Pressable } from '@/components/ui/pressable';
import { SectionHeader } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { groupTypeLabel } from '@/lib/format';
import { resolveArtwork } from '@/lib/artwork';

/**
 * Cards for Discover and Community.
 *
 * Covers are square and carry the colour; the cards around them are neutral. A
 * carousel runs off the right edge so it is obvious it can be swiped.
 */

type IoniconName = keyof typeof Ionicons.glyphMap;

/** A quick link: white card, one icon, one bold word. */
export function QuickTile({
  icon,
  title,
  onPress,
}: {
  icon: IoniconName;
  title: string;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      feedback="opacity"
      accessibilityLabel={title}
      style={[styles.quick, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Ionicons name={icon} size={26} color={colors.text} />
      <Text variant="labelStrong" numberOfLines={1} style={styles.quickLabel}>
        {title}
      </Text>
    </Pressable>
  );
}

/** A titled row of cards that bleeds off the right edge. */
export function Shelf({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
  children: ReactNode;
}) {
  return (
    <View>
      <View style={styles.shelfHead}>
        <SectionHeader title={title} action={action} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelf}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Square cover with a small grey line and a bold title underneath. */
export function CoverTile({
  artwork,
  seed,
  kicker,
  title,
  size = 160,
  onPress,
}: {
  artwork: string | null | undefined;
  seed: string;
  kicker?: string;
  title: string;
  size?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      feedback="opacity"
      accessibilityLabel={kicker ? `${title}, ${kicker}` : title}
      style={{ width: size }}
    >
      <ContentImage
        uri={artwork}
        seed={seed}
        width={size}
        height={size}
        style={{ borderRadius: radius.md }}
      />
      {kicker ? (
        <Text variant="meta" color="textSecondary" style={styles.coverKicker} numberOfLines={1}>
          {kicker}
        </Text>
      ) : null}
      <Text variant="bodyStrong" numberOfLines={2} style={styles.coverTitle}>
        {title}
      </Text>
    </Pressable>
  );
}

/**
 * A ministry or fellowship card. The card takes its tint from its own photograph
 * - the picture, blurred and washed back, fills the card - so the colour comes
 * from the church and the interface stays neutral.
 */
export function MinistryCard({
  group,
  width,
  onPress,
}: {
  group: Group;
  width: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const artwork = resolveArtwork(group.artwork_url);
  const member = group.membership.status === 'member';

  return (
    <Pressable
      onPress={onPress}
      feedback="opacity"
      accessibilityLabel={`${group.name}, ${groupTypeLabel(group.type)}${member ? ', you are a member' : ''}`}
      style={[styles.ministry, { width, backgroundColor: colors.surfaceMuted }]}
    >
      {artwork ? (
        <>
          <Image
            source={'local' in artwork ? artwork.local : { uri: artwork.uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={40}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface, opacity: 0.72 }]} />
        </>
      ) : null}

      <View style={styles.ministryTop}>
        <ContentImage
          uri={group.artwork_url}
          seed={group.name}
          width={width * 0.46}
          height={width * 0.46}
          style={{ borderRadius: radius.md }}
        />
        {member ? (
          <View style={[styles.memberBadge, { backgroundColor: colors.ink }]}>
            <Ionicons name="people" size={14} color={colors.onInk} />
          </View>
        ) : null}
      </View>

      <View style={styles.ministryText}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {group.name}
        </Text>
        <Text variant="meta" color="textSecondary" numberOfLines={1}>
          {groupTypeLabel(group.type)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  quick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 64,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  quickLabel: {
    flex: 1,
  },
  shelfHead: {
    paddingHorizontal: space.gutter,
  },
  shelf: {
    gap: space.md,
    paddingHorizontal: space.gutter,
  },
  coverKicker: {
    paddingTop: space.sm,
  },
  coverTitle: {
    paddingTop: 2,
  },
  ministry: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: space.md,
    gap: space.md,
    minHeight: 190,
  },
  ministryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  memberBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ministryText: {
    gap: 2,
  },
});
