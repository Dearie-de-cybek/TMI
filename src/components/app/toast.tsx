import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SlideInUp,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';

/**
 * Brief confirmation for an action that succeeded and does not need a screen of
 * its own ("Saved", "Marked as read"). Failures are never shown here — they get
 * an inline error next to the control that failed, so the member can act on it.
 *
 * It drops in from the top on a spring, carries a coloured edge and a glyph for
 * its tone, and a thin line runs down as the time to read it runs out.
 */
export type ToastTone = 'neutral' | 'success' | 'warning';

type Toast = { id: number; message: string; tone: ToastTone; icon?: IconName };

type ToastState = {
  current: Toast | null;
  show: (message: string, options?: { tone?: ToastTone; icon?: IconName }) => void;
  dismiss: () => void;
};

let nextId = 1;
const DURATION_MS = 2_800;

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (message, options) =>
    set({ current: { id: nextId++, message, tone: options?.tone ?? 'neutral', icon: options?.icon } }),
  dismiss: () => set({ current: null }),
}));

export function useToast() {
  return useToastStore((state) => state.show);
}

const defaultIcons: Record<ToastTone, IconName> = {
  neutral: 'info',
  success: 'star',
  warning: 'alert-triangle',
};

export function ToastHost() {
  const { colors, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToastStore((state) => state.current);
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, DURATION_MS);
    return () => clearTimeout(timer);
  }, [dismiss, toast]);

  if (!toast) return null;

  const edge =
    toast.tone === 'success' ? colors.success : toast.tone === 'warning' ? colors.warning : colors.accentFill;

  return (
    <Animated.View
      key={toast.id}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      entering={reduceMotion ? undefined : SlideInUp.springify().damping(15).stiffness(160)}
      exiting={reduceMotion ? undefined : SlideOutUp.duration(180)}
      style={[
        styles.toast,
        {
          top: insets.top + space.sm,
          backgroundColor: colors.surfaceInverse,
        },
      ]}
    >
      <View style={[styles.edge, { backgroundColor: edge }]} />
      <View style={styles.row}>
        <Icon name={toast.icon ?? defaultIcons[toast.tone]} size="md" color="accentFill" />
        <Text variant="metaStrong" color="textOnInverse" numberOfLines={2} style={styles.label}>
          {toast.message}
        </Text>
      </View>
      <Countdown color={edge} reduceMotion={reduceMotion} />
    </Animated.View>
  );
}

function Countdown({ color, reduceMotion }: { color: string; reduceMotion: boolean }) {
  const progress = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withTiming(0, { duration: DURATION_MS, easing: Easing.linear });
  }, [progress, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return <Animated.View style={[styles.countdown, { backgroundColor: color }, animated]} />;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space.gutter,
    right: space.gutter,
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingLeft: space.lg + 4,
    paddingRight: space.lg,
    paddingVertical: space.lg,
  },
  label: {
    flex: 1,
  },
  countdown: {
    height: 2,
  },
});
