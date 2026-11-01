import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type Sermon } from '@/api/schemas';
import { preferences, storageKeys } from '@/lib/storage';

import { reportSermonProgress } from './api';

/**
 * Audio playback for a sermon.
 *
 * Responsibilities kept in one place:
 *  - configure the audio session once, so playback survives the lock screen on
 *    iOS (Android background playback additionally needs the foreground-service
 *    permissions declared in `app.json` and a development build);
 *  - resume from the position the server recorded, falling back to the device
 *    cache when the member is signed out or offline;
 *  - report the position back on a timer and when playback stops, so the member
 *    can pick up on another device;
 *  - surface load failures rather than sitting on a dead progress bar.
 */

const REPORT_INTERVAL_MS = 20_000;
const RESUME_THRESHOLD_SECONDS = 15;

type LocalPositions = Record<string, { position: number; duration: number | null }>;

export type SermonPlayerState = {
  available: boolean;
  playing: boolean;
  buffering: boolean;
  /** Seconds. Reflects the scrub position while the member is dragging. */
  position: number;
  duration: number | null;
  error: string | null;
  rate: number;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  skip: (seconds: number) => void;
  setRate: (rate: number) => void;
  retry: () => void;
  /** Called by the UI while dragging, so the label tracks the thumb. */
  onScrub: (seconds: number) => void;
  onScrubEnd: (seconds: number) => void;
};

export function useSermonPlayer(sermon: Sermon | undefined, signedIn: boolean): SermonPlayerState {
  const source = sermon?.audio?.url ?? null;
  const player = useAudioPlayer(source ? { uri: source } : null);
  const status = useAudioPlayerStatus(player);

  const [scrubPosition, setScrubPosition] = useState<number | null>(null);
  const [rate, setRateState] = useState(1);
  const [retryToken, setRetryToken] = useState(0);
  const resumedRef = useRef<string | null>(null);
  const lastReportRef = useRef(0);

  useEffect(() => {
    // Keep playing when the screen locks; never take over the microphone.
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      allowsRecording: false,
    }).catch(() => undefined);
  }, []);

  const reportProgress = useCallback(
    async (positionSeconds: number, completed = false) => {
      if (!sermon) return;
      const duration = status.duration > 0 ? status.duration : (sermon.audio?.duration_seconds ?? null);

      // The device cache keeps resume working offline and while signed out.
      const cached = (await preferences.getJson<LocalPositions>(storageKeys.playbackPositions)) ?? {};
      cached[sermon.id] = { position: positionSeconds, duration };
      await preferences.setJson(storageKeys.playbackPositions, cached);

      if (!signedIn) return;
      try {
        await reportSermonProgress({
          id: sermon.id,
          positionSeconds,
          durationSeconds: duration,
          completed,
        });
      } catch {
        // Progress is a convenience; a failed report must not interrupt playback.
      }
    },
    [sermon, signedIn, status.duration]
  );

  // Resume once per sermon, from the server position when there is one.
  useEffect(() => {
    if (!sermon || !source || !status.isLoaded) return;
    if (resumedRef.current === sermon.id) return;
    resumedRef.current = sermon.id;

    void (async () => {
      const serverPosition = sermon.progress?.completed ? 0 : (sermon.progress?.position_seconds ?? 0);
      let position = serverPosition;

      if (position < RESUME_THRESHOLD_SECONDS) {
        const cached = await preferences.getJson<LocalPositions>(storageKeys.playbackPositions);
        const local = cached?.[sermon.id]?.position ?? 0;
        position = Math.max(position, local);
      }

      // A stored position can outlive the file it came from (a re-upload, a
      // shorter edit), so never resume into the last few seconds - start again.
      const length = status.duration > 0 ? status.duration : null;
      const resumable =
        position >= RESUME_THRESHOLD_SECONDS &&
        (length === null || position <= length - RESUME_THRESHOLD_SECONDS);

      if (resumable) {
        await player.seekTo(position).catch(() => undefined);
      }
    })();
  }, [player, sermon, source, status.duration, status.isLoaded]);

  // Periodic reporting while playing.
  useEffect(() => {
    if (!status.playing) return;
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - lastReportRef.current < REPORT_INTERVAL_MS - 500) return;
      lastReportRef.current = now;
      void reportProgress(status.currentTime);
    }, REPORT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reportProgress, status.currentTime, status.playing]);

  // Report once when the track finishes.
  useEffect(() => {
    if (status.didJustFinish) void reportProgress(status.duration, true);
  }, [reportProgress, status.didJustFinish, status.duration]);

  // Report on unmount so leaving the screen keeps the position.
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    return () => {
      const snapshot = statusRef.current;
      if (snapshot.isLoaded && snapshot.currentTime > 0) {
        void reportProgress(snapshot.currentTime);
      }
    };
  }, [reportProgress]);

  const togglePlay = useCallback(() => {
    if (status.playing) {
      player.pause();
      void reportProgress(status.currentTime);
    } else {
      player.play();
    }
  }, [player, reportProgress, status.currentTime, status.playing]);

  const seekTo = useCallback(
    (seconds: number) => {
      const target = Math.max(0, Math.min(seconds, status.duration || seconds));
      void player.seekTo(target).catch(() => undefined);
    },
    [player, status.duration]
  );

  const skip = useCallback(
    (seconds: number) => seekTo((status.currentTime ?? 0) + seconds),
    [seekTo, status.currentTime]
  );

  const setRate = useCallback(
    (next: number) => {
      setRateState(next);
      player.setPlaybackRate(next, 'high');
    },
    [player]
  );

  const retry = useCallback(() => {
    if (!source) return;
    resumedRef.current = null;
    setRetryToken((token) => token + 1);
    player.replace({ uri: source });
  }, [player, source]);

  // `retryToken` only exists to re-run `replace`; referenced so lint sees it used.
  void retryToken;

  const position = scrubPosition ?? status.currentTime ?? 0;
  const duration = status.duration > 0 ? status.duration : (sermon?.audio?.duration_seconds ?? null);

  return useMemo<SermonPlayerState>(
    () => ({
      available: Boolean(source),
      playing: status.playing,
      buffering: status.isBuffering || (!status.isLoaded && Boolean(source) && !status.error),
      position,
      duration,
      error: status.error ?? null,
      rate,
      togglePlay,
      seekTo,
      skip,
      setRate,
      retry,
      onScrub: (seconds: number) => setScrubPosition(seconds),
      onScrubEnd: (seconds: number) => {
        setScrubPosition(null);
        seekTo(seconds);
      },
    }),
    [
      duration,
      position,
      rate,
      retry,
      seekTo,
      setRate,
      skip,
      source,
      status.error,
      status.isBuffering,
      status.isLoaded,
      status.playing,
      togglePlay,
    ]
  );
}
