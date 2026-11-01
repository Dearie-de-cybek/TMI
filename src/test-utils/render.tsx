import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design/theme';

/**
 * Test render that mounts the providers every screen and primitive expects.
 *
 * React Native Testing Library 14 is asynchronous - `render` and `fireEvent`
 * both return promises - so call sites await this. Query retries are off so a
 * failing request surfaces immediately in assertions.
 */
const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export async function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & { queryClient?: QueryClient } = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  const result = await render(ui, { wrapper: Wrapper, ...renderOptions });
  return { queryClient, ...result };
}
