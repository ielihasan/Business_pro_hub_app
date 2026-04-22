import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Runs fetchFn immediately, then on a fixed interval.
 * Automatically pauses when the app goes to background and resumes
 * (with an immediate fetch) when it comes back to the foreground.
 */
export function useSmartPolling(
  fetchFn: () => Promise<void> | void,
  intervalMs: number,
) {
  // Store the latest fetchFn in a ref so we never need to re-subscribe
  const fetchRef = useRef(fetchFn);
  useEffect(() => { fetchRef.current = fetchFn; }, [fetchFn]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer !== null) return;
      fetchRef.current();
      timer = setInterval(() => fetchRef.current(), intervalMs);
    };

    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    start();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });

    return () => {
      stop();
      sub.remove();
    };
  // intervalMs is intentionally the only dep — fetchFn is tracked via ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);
}
