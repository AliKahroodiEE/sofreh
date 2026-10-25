"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Banknote, ChartNoAxesColumn, PieChart, ReceiptText, Store, Trophy, Users, Wallet } from "lucide-react";
import { adminApi } from "@/lib/api/endpoints";
import type { AdminStats } from "@/lib/api/types";
import { faNumber } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/lib/auth/session";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { QueryError } from "@/components/ui/query-error";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard, KpiCardSkeleton } from "./kpi-card";
import { ChartLegend, RevenueChart } from "./revenue-chart";
import { RecentOrders } from "./recent-orders";
import { StatusBreakdown } from "./status-breakdown";
import { TopRestaurants } from "./top-restaurants";

type Range = "7" | "14" | "30";

const RANGES = [
  { value: "7" as const, label: "۷ روز" },
  { value: "14" as const, label: "۱۴ روز" },
  { value: "30" as const, label: "۳۰ روز" },
];

/** Change between the last two days of the series, or null without a baseline. */
function dayOverDay(stats: AdminStats, key: "orders" | "revenue"): number | null {
  const [previous, today] = stats.series.slice(-2);
  if (!previous || !today || previous[key] === 0) return null;
  return (today[key] - previous[key]) / previous[key];
}

export function DashboardView() {
  const [range, setRange] = useState<Range>("7");
  const days = Number(range);
  const session = useSession();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.stats(days),
    queryFn: () => adminApi.stats(days),
    refetchInterval: 60_000,
    placeholderData: (previous) => previous,
  });

  const name = session?.user.name;

  return (
    <>
      <PageHeader
        title={name ? `سلام، ${name}` : "داشبورد"}
        description="نمای کلی فروش و سفارش‌های سفره"
        actions={<Segmented ariaLabel="بازه‌ی گزارش" options={RANGES} value={range} onChange={setRange} />}
      />

      {isError && !data ? (
        <Card>
          <QueryError error={error} onRetry={() => void refetch()} />
        </Card>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-label="شاخص‌های کلیدی">
            {isPending || !data ? (
              Array.from({ length: 5 }, (_, i) => <KpiCardSkeleton key={i} />)
            ) : (
              <>
                <KpiCard
                  label="سفارش‌های امروز"
                  value={faNumber(data.today.orders)}
                  icon={<ReceiptText />}
                  accent="brand"
                  change={dayOverDay(data, "orders")}
                />
                <KpiCard
                  label="درآمد امروز"
                  value={faNumber(data.today.revenue)}
                  unit="تومان"
                  icon={<Wallet />}
                  accent="saffron"
                  change={dayOverDay(data, "revenue")}
                />
                <KpiCard
                  label="مشتریان"
                  value={faNumber(data.totals.customers)}
                  icon={<Users />}
                  accent="sky"
                  footnote="کاربران ثبت‌نام‌کرده"
                />
                <KpiCard
                  label="رستوران‌های فعال"
                  value={faNumber(data.totals.restaurants)}
                  icon={<Store />}
                  accent="violet"
                  footnote="قابل نمایش در اپ مشتری"
                />
                <KpiCard
                  label="درآمد کل"
                  value={faNumber(data.totals.revenue)}
                  unit="تومان"
                  icon={<Banknote />}
                  accent="emerald"
                  footnote={`از ${faNumber(data.totals.orders)} سفارش ثبت‌شده`}
                />
              </>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                icon={<ChartNoAxesColumn />}
                title="درآمد و سفارش‌ها"
                description={`${faNumber(days)} روز اخیر، به وقت تهران (بدون سفارش‌های لغوشده)`}
                actions={<ChartLegend />}
              />
              <div className="px-3 pt-4 pb-3">{data ? <RevenueChart series={data.series} /> : <Skeleton className="mx-2 h-[300px]" />}</div>
            </Card>

            <Card>
              <CardHeader icon={<PieChart />} title="وضعیت سفارش‌ها" description="تفکیک همه‌ی سفارش‌ها بر اساس وضعیت" />
              <div className="p-5">{data ? <StatusBreakdown counts={data.statusCounts} /> : <Skeleton className="h-72" />}</div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader icon={<Trophy />} title="رستوران‌های برتر" description={`بیشترین فروش در ${faNumber(days)} روز اخیر`} />
              <div className="p-5">{data ? <TopRestaurants items={data.topRestaurants} /> : <Skeleton className="h-56" />}</div>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader
                icon={<ReceiptText />}
                title="آخرین سفارش‌ها"
                description="به‌روزرسانی خودکار با ثبت سفارش جدید"
                actions={
                  <Link href="/orders" className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800">
                    همه‌ی سفارش‌ها
                    <ArrowLeft className="size-3.5" />
                  </Link>
                }
              />
              <div className="pt-3">
                <RecentOrders />
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
