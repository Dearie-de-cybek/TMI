import { type PropsWithChildren, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/design/theme';
import { hairline, space } from '@/design/tokens';

type ScreenProps = PropsWithChildren<{
  /** Adds the standard horizontal page gutter. */
  padded?: boolean;
  /** Pads for the status bar. Screens with their own header handle this themselves. */
  topInset?: boolean;
  /** Pads for the home indicator / nav bar. */
  bottomInset?: boolean;
  background?: 'background' | 'surface';
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({
  children,
  padded = false,
  topInset = false,
  bottomInset = false,
  background = 'background',
  style,
}: ScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.flex,
        { backgroundColor: colors[background] },
        padded && { paddingHorizontal: space.gutter },
        topInset && { paddingTop: insets.top },
        bottomInset && { paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type ScreenScrollProps = PropsWithChildren<
  Omit<ScrollViewProps, 'refreshControl'> & {
    padded?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    /** Extra bottom padding, e.g. for a docked player or action bar. */
    bottomSpace?: number;
    footer?: ReactNode;
  }
>;

export function ScreenScroll({
  children,
  padded = false,
  refreshing,
  onRefresh,
  bottomSpace = space.giant,
  contentContainerStyle,
  footer,
  ...rest
}: ScreenScrollProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.flex}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        padded && { paddingHorizontal: space.gutter },
        { paddingBottom: insets.bottom + bottomSpace },
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        ) : undefined
      }
      {...rest}
    >
      {children}
      {footer}
    </ScrollView>
  );
}

/**
 * Wraps forms so the keyboard never covers the focused field. On Android the
 * window soft-input mode already resizes the layout, so only iOS needs padding.
 */
export function KeyboardAware({ children }: PropsWithChildren) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

/** Hairline rule. The app uses these instead of card borders. */
export function Rule({
  inset = 0,
  style,
}: {
  inset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View
      style={[{ height: hairline, backgroundColor: colors.border, marginLeft: inset }, style]}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
