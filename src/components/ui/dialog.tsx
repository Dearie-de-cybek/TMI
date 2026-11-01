import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { create } from 'zustand';

import { useTheme } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Confetti } from './motion';
import { Eyebrow, Text } from './text';

/**
 * The app's own dialogs.
 *
 * `Alert.alert` hands the most consequential moments in the app — signing out,
 * withdrawing a prayer request, asking for an account to be deleted — to a
 * system control that knows nothing about this church. These are ours: a plum
 * header carrying the serif title, the gold eyebrow, the purple buttons, and a
 * spring when it arrives. Good news ("celebrate") arrives with confetti.
 *
 * The API stays as easy to call as the one it replaces:
 *
 *   const { confirm } = useDialog();
 *   if (await confirm({ title: 'Sign out?', confirmLabel: 'Sign out' })) { … }
 */
export type DialogRequest = {
  /** Small tracked label above the title. */
  eyebrow?: string;
  title: string;
  message?: string;
  icon?: IconName;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm action in the danger treatment. */
  destructive?: boolean;
  /** A single acknowledge button instead of confirm/cancel. */
  acknowledge?: boolean;
  /** Good news: gold header, confetti, a success haptic. */
  celebrate?: boolean;
};

type DialogState = {
  request: (DialogRequest & { id: number }) | null;
  resolve: ((confirmed: boolean) => void) | null;
  open: (request: DialogRequest) => Promise<boolean>;
  close: (confirmed: boolean) => void;
};

let nextId = 1;

export const useDialogStore = create<DialogState>((set, get) => ({
  request: null,
  resolve: null,

  open: (request) =>
    new Promise<boolean>((resolve) => {
      // A second dialog while one is open would strand the first promise.
      get().resolve?.(false);
      set({ request: { ...request, id: nextId++ }, resolve });
    }),

  close: (confirmed) => {
    get().resolve?.(confirmed);
    set({ request: null, resolve: null });
  },
}));

export function useDialog() {
  const open = useDialogStore((state) => state.open);

  return {
    /** Resolves true when the member confirms. */
    confirm: (request: DialogRequest) => open(request),
    /** Shows a single acknowledge button. Always resolves true. */
    notice: (request: Omit<DialogRequest, 'acknowledge' | 'destructive'>) =>
      open({ ...request, acknowledge: true }),
    /** Good news, with confetti. Always resolves true. */
    celebrate: (request: Omit<DialogRequest, 'acknowledge' | 'destructive' | 'celebrate'>) =>
      open({ ...request, acknowledge: true, celebrate: true, confirmLabel: request.confirmLabel ?? 'Amen' }),
  };
}

function defaultIcon(request: DialogRequest): IconName {
  if (request.celebrate) return 'award';
  if (request.destructive) return 'alert-triangle';
  if (request.acknowledge) return 'info';
  return 'help-circle';
}

export function DialogHost() {
  const { colors, reduceMotion } = useTheme();
  const request = useDialogStore((state) => state.request);
  const close = useDialogStore((state) => state.close);

  useEffect(() => {
    if (request?.celebrate && Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined
      );
    }
  }, [request]);

  // The church's own colours: deep purple, warming to gold. A destructive
  // confirmation turns clay so it cannot be mistaken for a routine one.
  const headerColors: [string, string, string] = request?.destructive
    ? [colors.dangerOnSoft, colors.danger, colors.danger]
    : ['#2A1342', '#4A2A5A', '#8A6A2A'];

  return (
    <Modal
      visible={request !== null}
      transparent
      animationType="none"
      statusBarTranslucent
      // Android back dismisses as a cancel, like tapping outside would.
      onRequestClose={() => close(false)}
    >
      <Animated.View
        key={request?.id}
        entering={reduceMotion ? undefined : FadeIn.duration(180)}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        {request?.celebrate ? <Confetti /> : null}
        {request ? (
          <Animated.View
            key={`card-${request.id}`}
            entering={reduceMotion ? undefined : SlideInDown.duration(260)}
            accessibilityViewIsModal
            accessibilityRole="alert"
            style={[styles.card, { backgroundColor: colors.surface }]}
          >
            <LinearGradient
              colors={headerColors}
              locations={[0, 0.65, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <Icon
                name={request.icon ?? defaultIcon(request)}
                size="xl"
                color={request.destructive ? 'textOnInverse' : 'accentFill'}
              />
              {request.eyebrow ? (
                <Eyebrow style={{ color: colors.accentFill }}>{request.eyebrow}</Eyebrow>
              ) : null}
              <Text style={[styles.title, { color: colors.textOnInverse }]}>{request.title}</Text>
            </LinearGradient>

            <View style={styles.body}>
              {request.message ? (
                <Text variant="body" color="textSecondary">
                  {request.message}
                </Text>
              ) : null}

              <View style={styles.actions}>
                {request.acknowledge ? (
                  <Button
                    label={request.confirmLabel ?? 'Close'}
                    fullWidth
                    onPress={() => close(true)}
                  />
                ) : (
                  <>
                    <Button
                      label={request.confirmLabel ?? 'Confirm'}
                      variant={request.destructive ? 'danger' : 'primary'}
                      fullWidth
                      onPress={() => close(true)}
                    />
                    <Button
                      label={request.cancelLabel ?? 'Cancel'}
                      variant="ghost"
                      fullWidth
                      onPress={() => close(false)}
                    />
                  </>
                )}
              </View>
            </View>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  header: {
    padding: space.xxl,
    gap: space.sm,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.5,
  },
  body: {
    padding: space.xxl,
    gap: space.sm,
  },
  actions: {
    paddingTop: space.sm,
    gap: space.sm,
  },
});
