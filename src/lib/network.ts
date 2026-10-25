import { useNetworkState } from 'expo-network';

/**
 * Connectivity is treated as "probably offline" only when the platform says so
 * explicitly. An unknown state is treated as online, because blocking the UI on
 * an unreliable signal is worse than letting a request fail and showing a retry.
 */
export function useIsOffline(): boolean {
  const state = useNetworkState();
  if (state.isInternetReachable === false) return true;
  if (state.isConnected === false) return true;
  return false;
}
