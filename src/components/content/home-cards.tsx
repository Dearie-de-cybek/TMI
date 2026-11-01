import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState, type ReactNode } from 'react';
import {
  FlatList,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { LikeButton } from '@/components/ui/like-button';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { resolveArtwork } from '@/lib/artwork';

/**
 * Cards for the top of Home.
 *
 * A swipeable row of big photographic cards (the verse, the teaching, the
 * month's decree), and a stack of category cards below it, each with two tilted
 * photographs peeking in from the corner. The colour on this page comes from the
 * church's own pictures; the cards themselves stay neutral.
 */

export type HeroItem = {
  key: string;
  render: (size: { width: number; height: number }) => ReactNode;
};

const HERO_HEIGHT = 470;
const GAP = space.md;

export function HeroCarousel({ items }: { items: HeroItem[] }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - space.gutter * 2 - space.lg, 440);
  const listRef = useRef<FlatList<HeroItem>>(null);
  const [index, setIndex] = useState(0);

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / (cardWidth + GAP)));
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={styles.carousel}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        renderItem={({ item }) => item.render({ width: cardWidth, height: HERO_HEIGHT })}
      />
      {items.length > 1 ? (
        <View style={styles.pager} accessibilityLabel={`Card ${index + 1} of ${items.length}`}>
          {items.map((item, itemIndex) => (
            <View
              key={item.key}
              style={[
                styles.pagerBar,
                {
                  width: itemIndex === index ? 28 : 8,
                  backgroundColor: itemIndex === index ? colors.ink : colors.borderStrong,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** A photographic card with type set large over a bottom scrim. */
export function HeroCard({
  width,
  height,
  artwork,
  position = 'top center',
  kicker,
  title,
  subtitle,
  action,
  onPress,
  label,
  children,
}: {
  width: number;
  height: number;
  artwork: string | null | undefined;
  position?: 'center' | 'top center';
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: string;
  onPress: () => void;
  label: string;
  children?: ReactNode;
}) {
  const colors = useColors();
  const resolved = resolveArtwork(artwork);

  return (
    <Pressable
      onPress={onPress}
      feedback="opacity"
      haptic
      accessibilityLabel={label}
      style={[styles.hero, { width, height, backgroundColor: colors.surfaceInverse }]}
    >
      {resolved ? (
        <Image
          source={'local' in resolved ? resolved.local : { uri: resolved.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={position}
          transition={240}
        />
      ) : null}
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(8,3,5,0.6)', 'rgba(8,3,5,0.9)']}
        locations={[0, 0.3, 0.62, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.heroText}>
        {kicker ? (
          <Text variant="metaStrong" style={styles.heroKicker}>
            {kicker}
          </Text>
        ) : null}
        <Text style={styles.heroTitle} numberOfLines={3}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" style={styles.heroSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {action ? (
          <View style={styles.heroAction}>
            <Text variant="labelStrong" style={styles.heroActionLabel}>
              {action}
            </Text>
            <Icon name="arrow-right" size="sm" color="textOnInverse" />
          </View>
        ) : null}
        {children}
      </View>
    </Pressable>
  );
}

/** The verse of the day, set large over a photograph, with like and share. */
export function VerseHero({
  width,
  height,
  id,
  artwork,
  verse,
  reference,
  onPress,
  onRead,
  read,
}: {
  width: number;
  height: number;
  id: string;
  artwork: string | null | undefined;
  verse: string;
  reference: string;
  onPress: () => void;
  onRead: () => void;
  read: boolean;
}) {
  const colors = useColors();
  const resolved = resolveArtwork(artwork);

  function share() {
    void Share.share({ message: `“${verse}”\n${reference}\n\nTwainMan Ministry International` }).catch(
      () => undefined
    );
  }

  return (
    <View style={[styles.hero, { width, height, backgroundColor: colors.surfaceInverse }]}>
      {resolved ? (
        <Image
          source={'local' in resolved ? resolved.local : { uri: resolved.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top center"
          transition={240}
        />
      ) : null}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(8,3,5,0.35)', 'rgba(8,3,5,0.88)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Pressable
        onPress={onPress}
        feedback="opacity"
        accessibilityLabel={`Verse of the day: ${reference}. Open today's devotional.`}
        style={styles.verseBody}
      >
        <View>
          <Text variant="body" style={styles.verseKicker}>
            Verse of the day
          </Text>
          <Text variant="headline" style={styles.verseReference}>
            {reference}
          </Text>
        </View>
        <Text style={styles.verseText}>{verse}</Text>
      </Pressable>

      <View style={styles.verseActions}>
        <LikeButton id={id} onDark />
        <Pressable
          onPress={share}
          feedback="opacity"
          accessibilityLabel="Share this verse"
          style={styles.verseAction}
        >
          <Ionicons name="share-social-outline" size={28} color="#FFFFFF" />
          <Text variant="metaStrong" color="textOnInverse">
            Share
          </Text>
        </Pressable>
        <Pressable
          onPress={onRead}
          feedback="opacity"
          accessibilityLabel="Read today's devotional"
          style={styles.verseAction}
        >
          <Ionicons name={read ? 'book' : 'book-outline'} size={28} color="#FFFFFF" />
          <Text variant="metaStrong" color="textOnInverse">
            {read ? 'Read' : 'Devotional'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const tileColors = ['#B3392F', '#4A2C5C', '#0B7A75', '#2D5B8C', '#9A762F', '#6B3FA0', '#C26A1B', '#3B4CB8'];

const topicIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  prayer: 'heart',
  mercy: 'water',
  faithfulness: 'shield',
  forgiveness: 'leaf',
  leadership: 'compass',
  generosity: 'gift',
  stewardship: 'key',
  community: 'people',
  discipleship: 'book',
  church: 'home',
  lament: 'rainy',
  'pastoral care': 'medkit',
};

/**
 * Coloured topic tiles, two rows that scroll sideways: a solid colour, the topic
 * in bold capitals, and an icon. Tapping one opens the teaching on that topic.
 */
export function TopicTiles({
  topics,
  onPress,
}: {
  topics: string[];
  onPress: (topic: string) => void;
}) {
  const columns: string[][] = [];
  for (let i = 0; i < topics.length; i += 2) columns.push(topics.slice(i, i + 2));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.topicRow}
    >
      {columns.map((column, columnIndex) => (
        <View key={columnIndex} style={styles.topicColumn}>
          {column.map((topic, rowIndex) => {
            const index = columnIndex * 2 + rowIndex;
            return (
              <Pressable
                key={topic}
                onPress={() => onPress(topic)}
                feedback="opacity"
                accessibilityLabel={`Teaching on ${topic}`}
                style={[styles.topic, { backgroundColor: tileColors[index % tileColors.length] }]}
              >
                <Text style={styles.topicLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {topic.toUpperCase()}
                </Text>
                <View style={styles.topicIcon}>
                  <Ionicons
                    name={topicIcons[topic.toLowerCase()] ?? 'sparkles'}
                    size={34}
                    color="rgba(255,255,255,0.35)"
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * A stacked category card: bold title, one grey line, and two tilted photographs
 * clipped by the card's lower-right corner.
 */
export function CategoryCard({
  title,
  description,
  images,
  onPress,
}: {
  title: string;
  description: string;
  images: [number, number];
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      feedback="opacity"
      accessibilityLabel={`${title}. ${description}`}
      style={[styles.category, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.categoryText}>
        <Text variant="headline">{title}</Text>
        <Text variant="meta" color="textSecondary">
          {description}
        </Text>
      </View>
      <View style={styles.categoryArt} pointerEvents="none">
        <Image source={images[1]} style={[styles.thumb, styles.thumbBack]} contentFit="cover" />
        <Image source={images[0]} style={[styles.thumb, styles.thumbFront]} contentFit="cover" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carousel: {
    paddingHorizontal: space.gutter,
  },
  topicRow: {
    gap: space.md,
    paddingHorizontal: space.gutter,
  },
  topicColumn: {
    gap: space.md,
  },
  topic: {
    width: 188,
    height: 84,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topicLabel: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
    fontSize: 16,
    letterSpacing: 0.3,
    maxWidth: 140,
  },
  topicIcon: {
    position: 'absolute',
    right: space.md,
    bottom: space.sm,
  },
  pager: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xs,
    paddingTop: space.lg,
  },
  pagerBar: {
    height: 8,
    borderRadius: radius.pill,
  },
  hero: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroText: {
    padding: space.xl,
    gap: space.sm,
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.82)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.sansExtraBold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.86)',
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.sm,
  },
  heroActionLabel: {
    color: '#FFFFFF',
  },
  verseBody: {
    flex: 1,
    justifyContent: 'space-between',
    padding: space.xl,
  },
  verseKicker: {
    color: 'rgba(255,255,255,0.86)',
  },
  verseReference: {
    color: '#FFFFFF',
  },
  verseText: {
    color: '#FFFFFF',
    fontFamily: fonts.serifMedium,
    fontSize: 27,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  verseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: space.md,
    paddingBottom: space.xl,
  },
  verseAction: {
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
  },
  category: {
    flexDirection: 'row',
    height: 112,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryText: {
    flex: 1,
    justifyContent: 'center',
    gap: space.xs,
    paddingLeft: space.xl,
    paddingRight: space.sm,
  },
  categoryArt: {
    width: 150,
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: radius.md,
  },
  thumbFront: {
    right: 18,
    top: 38,
    transform: [{ rotate: '-8deg' }],
  },
  thumbBack: {
    right: -26,
    top: 22,
    transform: [{ rotate: '9deg' }],
    opacity: 0.9,
  },
});
