"use client";

import { useSyncExternalStore } from "react";
import type { AuthTokens, AuthUser } from "@/lib/api/types";

/**
 * The admin session (token pair + user) lives in localStorage so it survives
 * reloads and is shared by all tabs. Components read it through
 * `useSession()`, a `useSyncExternalStore` subscription, so every tab reacts
 * to logins, token rotations and logouts made anywhere.
 */

export interface Session extends AuthTokens {
  user: AuthUser;
}

/** Why the last session ended; lets the login screen explain an expiry. */
export type EndReason = "logout" | "expired" | "forbidden";

const STORAGE_KEY = "sofreh.admin.session";
const listeners = new Set<() => void>();

let cache: { raw: string | null; session: Session | null } = { raw: null, session: null };
let endReason: EndReason | null = null;

function parse(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Session>;
    return value.accessToken && value.refreshToken && value.user ? (value as Session) : null;
  } catch {
    return null;
  }
}

/** Current session, or null. Returns the same object until the stored value changes. */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (privacy mode); treat as logged out.
  }
  if (raw !== cache.raw) cache = { raw, session: parse(raw) };
  return cache.session;
}

function write(session: Session | null) {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore quota / privacy errors
  }
  listeners.forEach((notify) => notify());
}

export function startSession(session: Session) {
  endReason = null;
  write(session);
}

/** Store a rotated token pair, keeping the user. */
export function updateTokens(tokens: AuthTokens) {
  const current = getSession();
  if (current) write({ ...current, ...tokens });
}

export function updateUser(user: AuthUser) {
  const current = getSession();
  if (current) write({ ...current, user });
}

export function endSession(reason: EndReason = "logout") {
  endReason = reason;
  write(null);
}

/** Read (once) why the last session ended. */
export function consumeEndReason(): EndReason | null {
  const reason = endReason;
  endReason = null;
  return reason;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Other tabs write to the same key: keep this tab in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Reactive session. Always null during server rendering and hydration. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

const noopSubscribe = () => () => {};

/** False on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
