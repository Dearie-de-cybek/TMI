import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { useLikes } from '@/features/likes/store';

import { Pressable } from './pressable';
import { Text } from './text';

/**
 * A heart. Tapping it fills it and gives it a small spring; tapping again
 * empties it. The state lives on the device (`features/likes`).
 */
export function LikeButton({
  id,
  onDark = false,
  label = true,
}: {
  id: string;
  /** White glyph and label, for use over a photograph. */
  onDark?: boolean;
  label?: boolean;
}) {
  const { colors, reduceMotion } = useTheme();
  const liked = useLikes((state) => state.ids.includes(id));
  const hydrate = useLikes((state) => state.hydrate);
  const toggle = useLikes((state) => state.toggle);
  const scale = useSharedValue(1);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function press() {
    const nowLiked = toggle(id);
    if (nowLiked) {
      if (!reduceMotion) scale.set(withSequence(withSpring(1.35, { damping: 6 }), withSpring(1)));
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      }
    }
  }

  const idle = onDark ? '#FFFFFF' : colors.text;
  const labelColor = onDark ? 'textOnInverse' : 'textSecondary';

  return (
    <Pressable
      onPress={press}
      feedback="opacity"
      accessibilityRole="button"
      accessibilityState={{ selected: liked }}
      accessibilityLabel={liked ? 'Unlike' : 'Like'}
      style={styles.button}
    >
      <Animated.View style={animated}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={28}
          color={liked ? (onDark ? '#FF6B81' : colors.primary) : idle}
        />
      </Animated.View>
      {label ? (
        <Text variant="metaStrong" color={labelColor}>
          {liked ? 'Liked' : 'Like'}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
  },
});
