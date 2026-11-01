import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { env } from '@/config/env';
import { useRuntimeConfig } from '@/config/runtime';
import { useColors } from '@/design/theme';
import { hairline, space } from '@/design/tokens';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useIsOffline } from '@/lib/network';

/**
 * App-wide status strip.
 *
 * Two things must be visible on every screen rather than discovered later:
 * that the app is showing development data, and that it is offline. Both sit in
 * a single strip at the very top so nothing below has to make room for them.
 */
export function NoticeStrip() {
  const colors = useColors();
  const router = useRouter();
  const apiMode = useRuntimeConfig((state) => state.apiMode);
  const offline = useIsOffline();

  if (apiMode === 'demo') {
    return (
      <Pressable
        onPress={env.allowModeSwitch ? () => router.push('/settings/data-source') : undefined}
        accessibilityRole={env.allowModeSwitch ? 'button' : 'summary'}
        accessibilityLabel="Demo data. Nothing is saved to the church server."
        feedback={env.allowModeSwitch ? 'opacity' : 'none'}
        inline
        style={[styles.strip, { backgroundColor: colors.accentSoft, borderBottomColor: colors.border }]}
      >
        <Icon name="tool" size="xs" color="accentOnSoft" />
        <Text variant="caption" color="accentOnSoft" style={styles.label} numberOfLines={1}>
          Demo data: nothing here is saved to the church server
          {offline ? ' · offline' : ''}
        </Text>
        {env.allowModeSwitch ? <Icon name="chevron-right" size="xs" color="accentOnSoft" /> : null}
      </Pressable>
    );
  }

  if (offline) {
    return (
      <View
        accessibilityRole="alert"
        style={[styles.strip, { backgroundColor: colors.warningSoft, borderBottomColor: colors.border }]}
      >
        <Icon name="wifi-off" size="xs" color="warningOnSoft" />
        <Text variant="caption" color="warningOnSoft" style={styles.label} numberOfLines={1}>
          You are offline. Saved content is still available.
        </Text>
      </View>
    );
  }

  return null;
}

/** True when the strip is showing, so the shell can zero the top safe-area inset. */
export function useNoticeStripVisible(): boolean {
  const apiMode = useRuntimeConfig((state) => state.apiMode);
  const offline = useIsOffline();
  return apiMode === 'demo' || offline;
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.gutter,
    paddingVertical: space.sm,
    borderBottomWidth: hairline,
    minHeight: 0,
  },
  label: {
    flex: 1,
  },
});
