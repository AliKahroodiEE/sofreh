"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, Inbox, SearchX } from "lucide-react";
import { adminApi } from "@/lib/api/endpoints";
import type { AdminOrder, OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { faDigits, faNumber, formatPhone, relativeTime, toLatinDigits, toman } from "@/lib/format";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { useNow } from "@/lib/hooks/use-now";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { isOrderStatus, ORDER_STATUSES, PAYMENT_LABEL, STATUS_META } from "@/lib/orders";
import { queryKeys } from "@/lib/query-keys";
import { useRealtime } from "@/lib/realtime";
import { LiveIndicator } from "@/components/layout/live-indicator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { SearchInput } from "@/components/ui/search-input";
import { Segmented, type SegmentOption } from "@/components/ui/segmented";
import { TableSkeleton } from "@/components/ui/skeleton";
import { OrderActions } from "./order-actions";
import { OrderDrawer } from "./order-drawer";
import { StatusBadge } from "./status-badge";

const PAGE_SIZE = 15;

type Tab = OrderStatus | "ALL";

/**
 * Live order board. Filters, search, page and the open order live in the
 * URL (?status=PENDING&q=0912…&page=2&order=171); real-time events update
 * the cached rows through RealtimeProvider.
 */
export function OrdersView() {
  const [params, setParams] = useUrlState();
  const rawStatus = params.get("status");
  const status = isOrderStatus(rawStatus) ? rawStatus : undefined;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("q") ?? "";
  const openId = Number(params.get("order")) || null;

  const [searchInput, setSearchInput] = useState(search);
  const pushSearch = useDebouncedCallback((value: string) => setParams({ q: value.trim(), page: null }), 400);

  const { freshOrderIds, unseen, markSeen } = useRealtime();
  // The admin is looking at the board: clear the sidebar's "new orders" badge.
  useEffect(() => {
    if (unseen > 0) markSeen();
  }, [unseen, markSeen]);

  const query = { status, search: search ? toLatinDigits(search) : undefined, page, limit: PAGE_SIZE };
  const orders = useQuery({
    queryKey: queryKeys.orderList(query),
    queryFn: () => adminApi.orders(query),
    placeholderData: keepPreviousData,
  });

  // Tab counters come from the dashboard stats (all-time counts per status).
  const stats = useQuery({ queryKey: queryKeys.stats(7), queryFn: () => adminApi.stats(7) });
  const counts = stats.data?.statusCounts;
  const tabs: SegmentOption<Tab>[] = [
    { value: "ALL", label: "همه", count: counts ? Object.values(counts).reduce((a, b) => a + (b ?? 0), 0) : undefined },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].short, count: counts ? (counts[s] ?? 0) : undefined })),
  ];

  const openOrder = (id: number) => setParams({ order: id });

  return (
    <>
      <PageHeader
        title="سفارش‌ها"
        description="سفارش‌ها را بررسی کنید و وضعیتشان را مرحله‌به‌مرحله جلو ببرید."
        actions={<LiveIndicator />}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <Segmented
            ariaLabel="فیلتر وضعیت"
            options={tabs}
            value={status ?? "ALL"}
            onChange={(value) => setParams({ status: value === "ALL" ? null : value, page: null })}
            className="2xl:max-w-[70%]"
          />
          <SearchInput
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              pushSearch(value);
            }}
            placeholder="جستجوی کد سفارش یا موبایل مشتری"
            className="sm:w-80"
          />
        </div>

        {orders.isPending ? (
          <TableSkeleton rows={8} columns={6} />
        ) : orders.isError ? (
          <QueryError error={orders.error} onRetry={() => void orders.refetch()} />
        ) : orders.data.items.length === 0 ? (
          search || status ? (
            <EmptyState
              icon={<SearchX />}
              title="سفارشی با این مشخصات پیدا نشد"
              description="عبارت جستجو یا فیلتر وضعیت را تغییر دهید."
            />
          ) : (
            <EmptyState icon={<Inbox />} title="هنوز سفارشی ثبت نشده" description="سفارش‌های جدید به‌صورت زنده اینجا نمایش داده می‌شوند." />
          )
        ) : (
          <div className={cn("transition-opacity", orders.isPlaceholderData && "opacity-60")}>
            <OrdersTable orders={orders.data.items} freshIds={freshOrderIds} onOpen={openOrder} />
            <OrdersCards orders={orders.data.items} freshIds={freshOrderIds} onOpen={openOrder} />
            <div className="border-t border-stone-100">
              <Pagination
                page={orders.data.page}
                limit={orders.data.limit}
                total={orders.data.total}
                onPageChange={(next) => setParams({ page: next === 1 ? null : next })}
              />
            </div>
          </div>
        )}
      </Card>

      <OrderDrawer orderId={openId} onClose={() => setParams({ order: null })} />
    </>
  );
}

interface ListProps {
  orders: AdminOrder[];
  freshIds: ReadonlySet<number>;
  onOpen: (id: number) => void;
}

function itemsSummary(order: AdminOrder) {
  return order.items.map((item) => `${faNumber(item.quantity)}× ${item.name}`).join("، ");
}

function PaymentLine({ order }: { order: AdminOrder }) {
  return (
    <span className={cn("text-[11px]", order.isPaid ? "text-emerald-600" : "text-stone-400")}>
      {PAYMENT_LABEL[order.paymentMethod]} · {order.isPaid ? "پرداخت‌شده" : "پرداخت‌نشده"}
    </span>
  );
}

function NewBadge() {
  return (
    <Badge tone="saffron" className="px-1.5 py-0 text-[10px]">
      جدید
    </Badge>
  );
}

/** Desktop table (lg and up). */
function OrdersTable({ orders, freshIds, onOpen }: ListProps) {
  const now = useNow();
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100 bg-stone-50/60 text-right text-xs text-stone-500">
            <th className="px-5 py-3 font-medium">سفارش</th>
            <th className="px-3 py-3 font-medium">مشتری</th>
            <th className="px-3 py-3 font-medium">رستوران و اقلام</th>
            <th className="px-3 py-3 font-medium">مبلغ</th>
            <th className="px-3 py-3 font-medium">وضعیت</th>
            <th className="px-5 py-3 font-medium">
              <span className="sr-only">عملیات</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => onOpen(order.id)}
              className={cn("group cursor-pointer transition-colors hover:bg-stone-50/80", freshIds.has(order.id) && "animate-new-row")}
            >
              <td className="px-5 py-3.5 align-middle">
                <div className="flex items-center gap-2">
                  <span className="tabular font-bold text-stone-800" dir="ltr">
                    {faDigits(order.code)}
                  </span>
                  {freshIds.has(order.id) && <NewBadge />}
                </div>
                <span className="text-xs text-stone-400">{now ? relativeTime(order.createdAt, now) : ""}</span>
              </td>
              <td className="px-3 py-3.5">
                <div className="font-medium text-stone-700">{order.user.name ?? "بدون نام"}</div>
                <div className="tabular text-xs text-stone-400" dir="ltr">
                  <span className="inline-block">{formatPhone(order.user.phone)}</span>
                </div>
              </td>
              <td className="max-w-64 px-3 py-3.5">
                <div className="truncate font-medium text-stone-700">{order.restaurant.name}</div>
                <div className="truncate text-xs text-stone-400" title={itemsSummary(order)}>
                  {itemsSummary(order)}
                </div>
              </td>
              <td className="px-3 py-3.5 whitespace-nowrap">
                <div className="tabular font-semibold text-stone-800">{toman(order.total)}</div>
                <PaymentLine order={order} />
              </td>
              <td className="px-3 py-3.5">
                <StatusBadge status={order.status} short />
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1.5">
                  <OrderActions order={order} />
                  <ChevronLeft className="size-4 text-stone-300 transition group-hover:-translate-x-0.5 group-hover:text-stone-500" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Mobile/tablet cards (below lg). */
function OrdersCards({ orders, freshIds, onOpen }: ListProps) {
  const now = useNow();
  return (
    <ul className="divide-y divide-stone-100 lg:hidden">
      {orders.map((order) => (
        <li key={order.id} className={cn(freshIds.has(order.id) && "animate-new-row")}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(order.id)}
            onKeyDown={(event) => event.key === "Enter" && onOpen(order.id)}
            className="block cursor-pointer space-y-3 p-4 transition hover:bg-stone-50/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="tabular font-bold text-stone-800" dir="ltr">
                    {faDigits(order.code)}
                  </span>
                  {freshIds.has(order.id) && <NewBadge />}
                </div>
                <p className="mt-0.5 text-xs text-stone-400">
                  {now ? relativeTime(order.createdAt, now) : ""} · {order.restaurant.name}
                </p>
              </div>
              <StatusBadge status={order.status} short />
            </div>
            <p className="line-clamp-1 text-xs text-stone-500">{itemsSummary(order)}</p>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-stone-700">{order.user.name ?? "بدون نام"}</p>
                <PaymentLine order={order} />
              </div>
              <p className="tabular font-bold text-stone-800">{toman(order.total)}</p>
            </div>
            <OrderActions order={order} className="flex-wrap" />
          </div>
        </li>
      ))}
    </ul>
  );
}
