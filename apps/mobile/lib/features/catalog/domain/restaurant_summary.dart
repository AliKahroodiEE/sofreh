import 'cuisine.dart';

/// A restaurant as listed by `GET /restaurants`.
class RestaurantSummary {
  /// Creates a summary.
  const RestaurantSummary({
    required this.id,
    required this.name,
    required this.slug,
    this.logo,
    this.cover,
    required this.rating,
    required this.ratingCount,
    required this.deliveryFee,
    required this.minOrder,
    required this.deliveryTimeMin,
    required this.deliveryTimeMax,
    required this.isOpen,
    required this.cuisines,
    this.maxDiscountPercent = 0,
  });

  /// Parses the API JSON.
  factory RestaurantSummary.fromJson(Map<String, dynamic> json) => RestaurantSummary(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        slug: json['slug'] as String,
        logo: json['logo'] as String?,
        cover: json['cover'] as String?,
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
        maxDiscountPercent: (json['maxDiscountPercent'] as num?)?.toInt() ?? 0,
      );

  final int id;
  final String name;
  final String slug;
  final String? logo;
  final String? cover;
  final double rating;
  final int ratingCount;

  /// Toman.
  final int deliveryFee;

  /// Minimum food total (after dish discounts), toman.
  final int minOrder;
  final int deliveryTimeMin;
  final int deliveryTimeMax;

  /// Closed restaurants are listed but cannot take orders.
  final bool isOpen;
  final List<CuisineRef> cuisines;

  /// Biggest dish discount; show a badge when > 0.
  final int maxDiscountPercent;

  /// «فست‌فود، پیتزا».
  String get cuisineNames => cuisines.map((c) => c.name).join('، ');
}
