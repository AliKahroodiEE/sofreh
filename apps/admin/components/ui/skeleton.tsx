import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-stone-200/70", className)} aria-hidden />;
}

/** Placeholder rows for tables while data loads. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-stone-100" role="status" aria-label="در حال بارگذاری">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-4">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-28" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}
