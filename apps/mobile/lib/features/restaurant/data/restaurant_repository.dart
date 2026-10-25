import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/paginated.dart';
import '../domain/restaurant_detail.dart';
import '../domain/review.dart';

/// Restaurant page endpoints: menu and reviews.
class RestaurantRepository {
  /// Creates the repository.
  const RestaurantRepository(this._dio);

  final Dio _dio;

  /// Restaurant with its menu.
  Future<RestaurantDetail> restaurant(String slug) => guardApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/restaurants/${Uri.encodeComponent(slug)}');
        return RestaurantDetail.fromJson(res.data!);
      });

  /// Newest reviews first.
  Future<Paginated<Review>> reviews(int restaurantId, {int page = 1, int limit = 10}) => guardApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/restaurants/$restaurantId/reviews',
          queryParameters: {'page': page, 'limit': limit},
        );
        return Paginated.fromJson(res.data!, Review.fromJson);
      });
}

/// The [RestaurantRepository] instance.
final restaurantRepositoryProvider =
    Provider<RestaurantRepository>((ref) => RestaurantRepository(ref.watch(dioProvider)));

/// Restaurant detail by slug.
final restaurantDetailProvider = FutureProvider.autoDispose.family<RestaurantDetail, String>(
  (ref, slug) => ref.watch(restaurantRepositoryProvider).restaurant(slug),
);

/// First page of reviews by restaurant id.
final restaurantReviewsProvider = FutureProvider.autoDispose.family<Paginated<Review>, int>(
  (ref, id) => ref.watch(restaurantRepositoryProvider).reviews(id),
);
