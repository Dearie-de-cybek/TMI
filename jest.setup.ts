/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    isAvailableAsync: async () => true,
    getItemAsync: async (key: string) => store.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => {
      store.set(key, value);
    },
    deleteItemAsync: async (key: string) => {
      store.delete(key);
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

/**
 * The real icon set loads a font file through the asset registry, which does not
 * exist under Jest. Rendering a plain view keeps accessibility labels and tree
 * structure intact without the font.
 */
jest.mock('@expo/vector-icons/Feather', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ name }: { name: string }) =>
      React.createElement(View, { testID: `icon-${name}` }),
    glyphMap: {},
  };
});
