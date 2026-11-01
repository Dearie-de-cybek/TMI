import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';

/**
 * Brief confirmation for an action that succeeded and does not need a screen of
 * its own ("Saved", "Marked as read"). Failures are never shown here - they get
 * an inline error next to the control that failed, so the member can act on it.
 *
 * A single white pill at the top, an icon in the tone's colour and one line of
 * text, sliding in and fading out. Nothing else.
 */
export type ToastTone = 'neutral' | 'success' | 'warning';

type Toast = { id: number; message: string; tone: ToastTone; icon?: IconName };

type ToastState = {
  current: Toast | null;
  show: (message: string, options?: { tone?: ToastTone; icon?: IconName }) => void;
  dismiss: () => void;
};

let nextId = 1;
const DURATION_MS = 2_600;

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

  const iconColor =
    toast.tone === 'success' ? 'success' : toast.tone === 'warning' ? 'warning' : 'primary';

  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + space.sm }]}>
      <Animated.View
        key={toast.id}
        accessibilityLiveRegion="polite"
        entering={reduceMotion ? undefined : SlideInUp.duration(220)}
        exiting={reduceMotion ? undefined : FadeOut.duration(160)}
        style={[styles.toast, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Icon name={toast.icon ?? defaultIcons[toast.tone]} size="md" color={iconColor} />
        <Text variant="labelStrong" numberOfLines={2} style={styles.label}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.gutter,
    right: space.gutter,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    maxWidth: '100%',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  label: {
    flexShrink: 1,
  },
});
