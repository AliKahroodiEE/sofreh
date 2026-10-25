"use client";

import { cn } from "@/lib/cn";
import { useRealtime, type LiveStatus } from "@/lib/realtime";

const META: Record<LiveStatus, { label: string; dot: string; text: string }> = {
  online: { label: "زنده", dot: "bg-emerald-500", text: "text-emerald-700" },
  connecting: { label: "در حال اتصال", dot: "bg-saffron-500", text: "text-saffron-700" },
  offline: { label: "قطع", dot: "bg-stone-400", text: "text-stone-500" },
};

/** Socket.IO connection state as a small pill. */
export function LiveIndicator({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { status } = useRealtime();
  const meta = META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        !compact && "rounded-full border border-stone-200 bg-white px-2.5 py-1 shadow-card",
        meta.text,
        className,
      )}
      role="status"
      aria-label={`وضعیت اتصال زنده: ${meta.label}`}
    >
      <span className="relative flex size-2">
        {status === "online" && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", meta.dot)} />}
        <span className={cn("relative size-2 rounded-full", meta.dot)} />
      </span>
      {meta.label}
    </span>
  );
}
