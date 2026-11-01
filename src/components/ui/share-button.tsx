import Ionicons from '@expo/vector-icons/Ionicons';
import { Share, StyleSheet } from 'react-native';

import { useColors } from '@/design/theme';
import { space } from '@/design/tokens';

import { Pressable } from './pressable';
import { Text } from './text';

/** Opens the system share sheet with a short piece of the church's own text. */
export function ShareButton({
  message,
  onDark = false,
}: {
  message: string;
  /** White glyph and label, for use over a photograph. */
  onDark?: boolean;
}) {
  const colors = useColors();

  function share() {
    void Share.share({ message: `${message}\n\nTwainMan Ministry International` }).catch(
      () => undefined
    );
  }

  return (
    <Pressable
      onPress={share}
      feedback="opacity"
      accessibilityLabel="Share"
      style={styles.button}
    >
      <Ionicons name="share-social-outline" size={28} color={onDark ? '#FFFFFF' : colors.text} />
      <Text variant="metaStrong" color={onDark ? 'textOnInverse' : 'textSecondary'}>
        Share
      </Text>
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
