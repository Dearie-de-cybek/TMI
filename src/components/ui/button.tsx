import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/design/theme';
import { radius, space, type ColorToken } from '@/design/tokens';

import { Icon, type IconName } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse' | 'brand' | 'light' | 'glass' | 'ghostLight';
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

const heights: Record<ButtonSize, number> = { sm: 40, md: 52, lg: 58 };

/**
 * Buttons are full pills. `primary` is the single black action per screen;
 * `secondary` is a soft grey pill beside it; `ghost` is type only; `brand` is
 * the one place the maroon fills a button (a call to give or to join).
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
    primary: { backgroundColor: colors.ink },
    secondary: { backgroundColor: colors.surfaceMuted },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.danger },
    inverse: { backgroundColor: colors.surfaceInverse },
    brand: { backgroundColor: colors.primary },
    light: { backgroundColor: '#FFFFFF' },
    glass: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    ghostLight: { backgroundColor: 'transparent' },
  };

  const labelColor: Record<ButtonVariant, ColorToken> = {
    primary: 'onInk',
    secondary: 'text',
    ghost: 'primary',
    danger: 'textOnAccent',
    inverse: 'textOnInverse',
    brand: 'textOnAccent',
    light: 'onAccentFill',
    glass: 'textOnInverse',
    ghostLight: 'textOnInverse',
  };

  const resolvedLabelColor = labelColor[variant];
  const filled = variant !== 'secondary' && variant !== 'ghost' && variant !== 'glass' && variant !== 'ghostLight';

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      haptic={variant === 'primary' || variant === 'brand'}
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
          paddingHorizontal: variant === 'ghost' ? space.md : space.xxl,
          opacity: inactive ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={filled ? colors[resolvedLabelColor] : colors.primary}
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
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
