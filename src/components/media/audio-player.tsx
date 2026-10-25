import Slider from '@react-native-community/slider';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { formatDuration } from '@/lib/datetime';
import { type SermonPlayerState } from '@/features/sermons/use-sermon-player';

const rates = [1, 1.25, 1.5, 2] as const;

/**
 * Sermon audio player.
 *
 * Sits on the inverted plate so it reads as a distinct instrument rather than
 * another card. Every state is handled: no audio supplied, loading, buffering,
 * a failed load with a retry, and playback.
 */
export function AudioPlayer({ player, title }: { player: SermonPlayerState; title: string }) {
  const colors = useColors();

  if (!player.available) {
    return (
      <View style={[styles.plate, { backgroundColor: colors.surfaceMuted }]}>
        <Icon name="volume-x" size="md" color="textSecondary" />
        <Text variant="meta" color="textSecondary" style={styles.unavailableText}>
          No audio was published for this teaching. The notes and transcript may still be available
          below.
        </Text>
      </View>
    );
  }

  if (player.error) {
    return (
      <View style={[styles.plate, styles.errorPlate, { backgroundColor: colors.dangerSoft }]}>
        <Text variant="metaStrong" color="dangerOnSoft">
          This recording would not load
        </Text>
        <Text variant="meta" color="dangerOnSoft">
          The file may have moved, or your connection dropped while it was loading.
        </Text>
        <Button label="Try again" variant="secondary" size="sm" icon="refresh-cw" onPress={player.retry} />
      </View>
    );
  }

  const duration = player.duration ?? 0;
  const nextRate = rates[(rates.indexOf(player.rate as (typeof rates)[number]) + 1) % rates.length]!;

  return (
    <View style={[styles.player, { backgroundColor: colors.surfaceInverse }]}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        value={Math.min(player.position, duration > 0 ? duration : 1)}
        onValueChange={player.onScrub}
        onSlidingComplete={player.onScrubEnd}
        disabled={duration <= 0}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.textOnInverseSecondary}
        thumbTintColor={colors.accent}
        accessibilityLabel={`Playback position for ${title}`}
        accessibilityValue={{
          min: 0,
          max: Math.round(duration),
          now: Math.round(player.position),
          text: `${formatDuration(player.position)} of ${formatDuration(duration)}`,
        }}
      />

      <View style={styles.times}>
        <Text variant="caption" color="textOnInverseSecondary">
          {formatDuration(player.position)}
        </Text>
        <Text variant="caption" color="textOnInverseSecondary">
          {duration > 0 ? formatDuration(duration) : '--:--'}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => player.skip(-15)}
          accessibilityLabel="Back 15 seconds"
          feedback="opacity"
          style={styles.skip}
        >
          <Icon name="rotate-ccw" size="md" color="textOnInverse" />
          <Text variant="caption" color="textOnInverseSecondary">
            15
          </Text>
        </Pressable>

        <Pressable
          onPress={player.togglePlay}
          accessibilityLabel={player.playing ? 'Pause' : 'Play'}
          accessibilityState={{ busy: player.buffering }}
          feedback="opacity"
          haptic
          style={[styles.playButton, { backgroundColor: colors.accent }]}
        >
          {player.buffering ? (
            <ActivityIndicator color={colors.textOnAccent} />
          ) : (
            <Icon name={player.playing ? 'pause' : 'play'} size="lg" color="textOnAccent" />
          )}
        </Pressable>

        <Pressable
          onPress={() => player.skip(30)}
          accessibilityLabel="Forward 30 seconds"
          feedback="opacity"
          style={styles.skip}
        >
          <Icon name="rotate-cw" size="md" color="textOnInverse" />
          <Text variant="caption" color="textOnInverseSecondary">
            30
          </Text>
        </Pressable>

        <Pressable
          onPress={() => player.setRate(nextRate)}
          accessibilityLabel={`Playback speed ${player.rate} times. Tap for ${nextRate} times.`}
          feedback="opacity"
          style={styles.rate}
        >
          <Text variant="metaStrong" color="textOnInverse">
            {player.rate}×
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
    borderRadius: radius.sm,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xl,
    paddingTop: space.md,
  },
  skip: {
    alignItems: 'center',
    minWidth: 44,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rate: {
    position: 'absolute',
    right: 0,
    minWidth: 44,
    alignItems: 'flex-end',
  },
  plate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.sm,
  },
  errorPlate: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  unavailableText: {
    flex: 1,
  },
});
