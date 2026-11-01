import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { type Badge } from '@/features/devotion/badges';

/**
 * Medals.
 *
 * Round, coloured and a little bit shiny: a thick rim, a pale face, a glyph in
 * the rim's colour and the member's count on a white tag at the bottom. An
 * unearned medal keeps its shape but turns grey with a lock, so the shelf always
 * shows what there is to reach.
 */
export function Medal({ badge, size = 96 }: { badge: Badge; size?: number }) {
  const colors = useColors();
  // An unearned medal keeps its own colours, washed out, so the shelf stays colourful.
  const rim = badge.reached ? badge.rim : `${badge.rim}59`;
  const face = badge.reached ? badge.face : `${badge.face}99`;
  const rimWidth = Math.round(size * 0.07);

  return (
    <View style={{ width: size, height: size + 8, alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: rimWidth,
          borderColor: rim,
          backgroundColor: face,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.74,
            height: size * 0.74,
            borderRadius: (size * 0.74) / 2,
            borderWidth: 2,
            borderColor: badge.reached ? `${badge.rim}55` : `${badge.rim}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={badge.icon}
            size={size * 0.38}
            color={badge.reached ? badge.rim : `${badge.rim}80`}
          />
        </View>
      </View>
      <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.tagLabel}>{Math.min(badge.count, 999)}</Text>
      </View>
    </View>
  );
}

/**
 * A shelf of medals with the count earned and a "View all" button, as on the
 * activity page of a Bible app. Tapping "Learn more" explains the badge.
 */
export function BadgeShelf({
  badges,
  onViewAll,
}: {
  badges: Badge[];
  onViewAll: () => void;
}) {
  const colors = useColors();
  const { notice } = useDialog();

  function explain(badge: Badge) {
    const progress = badge.reached
      ? 'You have earned this badge.'
      : `You are at ${badge.count} of ${badge.target}.`;
    void notice({
      eyebrow: badge.reached ? 'Earned' : 'Still to reach',
      title: badge.title,
      icon: 'award',
      message: `${badge.description} ${progress}`,
      confirmLabel: 'Close',
    });
  }

  const earned = badges.filter((badge) => badge.reached).length;
  // Earned first, so the shelf opens on what the member has.
  const ordered = [...badges].sort((a, b) => Number(b.reached) - Number(a.reached));

  return (
    <View style={[styles.shelf, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.shelfHead}>
        <Text variant="title">Badges</Text>
        <Text variant="metaStrong" color="textSecondary">
          {earned} of {badges.length}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelfRow}
      >
        {ordered.map((badge) => (
          <Pressable
            key={badge.id}
            onPress={() => explain(badge)}
            feedback="opacity"
            accessibilityLabel={`${badge.title}. ${badge.reached ? 'Earned' : badge.description}`}
            style={styles.item}
          >
            <Medal badge={badge} />
            <Text variant="labelStrong" style={styles.itemTitle} numberOfLines={2}>
              {badge.title}
            </Text>
            <Text variant="meta" color="textSecondary">
              Learn more
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.viewAll}>
        <Button label="View all" variant="secondary" size="sm" onPress={onViewAll} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    position: 'absolute',
    bottom: 0,
    minWidth: 34,
    height: 26,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
  },
  shelf: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: space.xl,
    gap: space.lg,
  },
  shelfHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
  },
  shelfRow: {
    gap: space.xl,
    paddingHorizontal: space.xl,
  },
  item: {
    width: 112,
    alignItems: 'center',
    gap: space.xs,
  },
  itemTitle: {
    textAlign: 'center',
    paddingTop: space.sm,
  },
  viewAll: {
    paddingHorizontal: space.xl,
    alignItems: 'flex-start',
  },
});
