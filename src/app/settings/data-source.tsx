import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { resetDemoState } from '@/api/demo/state';
import { AuthShell } from '@/components/app/auth-shell';
import { useToast } from '@/components/app/toast';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { env } from '@/config/env';
import { useRuntimeConfig, type ApiMode } from '@/config/runtime';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { useAuth } from '@/features/auth/store';

const modes: { value: ApiMode; label: string; hint: string }[] = [
  {
    value: 'demo',
    label: 'Demo data',
    hint: 'Runs against the bundled development provider. Nothing is saved on a server and no payments are taken.',
  },
  {
    value: 'live',
    label: 'Church server',
    hint: 'Talks to the Laravel API. Real accounts, real course access, real payments.',
  },
];

/**
 * Development-only switch between the demo provider and the live API.
 *
 * Hidden unless `EXPO_PUBLIC_ALLOW_MODE_SWITCH` is on, and switching signs the
 * member out, because a token from one source is meaningless to the other.
 */
export default function DataSourceScreen() {
  const router = useRouter();
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const apiMode = useRuntimeConfig((state) => state.apiMode);
  const setApiMode = useRuntimeConfig((state) => state.setApiMode);
  const signOut = useAuth((state) => state.signOut);
  const [busy, setBusy] = useState(false);

  if (!env.allowModeSwitch) {
    return (
      <AuthShell
        title="Data source"
        description="This build is locked to one data source."
      >
        <Banner
          tone="info"
          message={`The app is using ${apiMode === 'demo' ? 'bundled demo data' : env.apiUrl}.`}
        />
        <Button label="Back" variant="secondary" fullWidth onPress={() => router.back()} />
      </AuthShell>
    );
  }

  async function switchTo(mode: ApiMode) {
    if (mode === apiMode) return;
    setBusy(true);
    try {
      await signOut({ revokeOnServer: false });
      await setApiMode(mode);
      queryClient.clear();
      toast(mode === 'demo' ? 'Now using demo data.' : 'Now using the church server.', {
        icon: 'refresh-cw',
      });
      router.replace('/');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Data source"
      description="Development setting. It decides where every request in the app goes."
    >
      {modes.map((mode) => {
        const selected = apiMode === mode.value;
        return (
          <Pressable
            key={mode.value}
            onPress={() => void switchTo(mode.value)}
            disabled={busy}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${mode.label}. ${mode.hint}`}
            feedback="none"
            style={[
              styles.option,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primarySoft : 'transparent',
              },
            ]}
          >
            <View style={styles.optionText}>
              <Text variant="bodyStrong" color={selected ? 'primaryOnSoft' : 'text'}>
                {mode.label}
              </Text>
              <Text variant="caption" color={selected ? 'primaryOnSoft' : 'textSecondary'}>
                {mode.hint}
              </Text>
              {mode.value === 'live' ? (
                <Text variant="caption" color="textTertiary">
                  {env.apiUrl}
                </Text>
              ) : null}
            </View>
            {selected ? <Icon name="check" size="sm" color="primaryOnSoft" /> : null}
          </Pressable>
        );
      })}

      <Banner
        tone="warning"
        icon="alert-triangle"
        message="Switching signs you out: a token issued by one source means nothing to the other."
      />

      {apiMode === 'demo' ? (
        <Button
          label="Reset demo data"
          variant="secondary"
          icon="refresh-cw"
          fullWidth
          onPress={() =>
            Alert.alert(
              'Reset demo data?',
              'Saved sermons, enrolments, prayer requests and demo gifts created on this device will be cleared.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    void resetDemoState().then(() => {
                      queryClient.clear();
                      toast('Demo data reset.', { icon: 'refresh-cw' });
                    });
                  },
                },
              ]
            )
          }
        />
      ) : null}

      <Text variant="caption" color="textTertiary">
        Set EXPO_PUBLIC_ALLOW_MODE_SWITCH=0 for production builds so this screen cannot be reached.
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
});
