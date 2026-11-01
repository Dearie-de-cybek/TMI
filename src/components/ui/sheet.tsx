import { type PropsWithChildren } from 'react';
import { Modal, Pressable as RNPressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/design/theme';
import { hairline, radius, space } from '@/design/tokens';

import { Icon } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

/**
 * Bottom sheet for filters and short choices.
 *
 * Built on the platform modal so the hardware back button and the screen reader
 * behave correctly, with a visible close control rather than a gesture only.
 */
export function Sheet({
  visible,
  onClose,
  title,
  description,
  children,
  footer,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
}>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <RNPressable
          style={styles.dismissArea}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + space.lg },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerText}>
              <Text variant="headline">{title}</Text>
              {description ? (
                <Text variant="meta" color="textSecondary">
                  {description}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              feedback="opacity"
              style={styles.close}
            >
              <Icon name="x" size="md" color="text" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginTop: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    paddingBottom: space.lg,
    borderBottomWidth: hairline,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  close: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
    gap: space.xl,
  },
  footer: {
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
  },
});
