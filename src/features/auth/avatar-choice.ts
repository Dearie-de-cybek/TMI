import { create } from 'zustand';

import { preferences, storageKeys } from '@/lib/storage';

/**
 * The default avatar a member picked, kept on the device. A photograph they
 * upload replaces it (the choice is cleared when that succeeds), and picking a
 * default again replaces the photograph on this device.
 */
type AvatarChoiceState = {
  choice: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  set: (key: string | null) => void;
};

export const useAvatarChoice = create<AvatarChoiceState>((set, get) => ({
  choice: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const stored = await preferences.getString(storageKeys.avatarChoice);
    set({ choice: stored && stored.length > 0 ? stored : null, hydrated: true });
  },

  set: (key) => {
    set({ choice: key });
    if (key) void preferences.setString(storageKeys.avatarChoice, key);
    else void preferences.remove(storageKeys.avatarChoice);
  },
}));
