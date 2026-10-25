import type { DiscountCode, OrderStatus } from '@prisma/client';

/**
 * Pure business rules for orders. No database access here, so everything in
 * this file is covered by fast unit tests (order-rules.spec.ts).
 */

// ---------------------------------------------------------------- pricing

export interface PricedLine {
  menuItemId: number;
  name: string;
  quantity: number;
  basePrice: number; // menu price
  unitPrice: number; // price after the item's own discount
}

export interface OrderTotals {
  subtotal: number; // sum of menu prices
  itemsDiscount: number; // savings from per-item discounts
  codeDiscount: number;
  deliveryFee: number;
  total: number;
}

/** Price after a percentage discount, rounded to whole toman. */
export function discountedPrice(price: number, discountPercent: number): number {
  return Math.round((price * (100 - discountPercent)) / 100);
}

export function priceLines(
  lines: { menuItem: { id: number; name: string; price: number; discountPercent: number }; quantity: number }[],
): PricedLine[] {
  return lines.map(({ menuItem, quantity }) => ({
    menuItemId: menuItem.id,
    name: menuItem.name,
    quantity,
    basePrice: menuItem.price,
    unitPrice: discountedPrice(menuItem.price, menuItem.discountPercent),
  }));
}

export function computeTotals(lines: PricedLine[], deliveryFee: number, codeDiscount = 0): OrderTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.basePrice * l.quantity, 0);
  const afterItems = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const itemsDiscount = subtotal - afterItems;
  const total = Math.max(0, afterItems - codeDiscount) + deliveryFee;
  return { subtotal, itemsDiscount, codeDiscount, deliveryFee, total };
}

// ---------------------------------------------------------- discount codes

export type DiscountResult = { ok: true; amount: number } | { ok: false; reason: string };

/**
 * How much a discount code takes off `amount` (the food price after item
 * discounts, before delivery). Returns the reason in Persian when it does not apply.
 */
export function evaluateDiscount(
  code: Pick<DiscountCode, 'type' | 'value' | 'maxDiscount' | 'minOrder' | 'usageLimit' | 'usedCount' | 'expiresAt' | 'isActive'>,
  amount: number,
  now = new Date(),
): DiscountResult {
  if (!code.isActive) return { ok: false, reason: 'این کد تخفیف فعال نیست.' };
  if (code.expiresAt && code.expiresAt <= now) return { ok: false, reason: 'مهلت استفاده از این کد تمام شده است.' };
  if (code.usageLimit !== null && code.usedCount >= code.usageLimit) {
    return { ok: false, reason: 'ظرفیت استفاده از این کد تکمیل شده است.' };
  }
  if (amount < code.minOrder) {
    return { ok: false, reason: `این کد برای سفارش‌های بالای ${code.minOrder.toLocaleString('fa-IR')} تومان است.` };
  }

  let discount =
    code.type === 'PERCENT' ? Math.floor((amount * code.value) / 100) : Math.min(code.value, amount);
  if (code.maxDiscount !== null) discount = Math.min(discount, code.maxDiscount);
  return { ok: true, amount: discount };
}

// ----------------------------------------------------------- order status

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['DELIVERING'],
  DELIVERING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT_STATUS[from].includes(to);
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return NEXT_STATUS[from];
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'در انتظار تأیید رستوران',
  CONFIRMED: 'تأیید شد',
  PREPARING: 'در حال آماده‌سازی',
  DELIVERING: 'پیک در راه است',
  DELIVERED: 'تحویل داده شد',
  CANCELLED: 'لغو شد',
};
