"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { refreshAccessToken } from "@/lib/api/client";
import type { AdminOrder, OrderCreatedEvent, OrderUpdatedEvent, Paginated } from "@/lib/api/types";
import { getSession } from "@/lib/auth/session";
import { API_ORIGIN } from "@/lib/config";
import { toman } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

/**
 * Live order updates over Socket.IO (namespace `/realtime`).
 *
 * The server pushes `order.created` (admins) and `order.updated`. Instead of
 * keeping a separate copy of the data, events are applied to the TanStack
 * Query cache, so every screen showing orders updates by itself.
 */

export type LiveStatus = "connecting" | "online" | "offline";

interface RealtimeValue {
  status: LiveStatus;
  /** Orders created since the page loaded (highlighted in the board). */
  freshOrderIds: ReadonlySet<number>;
  /** New orders the admin has not looked at yet (sidebar badge). */
  unseen: number;
  markSeen: () => void;
}

const RealtimeContext = createContext<RealtimeValue>({
  status: "offline",
  freshOrderIds: new Set(),
  unseen: 0,
  markSeen: () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

/** How long a new order stays highlighted. */
const FRESH_MS = 2 * 60_000;

/** A short, soft two-tone chime (Web Audio; silently skipped if blocked). */
function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.14;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    window.setTimeout(() => void ctx.close(), 1000);
  } catch {
    // Audio is optional.
  }
}

export function RealtimeProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [freshOrderIds, setFreshOrderIds] = useState<ReadonlySet<number>>(() => new Set());
  const [unseen, setUnseen] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let tokenUsed: string | undefined;
    let authRetries = 0;
    const timers = new Set<number>();

    const socket = io(`${API_ORIGIN}/realtime`, {
      // A function, so every (re)connect sends the latest access token.
      auth: (send) => {
        tokenUsed = getSession()?.accessToken;
        send({ token: tokenUsed ?? "" });
      },
    });

    socket.on("connect", () => {
      setStatus("online");
      // A connection that survives a few seconds was accepted: reset the auth retry budget.
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (socket.connected) authRetries = 0;
      }, 5000);
      timers.add(timer);
    });
    socket.on("connect_error", () => setStatus("offline"));
    socket.on("disconnect", (reason) => {
      setStatus(socket.active ? "connecting" : "offline");
      // The server verifies the token only at connection time and drops the
      // socket when it is expired: refresh it and reconnect (a few times).
      if (reason === "io server disconnect" && authRetries < 3) {
        authRetries += 1;
        void refreshAccessToken(tokenUsed).then((token) => {
          if (token) socket.connect();
        });
      }
    });

    socket.on("order.created", (event: OrderCreatedEvent) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orderLists });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statsAll });

      setFreshOrderIds((ids) => new Set(ids).add(event.id));
      setUnseen((count) => count + 1);
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        setFreshOrderIds((ids) => {
          const next = new Set(ids);
          next.delete(event.id);
          return next;
        });
      }, FRESH_MS);
      timers.add(timer);

      chime();
      toast.success("سفارش جدید", {
        description: `${event.code} · ${toman(event.total)}`,
        action: { label: "مشاهده", onClick: () => router.push(`/orders?order=${event.id}`) },
        duration: 8000,
      });
    });

    socket.on("order.updated", (event: OrderUpdatedEvent) => {
      // Patch the row in every cached order list…
      queryClient.setQueriesData<Paginated<AdminOrder>>({ queryKey: queryKeys.orderLists }, (page) =>
        page
          ? {
              ...page,
              items: page.items.map((order) =>
                order.id === event.id
                  ? { ...order, status: event.status, isPaid: event.isPaid, updatedAt: event.updatedAt }
                  : order,
              ),
            }
          : page,
      );
      // …mark lists stale (filtered tabs refetch when visited) and refresh details and counts.
      void queryClient.invalidateQueries({ queryKey: queryKeys.orderLists, refetchType: "none" });
      void queryClient.invalidateQueries({ queryKey: queryKeys.order(event.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statsAll });
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [enabled, queryClient, router]);

  const markSeen = useCallback(() => setUnseen(0), []);

  const value = useMemo<RealtimeValue>(
    () => ({ status: enabled ? status : "offline", freshOrderIds, unseen, markSeen }),
    [enabled, status, freshOrderIds, unseen, markSeen],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
