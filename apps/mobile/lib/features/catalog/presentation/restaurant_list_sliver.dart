import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/state_views.dart';
import '../domain/restaurant_query.dart';
import 'catalog_providers.dart';
import 'restaurant_card.dart';

/// Sliver list of restaurants for [query], with skeletons, empty/error states
/// and a footer for the next page. The parent scroll view calls
/// `loadMore()` when the user nears the end.
class RestaurantListSliver extends ConsumerWidget {
  /// Creates the sliver.
  const RestaurantListSliver({super.key, required this.query, this.emptyTitle = 'رستورانی پیدا نشد'});

  final RestaurantQuery query;
  final String emptyTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(restaurantListProvider(query));
    const padding = EdgeInsets.fromLTRB(16, 8, 16, 0);

    return list.when(
      skipLoadingOnRefresh: true,
      loading: () => SliverPadding(
        padding: padding,
        sliver: SliverList.separated(
          itemCount: 3,
          separatorBuilder: (_, _) => const SizedBox(height: 14),
          itemBuilder: (_, _) => const RestaurantCardSkeleton(),
        ),
      ),
      error: (error, _) => SliverToBoxAdapter(
        child: ErrorView(error: error, onRetry: () => ref.invalidate(restaurantListProvider(query))),
      ),
      data: (page) {
        if (page.items.isEmpty) {
          return SliverToBoxAdapter(
            child: EmptyState(
              icon: Icons.storefront_rounded,
              title: emptyTitle,
              message: 'فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید.',
            ),
          );
        }
        return SliverPadding(
          padding: padding,
          sliver: SliverList.separated(
            itemCount: page.items.length + 1,
            separatorBuilder: (_, _) => const SizedBox(height: 14),
            itemBuilder: (context, i) {
              if (i < page.items.length) return RestaurantCard(restaurant: page.items[i]);
              if (page.isLoadingMore) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: SizedBox(width: 26, height: 26, child: CircularProgressIndicator(strokeWidth: 2.6))),
                );
              }
              if (page.loadMoreError != null) {
                return Center(
                  child: TextButton.icon(
                    onPressed: () => ref.read(restaurantListProvider(query).notifier).loadMore(),
                    icon: const Icon(Icons.refresh_rounded),
                    label: Text(page.loadMoreError!),
                  ),
                );
              }
              if (page.hasMore) {
                // Small screens may not scroll far enough to trigger paging.
                return Center(
                  child: TextButton(
                    onPressed: () => ref.read(restaurantListProvider(query).notifier).loadMore(),
                    child: const Text('نمایش بیشتر'),
                  ),
                );
              }
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Center(
                  child: Text(
                    'همه‌ی رستوران‌ها را دیدید',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textHint),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
