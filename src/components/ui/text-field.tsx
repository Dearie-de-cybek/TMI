import { forwardRef, useState, type ComponentRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useColors } from '@/design/theme';
import { minTouchTarget, space, typeScale } from '@/design/tokens';

import { Icon, type IconName } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Validation message. Its presence puts the field in the error state. */
  error?: string | null;
  /** Static guidance shown under the field when there is no error. */
  hint?: string;
  icon?: IconName;
  /** Renders the show/hide control and wires up secure entry. */
  secure?: boolean;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Inputs are underlined rather than boxed, which keeps forms quiet on parchment
 * and matches the hairline language used by the content rows.
 */
export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(function TextField(
  { label, error, hint, icon, secure = false, required = false, containerStyle, ...rest },
  ref
) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const underlineColor = error ? colors.danger : focused ? colors.primary : colors.borderStrong;

  return (
    <View style={containerStyle}>
      <Text variant="metaStrong" color={error ? 'danger' : 'textSecondary'}>
        {label}
        {required ? ' *' : ''}
      </Text>

      <View
        style={[
          styles.inputRow,
          { borderBottomColor: underlineColor, borderBottomWidth: focused || error ? 2 : 1 },
        ]}
      >
        {icon ? (
          <View style={styles.leadingIcon}>
            <Icon name={icon} size="sm" color={error ? 'danger' : 'textTertiary'} />
          </View>
        ) : null}

        <TextInput
          ref={ref}
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secure && !revealed}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          aria-invalid={Boolean(error)}
          {...rest}
        />

        {secure ? (
          <Pressable
            inline
            onPress={() => setRevealed((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            accessibilityState={{ checked: revealed }}
            style={styles.trailingAction}
          >
            <Icon name={revealed ? 'eye-off' : 'eye'} size="sm" color="textSecondary" />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color="danger" style={styles.helper} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textTertiary" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget,
    marginTop: space.xxs,
  },
  leadingIcon: {
    paddingRight: space.sm,
  },
  input: {
    flex: 1,
    ...typeScale.bodyLarge,
    paddingVertical: space.sm,
  },
  trailingAction: {
    paddingLeft: space.md,
    paddingVertical: space.sm,
    minHeight: 0,
  },
  helper: {
    marginTop: space.xs,
  },
});
