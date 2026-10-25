"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { faNumber } from "@/lib/format";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const result: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) result.push("gap");
  for (let p = start; p <= end; p++) result.push(p);
  if (end < pages - 1) result.push("gap");
  result.push(pages);
  return result;
}

export function Pagination({ page, limit, total, onPageChange, className }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  const navButton = "grid size-8 cursor-pointer place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-3.5", className)}>
      <p className="tabular text-xs text-stone-500">
        نمایش {faNumber(from)} تا {faNumber(to)} از {faNumber(total)} مورد
      </p>
      {pages > 1 && (
        <nav className="flex items-center gap-1" aria-label="صفحه‌بندی">
          <button type="button" className={navButton} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="صفحه‌ی قبل">
            <ChevronRight className="size-4" />
          </button>
          {pageWindow(page, pages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-stone-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "tabular h-8 min-w-8 cursor-pointer rounded-lg px-2 text-xs font-medium transition",
                  p === page ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100",
                )}
              >
                {faNumber(p)}
              </button>
            ),
          )}
          <button type="button" className={navButton} disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="صفحه‌ی بعد">
            <ChevronLeft className="size-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
