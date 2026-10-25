"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/lib/api/endpoints";
import { consumeEndReason, endSession, getSession, updateUser, useHydrated, useSession } from "@/lib/auth/session";
import { queryKeys } from "@/lib/query-keys";
import { RealtimeProvider } from "@/lib/realtime";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Layout + auth guard for every page except /login.
 *
 * The shell (sidebar, top bar) is rendered immediately; page content renders
 * only once a session exists in the browser. Without one, the user is sent
 * to /login?next=<current path>.
 */
export function PanelShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const hydrated = useHydrated();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  // No session (never logged in, logged out, or refresh failed) → login.
  useEffect(() => {
    if (!hydrated || session) return;
    const reason = consumeEndReason();
    queryClient.clear();
    if (reason === "expired") toast.error("نشست شما منقضی شده است؛ دوباره وارد شوید.");
    if (reason === "forbidden") toast.error("این حساب دسترسی مدیریت ندارد.");
    const next = window.location.pathname + window.location.search;
    router.replace(reason === "logout" || next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
  }, [hydrated, session, queryClient, router]);

  // Re-check the profile on load: the role may have changed since login.
  const me = useQuery({ queryKey: queryKeys.me, queryFn: authApi.me, enabled: !!session, staleTime: 5 * 60_000 });
  useEffect(() => {
    if (!me.data) return;
    if (me.data.role !== "ADMIN") {
      endSession("forbidden");
      return;
    }
    const stored = getSession()?.user;
    if (stored && (stored.name !== me.data.name || stored.phone !== me.data.phone)) updateUser(me.data);
  }, [me.data]);

  async function logout() {
    const refreshToken = getSession()?.refreshToken;
    endSession("logout");
    toast.success("از حساب خود خارج شدید.");
    if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
  }

  const ready = hydrated && !!session;

  return (
    <RealtimeProvider enabled={ready}>
      <div className="min-h-dvh lg:pr-68">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Topbar user={session?.user ?? null} onOpenMenu={() => setMenuOpen(true)} onLogout={logout} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {ready ? children : <PageSkeleton />}
        </main>
      </div>
    </RealtimeProvider>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="در حال بارگذاری">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
