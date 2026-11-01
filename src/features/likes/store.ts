import { create } from 'zustand';

import { preferences, storageKeys } from '@/lib/storage';

/**
 * What the member has liked - verses, devotionals - kept on the device.
 *
 * There is no like count here on purpose: a count would be invented by the app,
 * and the backend does not provide one. When it does, the count belongs next to
 * this, not in its place.
 */
type LikesState = {
  ids: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (id: string) => boolean;
  reset: () => Promise<void>;
};

const MAX_LIKES = 500;

export const useLikes = create<LikesState>((set, get) => ({
  ids: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const stored = await preferences.getJson<string[]>(storageKeys.likes);
    set({ ids: Array.isArray(stored) ? stored : [], hydrated: true });
  },

  /** Returns whether the item is liked after the toggle. */
  toggle: (id) => {
    const current = get().ids;
    const liked = !current.includes(id);
    const ids = liked ? [id, ...current].slice(0, MAX_LIKES) : current.filter((item) => item !== id);
    set({ ids });
    void preferences.setJson(storageKeys.likes, ids);
    return liked;
  },

  reset: async () => {
    set({ ids: [], hydrated: true });
    await preferences.remove(storageKeys.likes);
  },
}));
