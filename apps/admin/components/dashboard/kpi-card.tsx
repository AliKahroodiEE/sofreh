import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { faPercent } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type KpiAccent = "brand" | "saffron" | "emerald" | "sky" | "violet";

const accents: Record<KpiAccent, string> = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  saffron: "bg-saffron-50 text-saffron-600 ring-saffron-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
};

interface KpiCardProps {
  label: string;
  value: ReactNode;
  /** Small unit after the value, e.g. «تومان». */
  unit?: string;
  icon: ReactNode;
  accent: KpiAccent;
  /** Change ratio vs. the previous period (0.12 = +12%); null hides it. */
  change?: number | null;
  changeLabel?: string;
  footnote?: ReactNode;
}

export function KpiCard({ label, value, unit, icon, accent, change, changeLabel = "نسبت به دیروز", footnote }: KpiCardProps) {
  const up = (change ?? 0) >= 0;
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-stone-500">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset [&_svg]:size-[18px]", accents[accent])}>{icon}</span>
      </div>
      <p className="tabular mt-2 flex items-baseline gap-1.5 text-[22px] font-extrabold tracking-tight text-stone-900 2xl:text-2xl">
        {value}
        {unit && <span className="text-xs font-medium text-stone-400">{unit}</span>}
      </p>
      <div className="mt-2 min-h-5 text-xs text-stone-500">
        {change !== undefined && change !== null ? (
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "tabular inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold",
                up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
              )}
            >
              {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {faPercent(Math.abs(change))}
            </span>
            {changeLabel}
          </span>
        ) : (
          footnote
        )}
      </div>
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-3 h-4 w-28" />
    </Card>
  );
}
