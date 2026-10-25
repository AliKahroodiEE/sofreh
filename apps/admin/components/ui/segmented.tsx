"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { faNumber } from "@/lib/format";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Optional counter shown next to the label. */
  count?: number;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

/** Pill-style tabs used for filters (order status, chart range, …). */
export function Segmented<T extends string>({ options, value, onChange, className, ariaLabel }: SegmentedProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("scroll-thin flex gap-1 overflow-x-auto rounded-xl bg-stone-100/80 p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition",
              active ? "bg-white text-stone-900 shadow-card" : "text-stone-500 hover:text-stone-800",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "tabular min-w-5 rounded-md px-1.5 py-px text-center text-[11px]",
                  active ? "bg-brand-600 text-white" : "bg-stone-200/80 text-stone-600",
                )}
              >
                {faNumber(option.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
