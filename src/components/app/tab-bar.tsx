import { type BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { hairline, space } from '@/design/tokens';

/**
 * The five primary destinations.
 *
 * A custom bar rather than the platform default, because the app's identity
 * lives in its colour and type: parchment ground, hairline rule, forest for the
 * active destination and a short brass indicator above it.
 */
const icons: Record<string, { active: IconName; label: string }> = {
  index: { active: 'home', label: 'Home' },
  discover: { active: 'compass', label: 'Discover' },
  community: { active: 'users', label: 'Community' },
  give: { active: 'gift', label: 'Give' },
  profile: { active: 'user', label: 'Profile' },
};

export const TAB_BAR_HEIGHT = 56;

export function ChurchTabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, space.sm),
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const focused = state.index === index;
        const config = icons[route.name] ?? { active: 'circle' as IconName, label: route.name };
        const label =
          typeof descriptor?.options.title === 'string' ? descriptor.options.title : config.label;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            feedback="none"
            haptic={Platform.OS !== 'web'}
            onPress={() => navigateToTab(route.key)}
            style={styles.tab}
          >
            <View
              style={[
                styles.indicator,
                { backgroundColor: focused ? colors.accent : 'transparent' },
              ]}
            />
            <Icon name={config.active} size="md" color={focused ? 'primary' : 'textTertiary'} />
            <Text variant="tab" color={focused ? 'text' : 'textTertiary'} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: hairline,
    paddingTop: space.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 3,
    minHeight: TAB_BAR_HEIGHT,
    paddingTop: space.xs,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 2,
  },
});
