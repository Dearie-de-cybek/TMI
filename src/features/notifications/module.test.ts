import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  loadNotifications,
  pushEnvironment,
  pushUnavailableReason,
  resetNotificationModuleCache,
} from './module';

// Read when `isRunningInExpoGo()` is called, long after the module graph loads,
// so flipping it between tests is safe. `jest.mock` is hoisted above the imports.
let mockRunningInExpoGo = false;

jest.mock('expo', () => ({
  isRunningInExpoGo: () => mockRunningInExpoGo,
}));

/**
 * Regression tests for the crash that took the whole app down in Expo Go.
 *
 * `expo-notifications` evaluates `requireNativeModule('ExpoTopicSubscriptionModule')`
 * at module scope, so importing it anywhere in the root layout's import graph
 * throws before a single component renders. These tests pin both halves of the
 * fix: the lazy loader degrades to null, and no other file imports the package
 * for its value.
 */

beforeEach(() => {
  mockRunningInExpoGo = false;
  resetNotificationModuleCache();
});

describe('loadNotifications', () => {
  it('returns null in Expo Go instead of throwing', () => {
    mockRunningInExpoGo = true;
    expect(loadNotifications()).toBeNull();
    expect(pushEnvironment()).toBe('expo_go');
  });

  it('explains why push is unavailable in each runtime', () => {
    expect(pushUnavailableReason('expo_go')).toContain('development build');
    expect(pushUnavailableReason('web')).toContain('web version');
    expect(pushUnavailableReason('unavailable')).toContain('Rebuild');
    expect(pushUnavailableReason('supported')).toBe('');
  });

  it('caches the outcome so the require is attempted once', () => {
    mockRunningInExpoGo = true;
    const first = loadNotifications();
    mockRunningInExpoGo = false;
    expect(loadNotifications()).toBe(first);
  });
});

describe('import graph', () => {
  const sourceRoot = join(__dirname, '..', '..');

  function walk(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return walk(path);
      return /\.tsx?$/.test(entry.name) ? [path] : [];
    });
  }

  it('never imports expo-notifications for its value outside the lazy loader', () => {
    const offenders = walk(sourceRoot).filter((path) => {
      if (path.endsWith(join('features', 'notifications', 'module.ts'))) return false;
      if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;

      const source = readFileSync(path, 'utf8');
      return source
        .split('\n')
        .some(
          (line) =>
            /from ['"]expo-notifications['"]/.test(line) &&
            // `import type` is erased at build time and cannot throw.
            !/^\s*import\s+type\b/.test(line)
        );
    });

    expect(offenders).toEqual([]);
  });
});
