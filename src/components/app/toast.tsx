import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet } from 'react-native';
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
 */
export type ToastTone = 'neutral' | 'success' | 'warning';

type Toast = { id: number; message: string; tone: ToastTone; icon?: IconName };

type ToastState = {
  current: Toast | null;
  show: (message: string, options?: { tone?: ToastTone; icon?: IconName }) => void;
  dismiss: () => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (message, options) =>
    set({ current: { id: nextId++, message, tone: options?.tone ?? 'neutral', icon: options?.icon } }),
  dismiss: () => set({ current: null }),
}));

export function useToast() {
  return useToastStore((state) => state.show);
}

export function ToastHost() {
  const { colors, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToastStore((state) => state.current);
  const dismiss = useToastStore((state) => state.dismiss);
  // Created once per mount; `useRef().current` would be a ref read during render.
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, 2_600);
    Animated.timing(opacity, {
      toValue: 1,
      duration: reduceMotion ? 0 : 160,
      useNativeDriver: true,
    }).start();
    return () => {
      clearTimeout(timer);
      opacity.setValue(0);
    };
  }, [dismiss, opacity, reduceMotion, toast]);

  if (!toast) return null;

  const background =
    toast.tone === 'success'
      ? colors.successSoft
      : toast.tone === 'warning'
        ? colors.warningSoft
        : colors.surfaceInverse;
  const textColor =
    toast.tone === 'success' ? 'successOnSoft' : toast.tone === 'warning' ? 'warningOnSoft' : 'textOnInverse';

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        { backgroundColor: background, bottom: insets.bottom + 72, opacity },
      ]}
    >
      {toast.icon ? <Icon name={toast.icon} size="sm" color={textColor} /> : null}
      <Text variant="metaStrong" color={textColor} numberOfLines={2} style={styles.label}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space.gutter,
    right: space.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.sm,
  },
  label: {
    flex: 1,
  },
});
