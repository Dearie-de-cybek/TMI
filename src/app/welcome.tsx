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
import { Rise } from '@/components/ui/motion';
import { Eyebrow, Text } from '@/components/ui/text';
import { fonts, radius, space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';
import { churchImages } from '@/lib/artwork';

/**
 * First launch.
 *
 * Three photographs of the church, edge to edge, one short line each. The first
 * thing a member should meet is people they recognise, not a logo - so each
 * slide is the church's own picture filling the screen, with a single idea set
 * large over it. The buttons float on the picture; the sign-up choices wait on
 * the last slide.
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
    body: 'Services, ministries, notices and giving, all in one place.',
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

/** Room reserved under the caption for the pager and the three last-slide buttons. */
const FOOTER_RESERVE = 232;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const markOnboardingSeen = useAuth((state) => state.markOnboardingSeen);

  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const last = index === slides.length - 1;

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
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(slide) => slide.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
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
              colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(8,3,5,0.55)', 'rgba(8,3,5,0.92)']}
              locations={[0, 0.3, 0.62, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View
              style={[styles.caption, { paddingBottom: insets.bottom + FOOTER_RESERVE }]}
              pointerEvents="none"
            >
              <Eyebrow style={styles.eyebrow}>{item.eyebrow}</Eyebrow>
              <Text style={styles.title}>{item.title}</Text>
              <Text variant="bodyLarge" style={styles.body}>
                {item.body}
              </Text>
            </View>
          </View>
        )}
      />

      {last ? null : (
        <View style={[styles.skip, { top: insets.top + space.md }]}>
          <Button
            label="Skip"
            variant="glass"
            size="sm"
            onPress={() => void go('/')}
          />
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xl }]}>
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
                  width: slideIndex === index ? 32 : 10,
                  backgroundColor: slideIndex === index ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                },
              ]}
            />
          ))}
        </View>

        {last ? (
          <Rise style={styles.actions}>
            <Button label="Create an account" variant="light" size="lg" fullWidth onPress={() => void go('/sign-up')} />
            <Button
              label="I already have an account"
              variant="glass"
              size="lg"
              fullWidth
              onPress={() => void go('/sign-in')}
            />
            <Button
              label="Look around first"
              variant="ghostLight"
              fullWidth
              style={styles.look}
              onPress={() => void go('/')}
            />
          </Rise>
        ) : (
          <View style={styles.actions}>
            <Button
              label="Continue"
              variant="light"
              size="lg"
              icon="arrow-right"
              iconPosition="trailing"
              fullWidth
              onPress={next}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080305',
  },
  caption: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: space.gutter,
    gap: space.sm,
  },
  eyebrow: {
    color: '#E3B965',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: fonts.sansExtraBold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.4,
  },
  body: {
    color: 'rgba(255,255,255,0.86)',
    maxWidth: 340,
  },
  skip: {
    position: 'absolute',
    right: space.gutter,
    borderRadius: radius.pill,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.gutter,
    gap: space.xl,
  },
  indicator: {
    flexDirection: 'row',
    gap: space.xs,
    alignItems: 'center',
  },
  bar: {
    height: 4,
    borderRadius: radius.pill,
  },
  actions: {
    gap: space.sm,
  },
  look: {
    alignSelf: 'center',
  },
});
