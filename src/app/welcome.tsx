import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { churchImages } from '@/lib/artwork';

/**
 * First launch.
 *
 * It opens with the congregation — the church's own photograph, full-bleed,
 * dissolving into the page — because the first thing a member should meet is
 * people they recognise, not a logo. The wordmark sits on the photograph; the
 * reasons to be here sit below it, in plain language.
 *
 * "Look around first" is deliberate: the public content is browsable without an
 * account, and the app should say so on the way in.
 */
const propositions = [
  {
    title: 'Sit with the teaching again',
    body: 'Every message, with transcripts and study notes — and a way to ask what a passage meant.',
  },
  {
    title: 'Grow with your cohort',
    body: 'Courses, live sessions and the progress the church keeps for you.',
  },
  {
    title: 'Stay in the life of the house',
    body: 'Services, ministries, prayer, notices and giving, all in one place.',
  },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const markOnboardingSeen = useAuth((state) => state.markOnboardingSeen);

  // The photograph takes the top of the screen but never more than half of it,
  // so the reasons to be here are visible before anyone scrolls.
  const photoHeight = Math.min(Math.round(height * 0.46), 420);

  async function go(destination: '/sign-up' | '/sign-in' | '/') {
    await markOnboardingSeen();
    if (destination === '/') {
      router.replace('/');
    } else {
      router.replace(destination);
    }
  }

  return (
    <Screen>
      <ScreenScroll bottomSpace={space.xxl}>
        <View style={[styles.photoFrame, { height: photoHeight }]}>
          <Image
            source={churchImages.congregationPortrait}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="center"
            accessibilityLabel="Members of TwainMan Ministry International worshipping together"
            accessibilityRole="image"
            accessible
            transition={240}
          />
          <LinearGradient
            colors={['transparent', colors.scrimStrong, colors.background]}
            locations={[0.5, 0.88, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.mark, { paddingTop: insets.top + space.lg }]}>
            <View style={styles.markBottom}>
              <Eyebrow color="accentOnSoft" style={{ color: colors.accentFill }}>
                Ministry International
              </Eyebrow>
              <Text style={[styles.wordmark, { color: colors.textOnInverse }]}>TwainMan</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text variant="quote" color="textSecondary" style={styles.verse}>
            “Declare his glory among the nations, his marvellous deeds among all peoples.”
          </Text>
          <Text variant="caption" color="accent">
            Psalm 96:3
          </Text>

          <Rule style={styles.rule} />

          <View style={styles.propositions}>
            {propositions.map((proposition, index) => (
              <View key={proposition.title} style={styles.proposition}>
                <Text variant="caption" color="accent" style={styles.index}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <View style={styles.propositionText}>
                  <Text variant="bodyStrong">{proposition.title}</Text>
                  <Text variant="meta" color="textSecondary">
                    {proposition.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Create an account" fullWidth onPress={() => void go('/sign-up')} />
            <Button
              label="I already have an account"
              variant="secondary"
              fullWidth
              onPress={() => void go('/sign-in')}
            />
            <Button label="Look around first" variant="ghost" fullWidth onPress={() => void go('/')} />
          </View>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoFrame: {
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  mark: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: space.gutter,
    paddingBottom: space.lg,
  },
  markBottom: {
    gap: space.xs,
  },
  wordmark: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  body: {
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
  },
  verse: {
    maxWidth: 460,
  },
  rule: {
    marginVertical: space.xl,
  },
  propositions: {
    gap: space.lg,
    paddingBottom: space.xxl,
  },
  proposition: {
    flexDirection: 'row',
    gap: space.lg,
  },
  index: {
    width: 22,
    paddingTop: 3,
  },
  propositionText: {
    flex: 1,
    gap: 2,
  },
  actions: {
    gap: space.sm,
  },
});
