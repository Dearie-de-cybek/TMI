import { Modal, StyleSheet, View } from 'react-native';
import { create } from 'zustand';

import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Eyebrow, Text } from './text';

/**
 * The app's own dialogs.
 *
 * `Alert.alert` hands the most consequential moments in the app — signing out,
 * withdrawing a prayer request, asking for an account to be deleted — to a
 * system control that knows nothing about this church. These are ours: the
 * serif title, the gold eyebrow, the purple buttons.
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
  };
}

export function DialogHost() {
  const colors = useColors();
  const request = useDialogStore((state) => state.request);
  const close = useDialogStore((state) => state.close);

  return (
    <Modal
      visible={request !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Android back dismisses as a cancel, like tapping outside would.
      onRequestClose={() => close(false)}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        {request ? (
          <View
            accessibilityViewIsModal
            accessibilityRole="alert"
            style={[styles.card, { backgroundColor: colors.surface }]}
          >
            {request.icon ? (
              <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
                <Icon
                  name={request.icon}
                  size="md"
                  color={request.destructive ? 'danger' : 'primaryOnSoft'}
                />
              </View>
            ) : null}

            {request.eyebrow ? <Eyebrow>{request.eyebrow}</Eyebrow> : null}

            <Text variant="title" style={styles.title}>
              {request.title}
            </Text>

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
        ) : null}
      </View>
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
    padding: space.xxl,
    borderRadius: radius.lg,
    gap: space.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  title: {
    marginBottom: space.xxs,
  },
  actions: {
    paddingTop: space.lg,
    gap: space.sm,
  },
});
