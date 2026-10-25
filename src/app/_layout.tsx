import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { createQueryClient } from '@/api/query-client';
import { NoticeStrip, useNoticeStripVisible } from '@/components/app/notices';
import { ToastHost } from '@/components/app/toast';
import { useRuntimeConfig } from '@/config/runtime';
import { ThemeProvider, useTheme } from '@/design/theme';
import { installUnauthorizedHandler, useAuth } from '@/features/auth/store';
import { useNotificationRouting } from '@/features/notifications/use-notification-routing';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);

  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const authStatus = useAuth((state) => state.status);
  const restore = useAuth((state) => state.restore);
  const hydrateConfig = useRuntimeConfig((state) => state.hydrate);
  const configHydrated = useRuntimeConfig((state) => state.hydrated);

  useEffect(() => {
    // The data source must be resolved before the first request goes out.
    void hydrateConfig().then(() => restore());
  }, [hydrateConfig, restore]);

  // A font failure should not block the app — the system face is an acceptable
  // fallback, and `fontError` is surfaced in development by expo-font itself.
  const ready = (fontsLoaded || Boolean(fontError)) && configHydrated && authStatus !== 'restoring';

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppShell />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stripVisible = useNoticeStripVisible();
  const onboardingSeen = useAuth((state) => state.onboardingSeen);

  useNotificationRouting();

  useEffect(() => {
    // One place handles an expired session: sign out, then say why.
    return installUnauthorizedHandler(() => {
      router.replace('/sign-in?reason=expired');
    });
  }, [router]);

  useEffect(() => {
    // First launch only. Members can reach public content from the welcome
    // screen without signing in, so this is an introduction, not a gate.
    if (!onboardingSeen) router.replace('/welcome');
  }, [onboardingSeen, router]);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right' as const,
    }),
    [colors.background]
  );

  // The notice strip occupies the status-bar area, so screens below it must not
  // add the top inset a second time.
  const childInsets = useMemo(
    () => (stripVisible ? { ...insets, top: 0 } : insets),
    [insets, stripVisible]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: stripVisible ? insets.top : 0 }}>
        <NoticeStrip />
      </View>
      <SafeAreaInsetsContext.Provider value={childInsets}>
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="sign-in" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="sign-up" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <ToastHost />
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
