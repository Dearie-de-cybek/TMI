import { useEffect, useRef, useState } from 'react';

/**
 * Debounces a value. Used for search input so a request is not fired for every
 * keystroke; the query layer cancels the previous request when a new one starts,
 * so a slow earlier response can never overwrite a newer one.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}

/** Runs an effect only after the first render — useful for "on change" saves. */
export function useUpdateEffect(effect: () => void | (() => void), deps: unknown[]): void {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Stable interval that does not restart when the callback identity changes. */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const timer = setInterval(() => latest.current(), delayMs);
    return () => clearInterval(timer);
  }, [delayMs]);
}
