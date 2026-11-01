import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Rise } from '@/components/ui/motion';
import { Band } from '@/components/ui/band';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/ui/header';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, space } from '@/design/tokens';
import { churchImages } from '@/lib/artwork';
import { churchInfo } from '@/lib/church-info';

/**
 * About the church — who we are, when we meet, what we believe. All of it is the
 * church's own printed wording (see `lib/church-info`).
 */
export default function AboutScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <Screen>
      <NavBar title="About us" />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.hero}>
          <Image
            source={churchImages.congregationBanner}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top center"
            accessibilityLabel="The congregation of TwainMan Ministry International"
            accessibilityRole="image"
            accessible
          />
          <LinearGradient
            colors={['transparent', colors.scrim, colors.scrimStrong]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.heroText}>
            <Eyebrow style={{ color: colors.accentFill }}>{churchInfo.name}</Eyebrow>
            <Text style={[styles.tagline, { color: colors.textOnInverse }]}>{churchInfo.tagline}</Text>
          </View>
        </View>

        <Rise>
          <View style={styles.section}>
            <SectionHeader eyebrow="Who we are" title="A prayer and prophetic army" />
            {churchInfo.whoWeAre.map((line) => (
              <Text key={line} variant="bodyLarge" style={styles.paragraph}>
                {line}
              </Text>
            ))}
            <View style={[styles.quote, { borderColor: colors.accent }]}>
              {churchInfo.whoWeAreLines.map((line) => (
                <Text key={line} variant="quote">
                  {line}
                </Text>
              ))}
            </View>
            {churchInfo.whoWeAreCreed.map((line) => (
              <Text key={line} variant="body" color="textSecondary" style={styles.creed}>
                {line}
              </Text>
            ))}
          </View>
        </Rise>

        <Band tone="accent">
          <View style={styles.section}>
            <SectionHeader eyebrow="Worship days" title="When we gather" />
            {churchInfo.worshipDays.map((item, index) => (
              <View key={`${item.day}-${item.what}`}>
                {index > 0 ? <Rule /> : null}
                <View style={styles.dayRow}>
                  <View style={styles.dayText}>
                    <Text variant="caption" color="accentOnSoft">
                      {item.day}
                    </Text>
                    <Text variant="bodyStrong">{item.what}</Text>
                  </View>
                  <Text variant="metaStrong" color="textSecondary">
                    {item.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Band>

        <View style={styles.section}>
          <SectionHeader eyebrow="Special features" title="Through the year" />
          {churchInfo.specialFeatures.map((item, index) => (
            <View key={item.name}>
              {index > 0 ? <Rule /> : null}
              <View style={styles.dayRow}>
                <View style={styles.dayText}>
                  <Text variant="bodyStrong">{item.name}</Text>
                  {item.when ? (
                    <Text variant="caption" color="textSecondary">
                      {item.when}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>

        <Band tone="primary">
          <View style={styles.section}>
            <SectionHeader eyebrow="What we believe" title="Our foundation" />
            {churchInfo.beliefs.map((belief, index) => (
              <View key={index} style={styles.belief}>
                <Text variant="caption" color="accent" style={styles.beliefIndex}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text variant="body" style={styles.beliefText}>
                  {belief}
                </Text>
              </View>
            ))}
          </View>
        </Band>

        <View style={styles.section}>
          <SectionHeader eyebrow="Find us online" title="Follow the ministry" />
          {churchInfo.social.map((item) => (
            <View key={item.network} style={styles.socialRow}>
              <Text variant="caption" color="textTertiary" style={styles.network}>
                {item.network}
              </Text>
              <Text variant="bodyStrong">{item.handle}</Text>
            </View>
          ))}
          <Text variant="quote" color="textSecondary" style={styles.motto}>
            {churchInfo.motto}
          </Text>
          <Button
            label="Find a ministry to join"
            icon="arrow-right"
            iconPosition="trailing"
            fullWidth
            onPress={() => router.push('/community')}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 260,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroText: {
    padding: space.gutter,
    gap: space.xs,
  },
  tagline: {
    fontFamily: fonts.sansBold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.5,
  },
  section: {
    paddingHorizontal: space.gutter,
    paddingVertical: space.xl,
    gap: space.sm,
  },
  paragraph: {
    maxWidth: 620,
  },
  quote: {
    borderLeftWidth: 2,
    paddingLeft: space.lg,
    paddingVertical: space.sm,
    marginVertical: space.sm,
  },
  creed: {
    maxWidth: 620,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.md,
  },
  dayText: {
    flex: 1,
    gap: 2,
  },
  belief: {
    flexDirection: 'row',
    gap: space.lg,
    paddingVertical: space.sm,
  },
  beliefIndex: {
    width: 22,
    paddingTop: 3,
  },
  beliefText: {
    flex: 1,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xs,
  },
  network: {
    width: 76,
  },
  motto: {
    paddingVertical: space.lg,
  },
});
