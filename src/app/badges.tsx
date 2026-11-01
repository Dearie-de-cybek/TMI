import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Medal } from '@/components/content/badges';
import { NavBar } from '@/components/ui/header';
import { Rise } from '@/components/ui/motion';
import { ProgressBar } from '@/components/ui/progress';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { useBadges } from '@/features/devotion/badges';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';

/**
 * Every badge, earned or not, with what it is for and how far along the member
 * is. Nothing here is hidden until it is earned: the point of a badge is knowing
 * it is there.
 */
export default function BadgesScreen() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  useDevotionSync();
  const badges = useBadges();

  const earned = badges.filter((badge) => badge.reached).length;
  const cardWidth = (width - space.gutter * 2 - space.md) / 2;

  return (
    <Screen>
      <NavBar title="Badges" />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.intro}>
          <Text variant="display">
            {earned} of {badges.length}
          </Text>
          <Text variant="body" color="textSecondary">
            Badges are marks along the way, for praying the monthly decree, reading the daily
            word and keeping the altar from day to day. There is nothing to lose here: a
            badge, once earned, stays.
          </Text>
        </View>

        <View style={styles.grid}>
          {badges.map((badge, index) => {
            const fraction = Math.min(1, badge.count / badge.target);
            return (
              <Rise key={badge.id} delay={index * 40}>
                <View
                  accessible
                  accessibilityLabel={`${badge.title}. ${badge.description} ${
                    badge.reached ? 'Earned.' : `${badge.count} of ${badge.target}.`
                  }`}
                  style={[
                    styles.card,
                    { width: cardWidth, backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <Medal badge={badge} size={92} />
                  <Text variant="bodyStrong" style={styles.title}>
                    {badge.title}
                  </Text>
                  <Text variant="meta" color="textSecondary" style={styles.description}>
                    {badge.description}
                  </Text>
                  <View style={styles.progress}>
                    {badge.reached ? (
                      <Text variant="metaStrong" style={{ color: badge.rim }}>
                        Earned
                      </Text>
                    ) : (
                      <>
                        <ProgressBar value={fraction} accessibilityLabel={`${badge.count} of ${badge.target}`} />
                        <Text variant="caption" color="textTertiary">
                          {badge.count} of {badge.target}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </Rise>
            );
          })}
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingHorizontal: space.gutter,
  },
  card: {
    alignItems: 'center',
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 270,
  },
  title: {
    textAlign: 'center',
    paddingTop: space.sm,
  },
  description: {
    textAlign: 'center',
  },
  progress: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: space.xs,
    marginTop: 'auto',
    paddingTop: space.sm,
  },
});
