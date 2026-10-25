import '../../../core/pricing/pricing.dart';

/// A dish on a restaurant's menu.
class MenuItem {
  /// Creates a dish.
  const MenuItem({
    required this.id,
    required this.restaurantId,
    required this.name,
    this.description,
    required this.price,
    this.discountPercent = 0,
    this.image,
    this.isAvailable = true,
  });

  /// Parses the API JSON.
  factory MenuItem.fromJson(Map<String, dynamic> json) => MenuItem(
        id: (json['id'] as num).toInt(),
        restaurantId: (json['restaurantId'] as num).toInt(),
        name: json['name'] as String,
        description: json['description'] as String?,
        price: (json['price'] as num).toInt(),
        discountPercent: (json['discountPercent'] as num?)?.toInt() ?? 0,
        image: json['image'] as String?,
        isAvailable: json['isAvailable'] as bool? ?? true,
      );

  final int id;
  final int restaurantId;
  final String name;
  final String? description;

  /// Menu price before the dish discount, toman.
  final int price;
  final int discountPercent;
  final String? image;

  /// Unavailable dishes are shown but cannot be ordered.
  final bool isAvailable;

  /// What the customer pays for one, using the server formula.
  int get finalPrice => discountedPrice(price, discountPercent);

  /// Whether the dish has its own discount.
  bool get hasDiscount => discountPercent > 0;

  /// Serialises for the persisted cart.
  Map<String, dynamic> toJson() => {
        'id': id,
        'restaurantId': restaurantId,
        'name': name,
        'description': description,
        'price': price,
        'discountPercent': discountPercent,
        'image': image,
        'isAvailable': isAvailable,
      };
}

/// A group of dishes ("پیتزاها", "نوشیدنی‌ها"…).
class MenuSection {
  /// Creates a section.
  const MenuSection({required this.id, required this.name, required this.items});

  /// Parses the API JSON.
  factory MenuSection.fromJson(Map<String, dynamic> json) => MenuSection(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        items: (json['items'] as List<dynamic>? ?? const [])
            .map((e) => MenuItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  final int id;
  final String name;
  final List<MenuItem> items;
}
