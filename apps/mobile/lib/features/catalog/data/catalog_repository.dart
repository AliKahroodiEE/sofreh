import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/paginated.dart';
import '../domain/cuisine.dart';
import '../domain/restaurant_query.dart';
import '../domain/restaurant_summary.dart';

/// Public catalog endpoints: cuisines and the restaurant list.
class CatalogRepository {
  /// Creates the repository.
  const CatalogRepository(this._dio);

  final Dio _dio;

  /// All cuisines, in display order.
  Future<List<Cuisine>> cuisines() => guardApi(() async {
        final res = await _dio.get<List<dynamic>>('/cuisines');
        return res.data!.map((e) => Cuisine.fromJson(e as Map<String, dynamic>)).toList();
      });

  /// One page of restaurants matching [query].
  Future<Paginated<RestaurantSummary>> restaurants(RestaurantQuery query, {int page = 1, int limit = 10}) =>
      guardApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/restaurants',
          queryParameters: {...query.toQueryParameters(), 'page': page, 'limit': limit},
        );
        return Paginated.fromJson(res.data!, RestaurantSummary.fromJson);
      });
}

/// The [CatalogRepository] instance.
final catalogRepositoryProvider = Provider<CatalogRepository>((ref) => CatalogRepository(ref.watch(dioProvider)));
