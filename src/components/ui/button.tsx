import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/design/theme';
import { radius, space, type ColorToken } from '@/design/tokens';

import { Icon, type IconName } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'leading' | 'trailing';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
};

const heights: Record<ButtonSize, number> = { sm: 38, md: 46, lg: 52 };

/**
 * Buttons are rectangular with a 4pt corner — the app has no pill-shaped
 * controls. `primary` is the single filled treatment per screen; supporting
 * actions use `secondary` (hairline) or `ghost` (type only).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'leading',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const colors = useColors();
  const inactive = disabled || loading;

  const surface: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.primary },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.borderStrong,
    },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.danger },
    inverse: { backgroundColor: colors.surfaceInverse },
  };

  const labelColor: Record<ButtonVariant, ColorToken> = {
    primary: 'textOnAccent',
    secondary: 'text',
    ghost: 'primary',
    danger: 'textOnAccent',
    inverse: 'textOnInverse',
  };

  // The filled variants invert their label; in dark mode `primary` is a light
  // sage so the label has to switch back to ink for contrast.
  const resolvedLabelColor: ColorToken =
    variant === 'primary' || variant === 'danger' ? 'textOnAccent' : labelColor[variant];

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      haptic={variant === 'primary'}
      feedback="opacity"
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={[
        styles.base,
        surface[variant],
        {
          height: heights[size],
          paddingHorizontal: variant === 'ghost' ? space.sm : space.xl,
          opacity: inactive ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'danger' ? colors.textOnAccent : colors.primary
          }
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'leading' ? (
            <Icon name={icon} size="sm" color={resolvedLabelColor} />
          ) : null}
          <Text variant="labelStrong" color={resolvedLabelColor} numberOfLines={1}>
            {label}
          </Text>
          {icon && iconPosition === 'trailing' ? (
            <Icon name={icon} size="sm" color={resolvedLabelColor} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
