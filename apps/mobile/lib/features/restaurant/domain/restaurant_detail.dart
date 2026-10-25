import '../../catalog/domain/cuisine.dart';
import 'menu_item.dart';

/// A restaurant with its full menu (`GET /restaurants/:slug`).
class RestaurantDetail {
  /// Creates the detail.
  const RestaurantDetail({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.logo,
    this.cover,
    this.address,
    required this.rating,
    required this.ratingCount,
    required this.deliveryFee,
    required this.minOrder,
    required this.deliveryTimeMin,
    required this.deliveryTimeMax,
    required this.isOpen,
    required this.cuisines,
    required this.sections,
  });

  /// Parses the API JSON.
  factory RestaurantDetail.fromJson(Map<String, dynamic> json) => RestaurantDetail(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        slug: json['slug'] as String,
        description: json['description'] as String?,
        logo: json['logo'] as String?,
        cover: json['cover'] as String?,
        address: json['address'] as String?,
        rating: (json['rating'] as num?)?.toDouble() ?? 0,
        ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
        deliveryFee: (json['deliveryFee'] as num).toInt(),
        minOrder: (json['minOrder'] as num).toInt(),
        deliveryTimeMin: (json['deliveryTimeMin'] as num).toInt(),
        deliveryTimeMax: (json['deliveryTimeMax'] as num).toInt(),
        isOpen: json['isOpen'] as bool? ?? true,
        cuisines: (json['cuisines'] as List<dynamic>? ?? const [])
            .map((e) => CuisineRef.fromJson(e as Map<String, dynamic>))
            .toList(),
        sections: (json['sections'] as List<dynamic>? ?? const [])
            .map((e) => MenuSection.fromJson(e as Map<String, dynamic>))
            .where((s) => s.items.isNotEmpty)
            .toList(),
      );

  final int id;
  final String name;
  final String slug;
  final String? description;
  final String? logo;
  final String? cover;
  final String? address;
  final double rating;
  final int ratingCount;
  final int deliveryFee;
  final int minOrder;
  final int deliveryTimeMin;
  final int deliveryTimeMax;
  final bool isOpen;
  final List<CuisineRef> cuisines;

  /// Non-empty menu sections in display order.
  final List<MenuSection> sections;

  /// «فست‌فود، پیتزا».
  String get cuisineNames => cuisines.map((c) => c.name).join('، ');

  /// Every dish, across sections.
  Iterable<MenuItem> get allItems => sections.expand((s) => s.items);
}
