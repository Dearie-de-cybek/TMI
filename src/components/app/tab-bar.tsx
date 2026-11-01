import Ionicons from '@expo/vector-icons/Ionicons';
import { type BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { hairline, space } from '@/design/tokens';

/**
 * The primary destinations.
 *
 * The active one is a solid, filled icon with a bold label; the others are
 * outlines in grey. Nothing else marks the difference — no underline, no pill —
 * so the bar stays quiet and the content above it does the talking.
 */
type IoniconName = keyof typeof Ionicons.glyphMap;

const icons: Record<string, { filled: IoniconName; outline: IoniconName; label: string }> = {
  index: { filled: 'home', outline: 'home-outline', label: 'Home' },
  discover: { filled: 'compass', outline: 'compass-outline', label: 'Discover' },
  community: { filled: 'people', outline: 'people-outline', label: 'Community' },
  give: { filled: 'heart', outline: 'heart-outline', label: 'Give' },
  profile: { filled: 'person', outline: 'person-outline', label: 'Me' },
};

export const TAB_BAR_HEIGHT = 64;

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
        // Screens hidden from the bar (`href: null`) stay reachable by route.
        if ((descriptor?.options as { href?: string | null } | undefined)?.href === null) return null;

        const focused = state.index === index;
        const config = icons[route.name] ?? {
          filled: 'ellipse' as IoniconName,
          outline: 'ellipse-outline' as IoniconName,
          label: route.name,
        };
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
            <Ionicons
              name={focused ? config.filled : config.outline}
              size={26}
              color={focused ? colors.text : colors.textTertiary}
            />
            <Text
              variant="tab"
              color={focused ? 'text' : 'textTertiary'}
              style={focused ? styles.activeLabel : undefined}
              numberOfLines={1}
            >
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
    paddingTop: space.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    minHeight: TAB_BAR_HEIGHT - space.sm,
  },
  activeLabel: {
    fontWeight: '700',
  },
});
