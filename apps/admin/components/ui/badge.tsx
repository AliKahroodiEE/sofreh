import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/orders";

const tones: Record<Tone, string> = {
  neutral: "bg-stone-100 text-stone-600 ring-stone-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  saffron: "bg-saffron-50 text-saffron-800 ring-saffron-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  red: "bg-red-50 text-red-700 ring-red-100",
};

const dots: Record<Tone, string> = {
  neutral: "bg-stone-400",
  brand: "bg-brand-500",
  saffron: "bg-saffron-500",
  blue: "bg-sky-500",
  violet: "bg-violet-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Show a coloured dot before the label. */
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        "[&_svg]:size-3.5",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} aria-hidden />}
      {children}
    </span>
  );
}
