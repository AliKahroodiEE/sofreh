import '../../../core/pricing/pricing.dart';
import '../../restaurant/domain/menu_item.dart';
import '../../restaurant/domain/restaurant_detail.dart';

/// The restaurant a cart belongs to (only the fields checkout needs).
class CartRestaurant {
  /// Creates the reference.
  const CartRestaurant({
    required this.id,
    required this.name,
    required this.slug,
    required this.deliveryFee,
    required this.minOrder,
    this.cover,
    this.isOpen = true,
  });

  /// From the restaurant page.
  factory CartRestaurant.fromDetail(RestaurantDetail r) => CartRestaurant(
        id: r.id,
        name: r.name,
        slug: r.slug,
        deliveryFee: r.deliveryFee,
        minOrder: r.minOrder,
        cover: r.cover,
        isOpen: r.isOpen,
      );

  /// From the persisted cart.
  factory CartRestaurant.fromJson(Map<String, dynamic> json) => CartRestaurant(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        slug: json['slug'] as String,
        deliveryFee: (json['deliveryFee'] as num).toInt(),
        minOrder: (json['minOrder'] as num).toInt(),
        cover: json['cover'] as String?,
        isOpen: json['isOpen'] as bool? ?? true,
      );

  final int id;
  final String name;
  final String slug;
  final int deliveryFee;
  final int minOrder;
  final String? cover;
  final bool isOpen;

  /// Serialises for persistence.
  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'deliveryFee': deliveryFee,
        'minOrder': minOrder,
        'cover': cover,
        'isOpen': isOpen,
      };
}

/// One dish and its quantity.
class CartLine implements PricedLine {
  /// Creates a line.
  const CartLine({required this.item, required this.quantity});

  /// From the persisted cart.
  factory CartLine.fromJson(Map<String, dynamic> json) => CartLine(
        item: MenuItem.fromJson(json['item'] as Map<String, dynamic>),
        quantity: (json['quantity'] as num).toInt(),
      );

  final MenuItem item;

  @override
  final int quantity;

  @override
  int get basePrice => item.price;

  @override
  int get unitPrice => item.finalPrice;

  /// What this line costs after the dish discount.
  int get total => unitPrice * quantity;

  /// What this line would cost without the dish discount.
  int get baseTotal => basePrice * quantity;

  /// Serialises for persistence.
  Map<String, dynamic> toJson() => {'item': item.toJson(), 'quantity': quantity};
}

/// The shopping cart: dishes from a single restaurant.
///
/// Immutable; every change returns a new cart. Pricing goes through
/// [computeTotals] so it matches the server.
class Cart {
  /// Creates a cart.
  const Cart({this.restaurant, this.lines = const []});

  /// The empty cart.
  static const empty = Cart();

  /// Restores a persisted cart.
  factory Cart.fromJson(Map<String, dynamic> json) {
    final lines = (json['lines'] as List<dynamic>? ?? const [])
        .map((e) => CartLine.fromJson(e as Map<String, dynamic>))
        .where((l) => l.quantity > 0)
        .toList();
    final restaurant = json['restaurant'];
    if (lines.isEmpty || restaurant == null) return empty;
    return Cart(restaurant: CartRestaurant.fromJson(restaurant as Map<String, dynamic>), lines: lines);
  }

  /// `null` when the cart is empty.
  final CartRestaurant? restaurant;
  final List<CartLine> lines;

  /// Maximum quantity of one dish accepted by the API.
  static const maxQuantity = 20;

  bool get isEmpty => lines.isEmpty;
  bool get isNotEmpty => lines.isNotEmpty;

  /// Total number of dishes.
  int get itemCount => lines.fold(0, (sum, l) => sum + l.quantity);

  /// Quantity of [menuItemId] in the cart (0 when absent).
  int quantityOf(int menuItemId) {
    for (final line in lines) {
      if (line.item.id == menuItemId) return line.quantity;
    }
    return 0;
  }

  /// Whether the cart holds dishes from another restaurant than [restaurantId].
  bool conflictsWith(int restaurantId) => isNotEmpty && restaurant!.id != restaurantId;

  /// Price breakdown, optionally with a validated [codeDiscount].
  PriceBreakdown totals({int codeDiscount = 0}) =>
      computeTotals(lines, deliveryFee: restaurant?.deliveryFee ?? 0, codeDiscount: codeDiscount);

  /// Food total after dish discounts (before delivery and code).
  int get foodTotal => totals().foodTotal;

  /// Minimum order of the restaurant (0 when empty).
  int get minOrder => restaurant?.minOrder ?? 0;

  /// Whether the food total reaches the restaurant's minimum order.
  bool get meetsMinOrder => foodTotal >= minOrder;

  /// How much more food is needed to reach the minimum order.
  int get remainingToMinOrder => meetsMinOrder ? 0 : minOrder - foodTotal;

  /// Adds one [item] from [from]. A different restaurant replaces the cart
  /// (callers ask the user first, see `CartController.add`).
  Cart add(CartRestaurant from, MenuItem item) {
    final base = conflictsWith(from.id) ? empty : this;
    final current = base.quantityOf(item.id);
    if (current >= maxQuantity) return this;
    if (current == 0) {
      return Cart(restaurant: from, lines: [...base.lines, CartLine(item: item, quantity: 1)]);
    }
    return base.setQuantity(item.id, current + 1);
  }

  /// Sets the quantity of a dish; 0 removes it and an empty cart forgets its restaurant.
  Cart setQuantity(int menuItemId, int quantity) {
    final clamped = quantity.clamp(0, maxQuantity);
    final next = <CartLine>[
      for (final line in lines)
        if (line.item.id != menuItemId)
          line
        else if (clamped > 0)
          CartLine(item: line.item, quantity: clamped),
    ];
    return next.isEmpty ? empty : Cart(restaurant: restaurant, lines: next);
  }

  /// Refreshes prices, availability and restaurant info from the latest menu;
  /// dishes no longer on the menu are dropped.
  Cart syncWith(RestaurantDetail detail) {
    if (restaurant?.id != detail.id) return this;
    final menu = {for (final item in detail.allItems) item.id: item};
    final next = [
      for (final line in lines)
        if (menu[line.item.id] != null) CartLine(item: menu[line.item.id]!, quantity: line.quantity),
    ];
    return next.isEmpty ? empty : Cart(restaurant: CartRestaurant.fromDetail(detail), lines: next);
  }

  /// Dishes that can no longer be ordered.
  List<CartLine> get unavailableLines => lines.where((l) => !l.item.isAvailable).toList();

  /// Serialises for persistence.
  Map<String, dynamic> toJson() => {
        'restaurant': restaurant?.toJson(),
        'lines': lines.map((l) => l.toJson()).toList(),
      };
}
