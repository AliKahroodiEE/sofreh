import Link from "next/link";
import { Store } from "lucide-react";
import type { AdminStats } from "@/lib/api/types";
import { faNumber, toman } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";

export function TopRestaurants({ items }: { items: AdminStats["topRestaurants"] }) {
  if (items.length === 0) {
    return <EmptyState icon={<Store />} title="هنوز فروشی ثبت نشده" description="در این بازه سفارشی ثبت نشده است." className="py-8" />;
  }
  const max = Math.max(...items.map((item) => item.revenue), 1);
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={item.id}>
          <Link href={`/restaurants/${item.id}`} className="group block">
            <div className="flex items-center gap-3">
              <span
                className={
                  index === 0
                    ? "tabular grid size-7 shrink-0 place-items-center rounded-lg bg-saffron-100 text-xs font-bold text-saffron-800"
                    : "tabular grid size-7 shrink-0 place-items-center rounded-lg bg-stone-100 text-xs font-bold text-stone-500"
                }
              >
                {faNumber(index + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-stone-800 group-hover:text-brand-700">{item.name}</span>
                  <span className="tabular shrink-0 text-xs font-semibold text-stone-700">{toman(item.revenue)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-brand-500 to-saffron-400"
                      style={{ width: `${Math.max(4, (item.revenue / max) * 100)}%` }}
                    />
                  </div>
                  <span className="tabular shrink-0 text-[11px] text-stone-400">{faNumber(item.orders)} سفارش</span>
                </div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
