import { create } from 'zustand';

import { preferences, storageKeys } from '@/lib/storage';

import { env, type ApiMode } from './env';

export type { ApiMode };

/**
 * The active data source. The transport layer reads it synchronously through
 * `getApiMode()`, while the UI subscribes through `useRuntimeConfig`.
 *
 * Demo mode is always explicit: a banner is rendered app-wide and every
 * mutating screen states that nothing was persisted on a server.
 */
let currentApiMode: ApiMode = env.defaultApiMode;

export function getApiMode(): ApiMode {
  return currentApiMode;
}

export function isDemoMode(): boolean {
  return currentApiMode === 'demo';
}

type RuntimeConfigState = {
  apiMode: ApiMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setApiMode: (mode: ApiMode) => Promise<void>;
};

export const useRuntimeConfig = create<RuntimeConfigState>((set) => ({
  apiMode: env.defaultApiMode,
  hydrated: false,

  hydrate: async () => {
    if (!env.allowModeSwitch) {
      currentApiMode = env.defaultApiMode;
      set({ apiMode: env.defaultApiMode, hydrated: true });
      return;
    }
    const stored = await preferences.getString(storageKeys.apiMode);
    const mode: ApiMode = stored === 'live' || stored === 'demo' ? stored : env.defaultApiMode;
    currentApiMode = mode;
    set({ apiMode: mode, hydrated: true });
  },

  setApiMode: async (mode) => {
    if (!env.allowModeSwitch) return;
    currentApiMode = mode;
    await preferences.setString(storageKeys.apiMode, mode);
    set({ apiMode: mode });
  },
}));
