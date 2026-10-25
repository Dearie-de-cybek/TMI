import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AccessibilityInfo, useColorScheme as useSystemColorScheme } from 'react-native';

import { preferences, storageKeys } from '@/lib/storage';

import { colors, type ColorScheme, type ThemeColors } from './tokens';

export type AppearancePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  scheme: ColorScheme;
  colors: ThemeColors;
  appearance: AppearancePreference;
  setAppearance: (value: AppearancePreference) => void;
  /** True when the OS reduce-motion setting is on, or the member turned motion off. */
  reduceMotion: boolean;
  setReduceMotionOverride: (value: boolean | null) => void;
  reduceMotionOverride: boolean | null;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useSystemColorScheme();
  const [appearance, setAppearanceState] = useState<AppearancePreference>('system');
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const [reduceMotionOverride, setReduceMotionOverrideState] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedAppearance, storedMotion] = await Promise.all([
        preferences.getString(storageKeys.appearance),
        preferences.getString(storageKeys.reduceMotion),
      ]);
      if (cancelled) return;
      if (storedAppearance === 'light' || storedAppearance === 'dark') {
        setAppearanceState(storedAppearance);
      }
      if (storedMotion === 'on') setReduceMotionOverrideState(true);
      if (storedMotion === 'off') setReduceMotionOverrideState(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setSystemReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduceMotion
    );
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const setAppearance = useCallback((value: AppearancePreference) => {
    setAppearanceState(value);
    void preferences.setString(storageKeys.appearance, value);
  }, []);

  const setReduceMotionOverride = useCallback((value: boolean | null) => {
    setReduceMotionOverrideState(value);
    void preferences.setString(
      storageKeys.reduceMotion,
      value === null ? 'system' : value ? 'on' : 'off'
    );
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: ColorScheme =
      appearance === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : appearance;
    return {
      scheme,
      colors: colors[scheme],
      appearance,
      setAppearance,
      reduceMotion: reduceMotionOverride ?? systemReduceMotion,
      reduceMotionOverride,
      setReduceMotionOverride,
    };
  }, [
    appearance,
    reduceMotionOverride,
    setAppearance,
    setReduceMotionOverride,
    systemReduceMotion,
    systemScheme,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}

/** Shorthand for the common case of only needing colours. */
export function useColors(): ThemeColors {
  return useTheme().colors;
}
