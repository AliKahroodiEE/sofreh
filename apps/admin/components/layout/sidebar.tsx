"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { API_ORIGIN } from "@/lib/config";
import { faNumber } from "@/lib/format";
import { useRealtime } from "@/lib/realtime";
import { isActivePath, NAV_ITEMS } from "./nav-items";
import { LiveIndicator } from "./live-indicator";

interface SidebarProps {
  /** Mobile drawer state; the desktop sidebar is always visible. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: fixed on the right (RTL start). */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-68 border-l border-stone-200/80 bg-white lg:flex">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      {/* Mobile: slide-in drawer. */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
          <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-72 max-w-[85vw] bg-white shadow-pop">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 left-4 grid size-9 cursor-pointer place-items-center rounded-xl text-stone-400 hover:bg-stone-100"
              aria-label="بستن منو"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex w-full flex-col">
      <div className="px-6 pt-6 pb-7">
        <Link href="/" onClick={onNavigate} aria-label="سفره، داشبورد">
          <Logo />
        </Link>
      </div>

      <div className="px-4">
        <p className="mb-2 px-3 text-[11px] font-semibold tracking-wide text-stone-400">منوی اصلی</p>
        {/* usePathname needs a Suspense boundary on dynamic routes (Cache Components). */}
        <Suspense fallback={<NavLinks pathname={null} onNavigate={onNavigate} />}>
          <ActiveNavLinks onNavigate={onNavigate} />
        </Suspense>
      </div>

      <div className="mt-auto space-y-3 p-4">
        <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-stone-50 to-saffron-50/60 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">به‌روزرسانی زنده</span>
            <LiveIndicator compact />
          </div>
          <p className="text-[11px] leading-5 text-stone-500">سفارش‌های جدید بدون رفرش صفحه نمایش داده می‌شوند.</p>
        </div>
        <a
          href={`${API_ORIGIN}/api/docs`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-stone-500 transition hover:bg-stone-50 hover:text-stone-800"
        >
          <BookOpen className="size-4" />
          مستندات API
        </a>
      </div>
    </div>
  );
}

function ActiveNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} onNavigate={onNavigate} />;
}

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate: () => void }) {
  const { unseen } = useRealtime();
  return (
    <nav className="flex flex-col gap-1" aria-label="منوی اصلی">
      {NAV_ITEMS.map(({ href, label, icon: Icon, liveBadge }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
            )}
          >
            {active && <span className="absolute inset-y-2 -right-4 w-1 rounded-l-full bg-brand-600" aria-hidden />}
            <Icon className={cn("size-[18px]", active ? "text-brand-600" : "text-stone-400 group-hover:text-stone-600")} />
            {label}
            {liveBadge && unseen > 0 && (
              <span className="tabular ms-auto min-w-5 rounded-full bg-brand-600 px-1.5 py-0.5 text-center text-[11px] font-bold text-white">
                {faNumber(unseen)}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
