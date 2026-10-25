import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable function that calls `callback` once calls have stopped
 * for `delay` ms. Used to push search text to the URL while typing.
 */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delay = 400) {
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(callback);

  // Always call the newest callback (it may close over fresh state).
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return useCallback(
    (...args: Args) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => latest.current(...args), delay);
    },
    [delay],
  );
}
