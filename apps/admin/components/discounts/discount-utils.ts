import type { DiscountCode } from "@/lib/api/types";
import { toman, faNumber } from "@/lib/format";
import type { Tone } from "@/lib/orders";

export type DiscountState = "active" | "inactive" | "expired" | "exhausted";

export const DISCOUNT_STATE: Record<DiscountState, { label: string; tone: Tone }> = {
  active: { label: "فعال", tone: "green" },
  inactive: { label: "غیرفعال", tone: "neutral" },
  expired: { label: "منقضی", tone: "red" },
  exhausted: { label: "سقف استفاده پر شد", tone: "saffron" },
};

/** Whether customers can use the code right now (`now` in ms). */
export function discountState(code: DiscountCode, now: number): DiscountState {
  if (!code.isActive) return "inactive";
  if (code.expiresAt && now && new Date(code.expiresAt).getTime() < now) return "expired";
  if (code.usageLimit !== null && code.usedCount >= code.usageLimit) return "exhausted";
  return "active";
}

/** «۲۰٪ تا سقف ۶۰٬۰۰۰ تومان» or «۵۰٬۰۰۰ تومان» */
export function describeValue(code: Pick<DiscountCode, "type" | "value" | "maxDiscount">): string {
  if (code.type === "FIXED") return toman(code.value);
  return code.maxDiscount ? `${faNumber(code.value)}٪ تا سقف ${toman(code.maxDiscount)}` : `${faNumber(code.value)}٪`;
}
