import type { OrderStatus, PaymentMethod } from "@/lib/api/types";

/** Display metadata and the allowed status flow for orders. */

export type Tone = "neutral" | "brand" | "saffron" | "blue" | "violet" | "green" | "red";

export interface StatusMeta {
  label: string;
  /** Short label for tabs and compact badges. */
  short: string;
  tone: Tone;
}

export const ORDER_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "DELIVERING", "DELIVERED", "CANCELLED"];

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING: { label: "در انتظار تأیید رستوران", short: "در انتظار تأیید", tone: "saffron" },
  CONFIRMED: { label: "تأیید شد", short: "تأییدشده", tone: "blue" },
  PREPARING: { label: "در حال آماده‌سازی", short: "در حال آماده‌سازی", tone: "violet" },
  DELIVERING: { label: "پیک در راه است", short: "ارسال با پیک", tone: "brand" },
  DELIVERED: { label: "تحویل داده شد", short: "تحویل‌شده", tone: "green" },
  CANCELLED: { label: "لغو شد", short: "لغوشده", tone: "red" },
};

/** Happy path, used to draw the timeline. */
export const STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "DELIVERING", "DELIVERED"];

export interface StatusAction {
  to: OrderStatus;
  label: string;
  /** Destructive actions ask for confirmation. */
  destructive?: boolean;
}

/** Buttons offered for each status (mirrors the API's transition rules). */
export const NEXT_ACTIONS: Record<OrderStatus, StatusAction[]> = {
  PENDING: [
    { to: "CONFIRMED", label: "تأیید سفارش" },
    { to: "CANCELLED", label: "لغو", destructive: true },
  ],
  CONFIRMED: [
    { to: "PREPARING", label: "شروع آماده‌سازی" },
    { to: "CANCELLED", label: "لغو", destructive: true },
  ],
  PREPARING: [{ to: "DELIVERING", label: "تحویل به پیک" }],
  DELIVERING: [{ to: "DELIVERED", label: "تحویل شد" }],
  DELIVERED: [],
  CANCELLED: [],
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  ONLINE: "پرداخت آنلاین",
  CASH: "پرداخت در محل",
};

export function isOrderStatus(value: string | null | undefined): value is OrderStatus {
  return !!value && (ORDER_STATUSES as string[]).includes(value);
}
