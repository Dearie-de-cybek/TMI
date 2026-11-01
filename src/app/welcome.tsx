import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { churchImages } from '@/lib/artwork';

/**
 * First launch.
 *
 * Three photographs of the church, one short line each. The first thing a
 * member should meet is people they recognise, not a logo — so each slide is
 * the church's own picture with a single idea over it, and the sign-up choices
 * wait on the last one.
 *
 * "Look around first" is deliberate: the public content is browsable without an
 * account, and the app should say so on the way in.
 */
type Slide = {
  key: string;
  image: number;
  position: 'center' | 'top center';
  eyebrow: string;
  title: string;
  body: string;
  label: string;
};

const slides: Slide[] = [
  {
    key: 'house',
    image: churchImages.congregationPortrait,
    position: 'center',
    eyebrow: 'TwainMan Ministry International',
    title: 'Welcome to the house',
    body: 'Services, ministries, notices and giving — all in one place.',
    label: 'Members of TwainMan Ministry International worshipping together',
  },
  {
    key: 'word',
    image: churchImages.teachingSeated,
    position: 'top center',
    eyebrow: 'Teaching',
    title: 'Sit with the Word again',
    body: 'Every message, with study notes and a daily devotional.',
    label: 'A minister teaching the congregation',
  },
  {
    key: 'prayer',
    image: churchImages.prayerHandsRaised,
    position: 'top center',
    eyebrow: 'Prayer',
    title: 'Pray with the church',
    body: 'The monthly prophetic decree, and a reminder to keep returning to it.',
    label: 'Members of the church at prayer with hands raised',
  },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const markOnboardingSeen = useAuth((state) => state.markOnboardingSeen);

  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const last = index === slides.length - 1;

  // The photograph takes most of the screen, but the actions are always visible.
  const photoHeight = Math.round(height * 0.62);

  async function go(destination: '/sign-up' | '/sign-in' | '/') {
    await markOnboardingSeen();
    router.replace(destination);
  }

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  function next() {
    const target = Math.min(index + 1, slides.length - 1);
    listRef.current?.scrollToOffset({ offset: width * target, animated: true });
    setIndex(target);
  }

  return (
    <Screen>
      <View style={{ height: photoHeight }}>
        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(slide) => slide.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
          renderItem={({ item }) => (
            <View style={{ width, height: photoHeight }}>
              <Image
                source={item.image}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition={item.position}
                accessibilityLabel={item.label}
                accessibilityRole="image"
                accessible
                transition={240}
              />
              <LinearGradient
                colors={['transparent', colors.scrim, colors.scrimStrong]}
                locations={[0.35, 0.7, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={[styles.caption, { paddingTop: insets.top + space.lg }]}>
                <Eyebrow style={{ color: colors.accentFill }}>{item.eyebrow}</Eyebrow>
                <Text style={[styles.title, { color: colors.textOnInverse }]}>{item.title}</Text>
                <Text variant="body" color="textOnInverseSecondary" style={styles.body}>
                  {item.body}
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <View
          style={styles.indicator}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Page ${index + 1} of ${slides.length}`}
        >
          {slides.map((slide, slideIndex) => (
            <View
              key={slide.key}
              style={[
                styles.bar,
                {
                  width: slideIndex === index ? 28 : 12,
                  backgroundColor: slideIndex === index ? colors.accent : colors.borderStrong,
                },
              ]}
            />
          ))}
        </View>

        {last ? (
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
        ) : (
          <View style={styles.actions}>
            <Button label="Continue" icon="arrow-right" iconPosition="trailing" fullWidth onPress={next} />
            <Button label="Skip" variant="ghost" fullWidth onPress={() => void go('/')} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  caption: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: space.gutter,
    paddingBottom: space.lg,
    gap: space.xs,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1,
  },
  body: {
    maxWidth: 380,
  },
  footer: {
    flex: 1,
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    gap: space.lg,
    justifyContent: 'space-between',
  },
  indicator: {
    flexDirection: 'row',
    gap: space.xs,
    alignItems: 'center',
  },
  bar: {
    height: 3,
  },
  actions: {
    gap: space.sm,
  },
});
