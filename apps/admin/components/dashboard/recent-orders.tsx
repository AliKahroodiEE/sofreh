"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { adminApi } from "@/lib/api/endpoints";
import { faDigits, relativeTime, toman } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";
import { queryKeys } from "@/lib/query-keys";
import { useRealtime } from "@/lib/realtime";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/orders/status-badge";

const QUERY = { page: 1, limit: 6 };

/** The latest orders; new ones arrive through the realtime cache updates. */
export function RecentOrders() {
  const now = useNow();
  const { freshOrderIds } = useRealtime();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.orderList(QUERY),
    queryFn: () => adminApi.orders(QUERY),
  });

  if (isPending) {
    return (
      <div className="space-y-3 px-5 pb-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }
  if (isError) return <QueryError error={error} onRetry={() => void refetch()} />;
  if (data.items.length === 0) return <EmptyState icon={<Inbox />} title="هنوز سفارشی ثبت نشده" />;

  return (
    <ul className="divide-y divide-stone-100">
      {data.items.map((order) => (
        <li key={order.id} className={cn(freshOrderIds.has(order.id) && "animate-new-row")}>
          <Link href={`/orders?order=${order.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-stone-50/80">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="tabular text-sm font-bold text-stone-800" dir="ltr">
                  {faDigits(order.code)}
                </span>
                <span className="text-xs text-stone-400">{now ? relativeTime(order.createdAt, now) : ""}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-stone-500">
                {order.user.name ?? "مشتری"} · {order.restaurant.name}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="tabular text-sm font-semibold text-stone-800">{toman(order.total)}</span>
              <StatusBadge status={order.status} short />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
