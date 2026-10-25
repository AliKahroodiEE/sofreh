import 'package:flutter/material.dart';

/// A food category (`GET /cuisines`).
class Cuisine {
  /// Creates a cuisine.
  const Cuisine({required this.id, required this.name, required this.slug, this.icon});

  /// Parses the API JSON.
  factory Cuisine.fromJson(Map<String, dynamic> json) => Cuisine(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        slug: json['slug'] as String,
        icon: json['icon'] as String?,
      );

  final int id;
  final String name;

  /// Used as the `cuisine` filter of `GET /restaurants`.
  final String slug;

  /// One of `iranian, burger, pizza, coffee, cake, salad, breakfast, fish`.
  final String? icon;

  /// Material icon for [icon].
  IconData get iconData => cuisineIcon(icon);
}

/// Maps the API's cuisine `icon` keys to Material icons.
IconData cuisineIcon(String? key) => switch (key) {
      'iranian' => Icons.rice_bowl_rounded,
      'burger' => Icons.lunch_dining_rounded,
      'pizza' => Icons.local_pizza_rounded,
      'coffee' => Icons.local_cafe_rounded,
      'cake' => Icons.cake_rounded,
      'salad' => Icons.eco_rounded,
      'breakfast' => Icons.egg_alt_rounded,
      'fish' => Icons.set_meal_rounded,
      _ => Icons.restaurant_rounded,
    };

/// The short cuisine reference embedded in restaurants.
class CuisineRef {
  /// Creates a reference.
  const CuisineRef({required this.id, required this.name, this.slug});

  /// Parses the API JSON.
  factory CuisineRef.fromJson(Map<String, dynamic> json) => CuisineRef(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        slug: json['slug'] as String?,
      );

  final int id;
  final String name;
  final String? slug;
}
