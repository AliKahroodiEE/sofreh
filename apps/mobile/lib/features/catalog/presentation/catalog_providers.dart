import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/paginated.dart';
import '../data/catalog_repository.dart';
import '../domain/cuisine.dart';
import '../domain/restaurant_query.dart';
import '../domain/restaurant_summary.dart';

/// All cuisines (home chips and search filters).
final cuisinesProvider = FutureProvider<List<Cuisine>>((ref) => ref.watch(catalogRepositoryProvider).cuisines());

/// Restaurants with discounted dishes, for the «تخفیف‌دارها» row.
final discountedRestaurantsProvider = FutureProvider.autoDispose<List<RestaurantSummary>>((ref) async {
  final page = await ref
      .watch(catalogRepositoryProvider)
      .restaurants(const RestaurantQuery(hasDiscount: true), limit: 10);
  return page.items;
});

/// An infinitely scrolling restaurant list for one [RestaurantQuery].
class RestaurantListController extends AsyncNotifier<PagedList<RestaurantSummary>> {
  /// Creates the controller for [query].
  RestaurantListController(this.query);

  /// Filters of this list.
  final RestaurantQuery query;

  /// Items per request.
  static const pageSize = 10;

  @override
  Future<PagedList<RestaurantSummary>> build() async {
    final page = await ref.watch(catalogRepositoryProvider).restaurants(query, limit: pageSize);
    return PagedList.first(page);
  }

  /// Loads the next page (no-op while loading or at the end).
  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || !current.hasMore || current.isLoadingMore || state.isLoading) return;
    state = AsyncData(current.copyWith(isLoadingMore: true));
    try {
      final next = await ref
          .read(catalogRepositoryProvider)
          .restaurants(query, page: current.page + 1, limit: pageSize);
      if (!ref.mounted) return;
      state = AsyncData(current.append(next));
    } catch (error) {
      if (!ref.mounted) return;
      state = AsyncData(current.copyWith(isLoadingMore: false, loadMoreError: ApiException.from(error).message));
    }
  }
}

/// Restaurant list per query.
final restaurantListProvider = AsyncNotifierProvider.autoDispose
    .family<RestaurantListController, PagedList<RestaurantSummary>, RestaurantQuery>(RestaurantListController.new);

/// Sort chosen on the home screen.
class HomeSortController extends Notifier<RestaurantSort> {
  @override
  RestaurantSort build() => RestaurantSort.recommended;

  /// Changes the sort order.
  void select(RestaurantSort sort) => state = sort;
}

/// The home screen's sort order.
final homeSortProvider = NotifierProvider<HomeSortController, RestaurantSort>(HomeSortController.new);
