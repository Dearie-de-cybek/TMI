import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Rule, Screen } from '@/components/ui/screen';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';

/**
 * First launch.
 *
 * A typographic title page rather than a carousel of illustrations: the
 * wordmark, a line of Scripture, three plain statements of what the app is for,
 * and a way in. "Look around first" exists deliberately — public content is
 * browsable without an account.
 */
const propositions = [
  {
    title: 'Teaching you can study',
    body: 'Sermons with transcripts, study notes and a way to ask questions about what was said.',
  },
  {
    title: 'Courses with your cohort',
    body: 'Lessons, live sessions and progress the church keeps for you.',
  },
  {
    title: 'The life of the church',
    body: 'Events, ministries, prayer, announcements and giving — in one place.',
  },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const markOnboardingSeen = useAuth((state) => state.markOnboardingSeen);

  async function go(destination: '/sign-up' | '/sign-in' | '/') {
    await markOnboardingSeen();
    if (destination === '/') {
      router.replace('/');
    } else {
      router.replace(destination);
    }
  }

  return (
    <Screen style={[styles.screen, { paddingTop: insets.top + space.giant }]}>
      <View style={styles.masthead}>
        <Eyebrow color="accent">A church in your pocket</Eyebrow>
        <Text style={[styles.wordmark, { color: colors.text }]}>
          Kingdom{'\n'}Heralds
        </Text>
        <Rule style={styles.rule} />
        <Text variant="quote" color="textSecondary" style={styles.verse}>
          “Declare his glory among the nations, his marvellous deeds among all peoples.”
        </Text>
        <Text variant="caption" color="textTertiary">
          Psalm 96:3
        </Text>
      </View>

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

      <View style={[styles.actions, { paddingBottom: insets.bottom + space.xl }]}>
        <Button label="Create an account" fullWidth onPress={() => void go('/sign-up')} />
        <Button label="I already have an account" variant="secondary" fullWidth onPress={() => void go('/sign-in')} />
        <Button label="Look around first" variant="ghost" fullWidth onPress={() => void go('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: space.gutter,
    justifyContent: 'space-between',
  },
  masthead: {
    gap: space.sm,
  },
  wordmark: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.2,
    marginTop: space.xs,
  },
  rule: {
    marginVertical: space.lg,
  },
  verse: {
    maxWidth: 460,
  },
  propositions: {
    gap: space.xl,
    paddingVertical: space.xxl,
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
