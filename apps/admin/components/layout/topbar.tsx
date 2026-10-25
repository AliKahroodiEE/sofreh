"use client";

import { LogOut, Menu } from "lucide-react";
import type { AuthUser } from "@/lib/api/types";
import { formatFullDate, formatPhone } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveIndicator } from "./live-indicator";

interface TopbarProps {
  user: AuthUser | null;
  onOpenMenu: () => void;
  onLogout: () => void;
}

export function Topbar({ user, onOpenMenu, onLogout }: TopbarProps) {
  const now = useNow(60_000);
  const initials = (user?.name ?? "مدیر").trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("‌");

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="-ms-1 grid size-10 cursor-pointer place-items-center rounded-xl text-stone-600 hover:bg-stone-100 lg:hidden"
          aria-label="باز کردن منو"
        >
          <Menu className="size-5" />
        </button>

        <p className="hidden text-sm text-stone-500 sm:block">{now ? formatFullDate(now) : " "}</p>

        <div className="ms-auto flex items-center gap-2 sm:gap-3">
          <LiveIndicator className="hidden sm:inline-flex" />
          <div className="mx-1 hidden h-8 w-px bg-stone-200 sm:block" />
          {user ? (
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-sm">
                {initials}
              </span>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-semibold text-stone-800">{user.name ?? "مدیر سامانه"}</div>
                <div className="tabular text-[11px] text-stone-500" dir="ltr">
                  {formatPhone(user.phone)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="hidden h-8 w-24 sm:block" />
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="grid size-10 cursor-pointer place-items-center rounded-xl text-stone-500 transition hover:bg-brand-50 hover:text-brand-700"
            aria-label="خروج از حساب"
            title="خروج"
          >
            <LogOut className="size-[18px] -scale-x-100" />
          </button>
        </div>
      </div>
    </header>
  );
}
