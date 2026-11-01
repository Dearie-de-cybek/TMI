import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Two storage tiers:
 *
 * - `secureStorage` — authentication credentials only. Backed by the iOS keychain
 *   and Android keystore. On web there is no equivalent, so it degrades to
 *   `AsyncStorage` and the caller is warned once; web builds are development aids,
 *   not a supported production target for signed-in members.
 * - `preferences`    — non-sensitive member preferences and caches.
 *
 * Nothing in here may be used for passwords. Passwords are sent to the API and
 * never persisted on the device.
 */

const SECURE_PREFIX = 'kh.secure.';
const PREF_PREFIX = 'kh.pref.';

let warnedAboutWebSecureStore = false;

function warnOnceAboutWeb() {
  if (Platform.OS === 'web' && !warnedAboutWebSecureStore) {
    warnedAboutWebSecureStore = true;
    console.warn(
      '[storage] expo-secure-store is unavailable on web; credentials fall back to AsyncStorage. ' +
        'Do not use a web build for production member sessions.'
    );
  }
}

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    const namespaced = SECURE_PREFIX + key;
    if (Platform.OS === 'web') {
      warnOnceAboutWeb();
      return AsyncStorage.getItem(namespaced);
    }
    try {
      return await SecureStore.getItemAsync(namespaced);
    } catch {
      // A corrupt keychain entry must never block app start.
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    const namespaced = SECURE_PREFIX + key;
    if (Platform.OS === 'web') {
      warnOnceAboutWeb();
      await AsyncStorage.setItem(namespaced, value);
      return;
    }
    await SecureStore.setItemAsync(namespaced, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async remove(key: string): Promise<void> {
    const namespaced = SECURE_PREFIX + key;
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(namespaced);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(namespaced);
    } catch {
      // Nothing to delete.
    }
  },
};

export const preferences = {
  async getString(key: string): Promise<string | null> {
    return AsyncStorage.getItem(PREF_PREFIX + key);
  },

  async setString(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(PREF_PREFIX + key, value);
  },

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(PREF_PREFIX + key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      await AsyncStorage.removeItem(PREF_PREFIX + key);
      return null;
    }
  },

  async setJson(key: string, value: unknown): Promise<void> {
    await AsyncStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(PREF_PREFIX + key);
  },

  async removeByPrefix(prefix: string): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const matching = keys.filter((key) => key.startsWith(PREF_PREFIX + prefix));
    if (matching.length > 0) {
      await AsyncStorage.multiRemove(matching);
    }
  },
};

export const storageKeys = {
  authToken: 'auth.token',
  authMember: 'auth.member',
  appearance: 'appearance',
  textScale: 'text-scale',
  reduceMotion: 'reduce-motion',
  apiMode: 'api-mode',
  onboardingSeen: 'onboarding.seen',
  recentSearches: 'search.recent',
  notificationsPrompted: 'notifications.prompted',
  playbackPositions: 'playback.positions',
  devotionProgress: 'devotion.progress',
  likes: 'likes',
  prayerReminder: 'devotion.reminder',
  demoState: 'demo.state',
} as const;
