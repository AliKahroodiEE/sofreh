import { canTransition, computeTotals, discountedPrice, evaluateDiscount, priceLines } from './order-rules.js';

const code = {
  type: 'PERCENT' as const,
  value: 20,
  maxDiscount: 50_000,
  minOrder: 0,
  usageLimit: null,
  usedCount: 0,
  expiresAt: null,
  isActive: true,
};

describe('pricing', () => {
  it('applies the per-item discount and rounds to whole toman', () => {
    expect(discountedPrice(245_000, 10)).toBe(220_500);
    expect(discountedPrice(99_999, 0)).toBe(99_999);
  });

  it('computes subtotal, item savings, code discount and delivery', () => {
    const lines = priceLines([
      { menuItem: { id: 1, name: 'پیتزا', price: 300_000, discountPercent: 10 }, quantity: 2 },
      { menuItem: { id: 2, name: 'نوشابه', price: 40_000, discountPercent: 0 }, quantity: 1 },
    ]);
    expect(computeTotals(lines, 25_000, 30_000)).toEqual({
      subtotal: 640_000,
      itemsDiscount: 60_000,
      codeDiscount: 30_000,
      deliveryFee: 25_000,
      total: 640_000 - 60_000 - 30_000 + 25_000,
    });
  });

  it('never lets discounts make the food price negative', () => {
    const lines = priceLines([{ menuItem: { id: 1, name: 'چای', price: 20_000, discountPercent: 0 }, quantity: 1 }]);
    expect(computeTotals(lines, 15_000, 50_000).total).toBe(15_000);
  });
});

describe('discount codes', () => {
  it('caps percentage codes at maxDiscount', () => {
    expect(evaluateDiscount(code, 100_000)).toEqual({ ok: true, amount: 20_000 });
    expect(evaluateDiscount(code, 1_000_000)).toEqual({ ok: true, amount: 50_000 });
  });

  it('limits fixed codes to the order amount', () => {
    expect(evaluateDiscount({ ...code, type: 'FIXED', value: 80_000, maxDiscount: null }, 60_000)).toEqual({
      ok: true,
      amount: 60_000,
    });
  });

  it.each([
    [{ isActive: false }, 'فعال نیست'],
    [{ expiresAt: new Date('2020-01-01') }, 'مهلت'],
    [{ usageLimit: 10, usedCount: 10 }, 'ظرفیت'],
    [{ minOrder: 500_000 }, 'بالای'],
  ])('rejects %o', (override, reason) => {
    const result = evaluateDiscount({ ...code, ...override }, 100_000);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain(reason);
  });
});

describe('order status', () => {
  it('follows the delivery flow', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED', 'PREPARING')).toBe(true);
    expect(canTransition('PREPARING', 'DELIVERING')).toBe(true);
    expect(canTransition('DELIVERING', 'DELIVERED')).toBe(true);
  });

  it('blocks skipping steps and changing finished orders', () => {
    expect(canTransition('PENDING', 'DELIVERED')).toBe(false);
    expect(canTransition('PREPARING', 'CANCELLED')).toBe(false);
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false);
    expect(canTransition('CANCELLED', 'PENDING')).toBe(false);
  });
});
