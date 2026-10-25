/// Order pricing rules.
///
/// These mirror the server (`apps/api/src/orders/order-rules.ts`) exactly so
/// the totals shown before checkout equal the totals the API charges. The
/// server always recalculates; the client copy is for display only.
library;

/// Price after a percentage discount, rounded to whole toman
/// (`round(price × (100 − discountPercent) / 100)`).
int discountedPrice(int price, int discountPercent) => (price * (100 - discountPercent) / 100).round();

/// Anything that can be priced: a cart line or an order line.
abstract interface class PricedLine {
  /// Menu price of one unit, before the dish discount.
  int get basePrice;

  /// Price of one unit after the dish discount.
  int get unitPrice;

  /// Number of units.
  int get quantity;
}

/// The price breakdown shown at checkout and on the order page.
class PriceBreakdown {
  /// Creates a breakdown.
  const PriceBreakdown({
    required this.subtotal,
    required this.itemsDiscount,
    required this.codeDiscount,
    required this.deliveryFee,
    required this.total,
  });

  /// Sum of menu prices.
  final int subtotal;

  /// Savings from dish discounts.
  final int itemsDiscount;

  /// Savings from the discount code.
  final int codeDiscount;
  final int deliveryFee;

  /// Amount to pay.
  final int total;

  /// Food total after dish discounts and before delivery. This is the
  /// `amount` sent to `POST /discounts/validate` and the value compared with
  /// the restaurant's minimum order.
  int get foodTotal => subtotal - itemsDiscount;
}

/// `computeTotals` from the server: the code discount never makes the food
/// total negative, and delivery is always added on top.
PriceBreakdown computeTotals(Iterable<PricedLine> lines, {required int deliveryFee, int codeDiscount = 0}) {
  var subtotal = 0;
  var afterItems = 0;
  for (final line in lines) {
    subtotal += line.basePrice * line.quantity;
    afterItems += line.unitPrice * line.quantity;
  }
  final food = afterItems - codeDiscount;
  return PriceBreakdown(
    subtotal: subtotal,
    itemsDiscount: subtotal - afterItems,
    codeDiscount: codeDiscount,
    deliveryFee: deliveryFee,
    total: (food < 0 ? 0 : food) + deliveryFee,
  );
}
