import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/common.dart';
import '../../../core/widgets/rating.dart';
import '../../../core/widgets/shimmer.dart';
import '../../../core/widgets/state_views.dart';
import '../data/restaurant_repository.dart';
import '../domain/review.dart';

/// «نظرات کاربران» on the restaurant page (`GET /restaurants/:id/reviews`).
class ReviewsSection extends ConsumerWidget {
  /// Creates the section.
  const ReviewsSection({super.key, required this.restaurantId, required this.rating, required this.ratingCount});

  final int restaurantId;
  final double rating;
  final int ratingCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviews = ref.watch(restaurantReviewsProvider(restaurantId));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(
          title: 'نظرات کاربران',
          trailing: RatingLabel(rating: rating, count: ratingCount),
          padding: const EdgeInsets.fromLTRB(16, 28, 16, 10),
        ),
        reviews.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Shimmer(child: SkeletonBox(height: 96, radius: 18)),
          ),
          error: (e, _) => ErrorView(
            error: e,
            compact: true,
            onRetry: () => ref.invalidate(restaurantReviewsProvider(restaurantId)),
          ),
          data: (page) => page.items.isEmpty
              ? Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SurfaceCard(
                    child: Row(
                      children: [
                        const Icon(Icons.rate_review_outlined, color: AppColors.textHint),
                        const SizedBox(width: 12),
                        Text('هنوز نظری ثبت نشده است.', style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    for (final review in page.items)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                        child: ReviewCard(review: review),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}

/// One customer review.
class ReviewCard extends StatelessWidget {
  /// Creates the card.
  const ReviewCard({super.key, required this.review});

  final Review review;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    final name = review.userName ?? 'کاربر سفره';
    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.saffronSoft,
                child: Text(
                  name.characters.first,
                  style: theme.titleSmall?.copyWith(color: const Color(0xFF8A5A00)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: theme.titleSmall?.copyWith(height: 1.3)),
                    Text(formatDate(review.createdAt), style: theme.bodySmall?.copyWith(height: 1.3)),
                  ],
                ),
              ),
              StarRow(rating: review.rating),
            ],
          ),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(review.comment!, style: theme.bodyMedium),
          ],
        ],
      ),
    );
  }
}
