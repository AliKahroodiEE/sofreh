import { useSyncExternalStore } from "react";

/**
 * Current time (ms) that re-renders subscribers every `interval` ms.
 * Used for "۵ دقیقه پیش" labels and countdowns without calling Date.now()
 * during render. One shared timer per interval, running only while used.
 */

interface Clock {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => number;
}

const clocks = new Map<number, Clock>();

function createClock(interval: number): Clock {
  let now = Date.now();
  let timer: number | undefined;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (timer === undefined) {
        now = Date.now();
        timer = window.setInterval(() => {
          now = Date.now();
          listeners.forEach((notify) => notify());
        }, interval);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && timer !== undefined) {
          window.clearInterval(timer);
          timer = undefined;
        }
      };
    },
    getSnapshot: () => now,
  };
}

function getClock(interval: number): Clock {
  let clock = clocks.get(interval);
  if (!clock) {
    clock = createClock(interval);
    clocks.set(interval, clock);
  }
  return clock;
}

const serverSnapshot = () => 0;

/** Returns 0 during server rendering; callers should treat 0 as "unknown". */
export function useNow(interval = 30_000): number {
  const clock = getClock(interval);
  return useSyncExternalStore(clock.subscribe, clock.getSnapshot, serverSnapshot);
}
