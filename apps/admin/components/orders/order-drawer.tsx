"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, Check, Copy, CreditCard, MapPin, MessageSquareText, Phone, ReceiptText, Star, Store, User, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/endpoints";
import type { OrderDetail, OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { faDigits, faNumber, formatDateTime, formatPhone, toman } from "@/lib/format";
import { PAYMENT_LABEL, STATUS_FLOW, STATUS_META } from "@/lib/orders";
import { queryKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/modal";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderActions } from "./order-actions";
import { StatusBadge } from "./status-badge";

interface OrderDrawerProps {
  orderId: number | null;
  onClose: () => void;
}

/** Full order details: status timeline, customer, items, prices and payment. */
export function OrderDrawer({ orderId, onClose }: OrderDrawerProps) {
  const { data: order, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.order(orderId ?? 0),
    queryFn: () => adminApi.order(orderId!),
    enabled: orderId !== null,
  });

  return (
    <Drawer
      open={orderId !== null}
      onClose={onClose}
      title={order ? <span dir="ltr">{faDigits(order.code)}</span> : "جزئیات سفارش"}
      description={
        order && (
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="tabular">{formatDateTime(order.createdAt)}</span>
          </span>
        )
      }
      footer={order && <OrderActions order={order} size="md" className="w-full [&>button]:flex-1" />}
    >
      {isPending ? (
        <DrawerSkeleton />
      ) : isError ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : (
        <OrderDetailBody order={order} />
      )}
    </Drawer>
  );
}

function Section({ title, icon, children, className }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("p-4", className)}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-800 [&_svg]:size-4 [&_svg]:text-stone-400">
        {icon}
        {title}
      </h3>
      {children}
    </Card>
  );
}

function OrderDetailBody({ order }: { order: OrderDetail }) {
  return (
    <div className="space-y-4">
      <Section title="روند سفارش" icon={<ReceiptText />}>
        <Timeline order={order} />
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="مشتری" icon={<User />}>
          <p className="text-sm font-semibold text-stone-800">{order.user.name ?? "بدون نام"}</p>
          <a
            href={`tel:${order.user.phone}`}
            className="tabular mt-1 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-700"
          >
            <Phone className="size-3.5" />
            <span dir="ltr">{formatPhone(order.user.phone)}</span>
          </a>
        </Section>
        <Section title="رستوران" icon={<Store />}>
          <p className="text-sm font-semibold text-stone-800">{order.restaurant.name}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">{order.restaurant.address}</p>
        </Section>
      </div>

      <Section title="آدرس تحویل" icon={<MapPin />}>
        <p className="text-sm leading-7 text-stone-700">{order.addressText}</p>
        {order.note && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-saffron-50 p-3 text-sm leading-6 text-saffron-900">
            <MessageSquareText className="mt-0.5 size-4 shrink-0 text-saffron-600" />
            <span>
              <span className="font-semibold">یادداشت مشتری: </span>
              {order.note}
            </span>
          </div>
        )}
      </Section>

      <Section title={`اقلام سفارش (${faNumber(order.items.reduce((n, item) => n + item.quantity, 0))})`} icon={<ReceiptText />}>
        <ul className="divide-y divide-stone-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="tabular grid h-7 min-w-7 place-items-center rounded-lg bg-stone-100 px-1.5 text-xs font-bold text-stone-600">
                {faNumber(item.quantity)}×
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-stone-800">{item.name}</span>
                <span className="tabular text-xs text-stone-400">هر عدد {toman(item.unitPrice)}</span>
              </span>
              <span className="tabular font-semibold text-stone-800">{toman(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-2 border-t border-dashed border-stone-200 pt-3 text-sm">
          <PriceRow label="جمع اقلام (قیمت منو)" value={toman(order.subtotal)} />
          {order.itemsDiscount > 0 && <PriceRow label="تخفیف غذاها" value={`− ${toman(order.itemsDiscount)}`} tone="discount" />}
          {order.codeDiscount > 0 && <PriceRow label="کد تخفیف" value={`− ${toman(order.codeDiscount)}`} tone="discount" />}
          <PriceRow label="هزینه‌ی ارسال" value={order.deliveryFee ? toman(order.deliveryFee) : "رایگان"} />
          <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5">
            <dt className="font-bold text-stone-800">مبلغ نهایی</dt>
            <dd className="tabular text-base font-extrabold text-brand-700">{toman(order.total)}</dd>
          </div>
        </dl>
      </Section>

      <Section title="پرداخت" icon={order.paymentMethod === "ONLINE" ? <CreditCard /> : <Banknote />}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{PAYMENT_LABEL[order.paymentMethod]}</Badge>
          {order.isPaid ? (
            <Badge tone="green" dot>
              پرداخت شده
            </Badge>
          ) : (
            <Badge tone="saffron" dot>
              {order.paymentMethod === "CASH" ? "دریافت هنگام تحویل" : "در انتظار پرداخت"}
            </Badge>
          )}
        </div>
        {order.paymentRef && <PaymentRef value={order.paymentRef} />}
      </Section>

      {order.review && (
        <Section title="نظر مشتری" icon={<Star />}>
          <div className="flex items-center gap-0.5" aria-label={`امتیاز ${faNumber(order.review.rating)} از ۵`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn("size-4", i < order.review!.rating ? "fill-saffron-400 text-saffron-400" : "text-stone-200")} />
            ))}
          </div>
          {order.review.comment && <p className="mt-2 text-sm leading-6 text-stone-600">{order.review.comment}</p>}
        </Section>
      )}
    </div>
  );
}

function PriceRow({ label, value, tone }: { label: string; value: string; tone?: "discount" }) {
  return (
    <div className="flex items-center justify-between px-0.5">
      <dt className="text-stone-500">{label}</dt>
      <dd className={cn("tabular font-medium", tone === "discount" ? "text-emerald-600" : "text-stone-700")}>{value}</dd>
    </div>
  );
}

function PaymentRef({ value }: { value: string }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
      <span className="text-xs text-stone-500">شناسه‌ی پرداخت</span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => toast.success("شناسه‌ی پرداخت کپی شد."));
        }}
        className="flex cursor-pointer items-center gap-1.5 font-mono text-xs font-semibold text-stone-700 hover:text-brand-700"
        title="کپی"
      >
        <span dir="ltr">{value}</span>
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}

/** Vertical status timeline built from `statusLogs`. */
function Timeline({ order }: { order: OrderDetail }) {
  const logs = new Map<OrderStatus, string>();
  for (const log of order.statusLogs) logs.set(log.status, log.createdAt);

  const cancelled = order.status === "CANCELLED";
  // Cancelled orders show only what happened; others show the whole flow.
  const steps: OrderStatus[] = cancelled
    ? [...order.statusLogs].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((log) => log.status)
    : STATUS_FLOW;

  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const at = logs.get(step);
        const current = step === order.status;
        const done = !!at;
        const last = index === steps.length - 1;
        const isCancel = step === "CANCELLED";
        return (
          <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && (
              <span
                className={cn("absolute top-7 right-[13px] bottom-0 w-0.5 rounded-full", done && logs.has(steps[index + 1]) ? "bg-emerald-400" : "bg-stone-200")}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 text-white",
                isCancel
                  ? "border-red-500 bg-red-500"
                  : current && step !== "DELIVERED"
                    ? "border-brand-500 bg-white ring-4 ring-brand-100"
                    : done
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-stone-200 bg-white",
              )}
            >
              {isCancel ? (
                <X className="size-3.5" />
              ) : current && step !== "DELIVERED" ? (
                <span className="size-2 animate-pulse rounded-full bg-brand-500" />
              ) : done ? (
                <Check className="size-3.5" />
              ) : null}
            </span>
            <div className="pt-0.5">
              <p className={cn("text-sm font-medium", done ? "text-stone-800" : "text-stone-400", isCancel && "text-red-700")}>
                {STATUS_META[step].label}
              </p>
              {at && <p className="tabular text-xs text-stone-400">{formatDateTime(at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
