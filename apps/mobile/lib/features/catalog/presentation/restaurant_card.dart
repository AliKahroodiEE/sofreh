import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/common.dart';
import '../../../core/widgets/rating.dart';
import '../../../core/widgets/shimmer.dart';
import '../domain/restaurant_summary.dart';

/// Full-width restaurant card used in lists.
class RestaurantCard extends StatelessWidget {
  /// Creates the card.
  const RestaurantCard({super.key, required this.restaurant});

  final RestaurantSummary restaurant;

  @override
  Widget build(BuildContext context) {
    final r = restaurant;
    final theme = Theme.of(context).textTheme;
    return Card(
      child: InkWell(
        onTap: () => context.push(AppRoutes.restaurant(r.slug)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 2.15,
              child: _Cover(restaurant: r, showTime: true),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          r.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.titleMedium?.copyWith(color: r.isOpen ? null : AppColors.textSecondary),
                        ),
                      ),
                      RatingLabel(rating: r.rating, count: r.ratingCount),
                    ],
                  ),
                  Text(r.cuisineNames, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.bodySmall),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.delivery_dining_rounded, size: 18, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        formatDeliveryFee(r.deliveryFee),
                        style: theme.labelMedium?.copyWith(
                          color: r.deliveryFee == 0 ? AppColors.success : AppColors.textPrimary,
                        ),
                      ),
                      const _Dot(),
                      Flexible(
                        child: Text(
                          'حداقل سفارش ${formatToman(r.minOrder)}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.labelMedium?.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Narrow card for horizontal carousels («تخفیف‌دارها»).
class RestaurantCompactCard extends StatelessWidget {
  /// Creates the card.
  const RestaurantCompactCard({super.key, required this.restaurant});

  /// Width of the card inside a carousel.
  static const width = 248.0;

  final RestaurantSummary restaurant;

  @override
  Widget build(BuildContext context) {
    final r = restaurant;
    final theme = Theme.of(context).textTheme;
    return SizedBox(
      width: width,
      child: Card(
        child: InkWell(
          onTap: () => context.push(AppRoutes.restaurant(r.slug)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(height: 118, child: _Cover(restaurant: r)),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(r.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.titleSmall),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        RatingLabel(rating: r.rating, count: r.ratingCount, style: theme.labelSmall?.copyWith(fontSize: 12)),
                        const _Dot(),
                        Flexible(
                          child: Text(
                            formatDeliveryTime(r.deliveryTimeMin, r.deliveryTimeMax),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.labelSmall?.copyWith(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Cover extends StatelessWidget {
  const _Cover({required this.restaurant, this.showTime = false});

  final RestaurantSummary restaurant;
  final bool showTime;

  @override
  Widget build(BuildContext context) {
    final r = restaurant;
    return Stack(
      fit: StackFit.expand,
      children: [
        AppNetworkImage(r.cover, greyscale: !r.isOpen),
        if (!r.isOpen) ...[
          const ColoredBox(color: Color(0x66000000)),
          const Center(
            child: Pill(
              label: 'بسته است',
              icon: Icons.lock_clock_rounded,
              color: Colors.white,
              background: Color(0xCC221B17),
            ),
          ),
        ],
        if (r.maxDiscountPercent > 0)
          PositionedDirectional(
            top: 10,
            start: 10,
            child: DiscountBadge(percent: r.maxDiscountPercent, upTo: true),
          ),
        if (showTime)
          PositionedDirectional(
            bottom: 10,
            end: 10,
            child: Pill(
              label: formatDeliveryTime(r.deliveryTimeMin, r.deliveryTimeMax),
              icon: Icons.schedule_rounded,
              color: AppColors.textPrimary,
              background: Colors.white.withValues(alpha: 0.95),
            ),
          ),
      ],
    );
  }
}

/// Red «تا ۱۵٪ تخفیف» badge.
class DiscountBadge extends StatelessWidget {
  /// Creates the badge.
  const DiscountBadge({super.key, required this.percent, this.upTo = false});

  final int percent;
  final bool upTo;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.35), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.local_offer_rounded, size: 13, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            '${upTo ? 'تا ' : ''}${toPersianDigits(percent)}٪ تخفیف',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11.5),
          ),
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot();

  @override
  Widget build(BuildContext context) => Container(
        width: 4,
        height: 4,
        margin: const EdgeInsets.symmetric(horizontal: 8),
        decoration: const BoxDecoration(color: AppColors.textHint, shape: BoxShape.circle),
      );
}

/// Loading placeholder shaped like [RestaurantCard].
class RestaurantCardSkeleton extends StatelessWidget {
  /// Creates the skeleton.
  const RestaurantCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(aspectRatio: 2.15, child: SkeletonBox(radius: 0)),
            Padding(
              padding: EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonBox(width: 160, height: 16),
                  SizedBox(height: 8),
                  SkeletonBox(width: 100, height: 12),
                  SizedBox(height: 10),
                  SkeletonBox(width: 220, height: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
