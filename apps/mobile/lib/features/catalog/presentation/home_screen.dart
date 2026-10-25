import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/common.dart';
import '../../../core/widgets/shimmer.dart';
import '../../../core/widgets/snackbars.dart';
import '../../../core/widgets/state_views.dart';
import '../../profile/presentation/address_controller.dart';
import '../../profile/presentation/address_widgets.dart';
import '../domain/cuisine.dart';
import '../domain/restaurant_query.dart';
import 'catalog_providers.dart';
import 'restaurant_card.dart';
import 'restaurant_list_sliver.dart';

/// Home tab: delivery address, search entry, cuisines, promo, discounted
/// restaurants and the full (sortable, paginated) restaurant list.
class HomeScreen extends ConsumerWidget {
  /// Creates the screen.
  const HomeScreen({super.key});

  Future<void> _refresh(WidgetRef ref, RestaurantQuery query) async {
    ref
      ..invalidate(cuisinesProvider)
      ..invalidate(discountedRestaurantsProvider)
      ..invalidate(addressesProvider);
    final _ = await ref.refresh(restaurantListProvider(query).future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sort = ref.watch(homeSortProvider);
    final query = RestaurantQuery(sort: sort);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => _refresh(ref, query),
          child: NotificationListener<ScrollNotification>(
            onNotification: (n) {
              if (n.metrics.axis == Axis.vertical && n.metrics.extentAfter < 600) {
                ref.read(restaurantListProvider(query).notifier).loadMore();
              }
              return false;
            },
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(12, 8, 16, 4),
                    child: Row(
                      children: [
                        Expanded(child: DeliveryAddressHeader()),
                        SizedBox(width: 8),
                        SofrehLogo(size: 38, showName: false),
                      ],
                    ),
                  ),
                ),
                const SliverToBoxAdapter(child: _SearchEntry()),
                const SliverToBoxAdapter(child: _CuisineRow()),
                const SliverToBoxAdapter(child: _PromoBanner()),
                const SliverToBoxAdapter(child: _DiscountedRow()),
                SliverToBoxAdapter(
                  child: SectionHeader(
                    title: 'همه‌ی رستوران‌ها',
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  ),
                ),
                SliverToBoxAdapter(
                  child: SortChips(
                    selected: sort,
                    onSelected: (s) => ref.read(homeSortProvider.notifier).select(s),
                  ),
                ),
                RestaurantListSliver(query: query),
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SearchEntry extends StatelessWidget {
  const _SearchEntry();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Material(
        color: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => context.go(AppRoutes.searchWith(focus: true)),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            child: Row(
              children: [
                const Icon(Icons.search_rounded, color: AppColors.textSecondary),
                const SizedBox(width: 10),
                Text(
                  'جستجوی رستوران یا غذا…',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textHint),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CuisineRow extends ConsumerWidget {
  const _CuisineRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cuisines = ref.watch(cuisinesProvider);
    return SizedBox(
      height: 104,
      child: cuisines.when(
        loading: () => ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: 6,
          separatorBuilder: (_, _) => const SizedBox(width: 14),
          itemBuilder: (_, _) => const Shimmer(
            child: Column(children: [SkeletonBox(width: 58, height: 58, radius: 20), SizedBox(height: 8), SkeletonBox(width: 44, height: 10)]),
          ),
        ),
        error: (e, _) => ErrorView(error: e, compact: true, onRetry: () => ref.invalidate(cuisinesProvider)),
        data: (list) => ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: list.length,
          separatorBuilder: (_, _) => const SizedBox(width: 10),
          itemBuilder: (context, i) => CuisineTile(
            cuisine: list[i],
            onTap: () => context.go(AppRoutes.searchWith(cuisine: list[i].slug)),
          ),
        ),
      ),
    );
  }
}

/// Round icon + label for a cuisine.
class CuisineTile extends StatelessWidget {
  /// Creates the tile.
  const CuisineTile({super.key, required this.cuisine, this.onTap, this.selected = false});

  final Cuisine cuisine;
  final VoidCallback? onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: SizedBox(
        width: 68,
        child: Column(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: selected ? AppColors.primary : AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: selected ? AppColors.primary : AppColors.border),
              ),
              child: Icon(cuisine.iconData, color: selected ? Colors.white : AppColors.primary, size: 28),
            ),
            const SizedBox(height: 6),
            Text(
              cuisine.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

class _PromoBanner extends StatelessWidget {
  const _PromoBanner();

  static const code = 'WELCOME';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
      child: Material(
        borderRadius: BorderRadius.circular(22),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () async {
            await Clipboard.setData(const ClipboardData(text: code));
            if (context.mounted) showInfoSnackBar(context, 'کد $code کپی شد؛ هنگام پرداخت وارد کنید.', icon: Icons.copy_rounded);
          },
          child: Ink(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, Color(0xFFB0182D)],
                begin: AlignmentDirectional.centerStart,
                end: AlignmentDirectional.centerEnd,
              ),
            ),
            child: Stack(
              children: [
                PositionedDirectional(
                  end: -30,
                  top: -30,
                  child: Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.saffron.withValues(alpha: 0.95)),
                  ),
                ),
                const PositionedDirectional(
                  end: 18,
                  top: 22,
                  child: Icon(Icons.redeem_rounded, size: 52, color: Colors.white),
                ),
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(18, 18, 112, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '۲۰٪ تخفیف اولین سفارش',
                        style: theme.titleLarge?.copyWith(color: Colors.white, fontSize: 17, height: 1.3),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'تا سقف ۶۰ هزار تومان، برای همه‌ی رستوران‌ها',
                        style: theme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.85)),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('کد: ', style: theme.labelMedium?.copyWith(color: AppColors.textSecondary)),
                            Text(
                              code,
                              style: theme.labelLarge?.copyWith(color: AppColors.primary, letterSpacing: 1.5),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.copy_rounded, size: 14, color: AppColors.primary),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DiscountedRow extends ConsumerWidget {
  const _DiscountedRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final restaurants = ref.watch(discountedRestaurantsProvider);
    if (restaurants.hasValue && restaurants.value!.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeader(
          title: 'تخفیف‌دارها',
          trailing: Pill(label: 'پیشنهاد ویژه', icon: Icons.local_fire_department_rounded),
          padding: EdgeInsets.fromLTRB(16, 24, 16, 10),
        ),
        SizedBox(
          height: 196,
          child: restaurants.when(
            loading: () => ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 3,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (_, _) => const Shimmer(
                child: SkeletonBox(width: RestaurantCompactCard.width, height: 190, radius: 20),
              ),
            ),
            error: (e, _) => ErrorView(error: e, compact: true, onRetry: () => ref.invalidate(discountedRestaurantsProvider)),
            data: (list) => ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: list.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (_, i) => RestaurantCompactCard(restaurant: list[i]),
            ),
          ),
        ),
      ],
    );
  }
}

/// Horizontal row of sort chips.
class SortChips extends StatelessWidget {
  /// Creates the row.
  const SortChips({super.key, required this.selected, required this.onSelected});

  final RestaurantSort selected;
  final ValueChanged<RestaurantSort> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        itemCount: RestaurantSort.values.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final sort = RestaurantSort.values[i];
          final isSelected = sort == selected;
          return ChoiceChip(
            label: Text(sort.label),
            selected: isSelected,
            labelStyle: theme.labelMedium?.copyWith(color: isSelected ? Colors.white : AppColors.textPrimary),
            onSelected: (_) => onSelected(sort),
          );
        },
      ),
    );
  }
}
