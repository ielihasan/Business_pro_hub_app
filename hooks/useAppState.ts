import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppState(
  onForeground?: () => void,
  onBackground?: () => void,
) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const onFgRef = useRef(onForeground);
  const onBgRef = useRef(onBackground);

  // Keep refs current without re-subscribing AppState on every render
  useEffect(() => { onFgRef.current = onForeground; }, [onForeground]);
  useEffect(() => { onBgRef.current = onBackground; }, [onBackground]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (prev.match(/inactive|background/) && next === 'active') {
        onFgRef.current?.();
      } else if (prev === 'active' && next.match(/inactive|background/)) {
        onBgRef.current?.();
      }
    });
    return () => sub.remove();
  }, []);
}
