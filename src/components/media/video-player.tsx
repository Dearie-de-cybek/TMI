import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';

/**
 * Sermon and lesson video.
 *
 * Uses the platform's own controls — members already know them, and they handle
 * seeking, captions, AirPlay and full screen better than a hand-rolled bar.
 * The surrounding frame only adds the load/error states.
 */
export function SermonVideoPlayer({
  uri,
  title,
  autoPlay = false,
}: {
  uri: string;
  title: string;
  autoPlay?: boolean;
}) {
  const colors = useColors();

  const player = useVideoPlayer({ uri }, (instance) => {
    instance.loop = false;
    instance.timeUpdateEventInterval = 1;
    if (autoPlay) instance.play();
  });

  const { status, error } = useEvent(player, 'statusChange', { status: player.status });

  if (status === 'error') {
    return (
      <View style={[styles.frame, styles.state, { backgroundColor: colors.dangerSoft }]}>
        <Text variant="metaStrong" color="dangerOnSoft">
          This video would not play
        </Text>
        <Text variant="meta" color="dangerOnSoft" style={styles.message}>
          {error?.message ?? 'The file may have moved, or the connection dropped while loading.'}
        </Text>
        <Button
          label="Try again"
          size="sm"
          variant="secondary"
          icon="refresh-cw"
          onPress={() => player.replace({ uri })}
        />
      </View>
    );
  }

  return (
    <View style={[styles.frame, { backgroundColor: colors.surfaceInverse }]}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
        allowsPictureInPicture
        accessibilityLabel={`Video of ${title}`}
      />
      {status === 'loading' ? (
        <View style={styles.overlay} pointerEvents="none">
          <Text variant="caption" color="textOnInverse">
            Loading video…
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.lg,
    aspectRatio: undefined,
  },
  message: {
    maxWidth: 420,
  },
});
