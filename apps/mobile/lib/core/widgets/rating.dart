import 'package:flutter/material.dart';

import '../formatters/persian_format.dart';
import '../theme/app_colors.dart';

/// `★ ۴٫۵ (۱۲)` label for restaurant ratings.
class RatingLabel extends StatelessWidget {
  /// Creates the label.
  const RatingLabel({super.key, required this.rating, this.count, this.style});

  final double rating;
  final int? count;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final textStyle = style ?? Theme.of(context).textTheme.labelMedium;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.star_rounded, color: AppColors.star, size: 18),
        const SizedBox(width: 2),
        Text(rating > 0 ? formatRating(rating) : 'جدید', style: textStyle?.copyWith(fontWeight: FontWeight.w700)),
        if (count != null && count! > 0) ...[
          const SizedBox(width: 3),
          Text('(${toPersianDigits(count)})', style: textStyle?.copyWith(color: AppColors.textSecondary)),
        ],
      ],
    );
  }
}

/// Read-only row of five stars.
class StarRow extends StatelessWidget {
  /// Shows [rating] filled stars out of five.
  const StarRow({super.key, required this.rating, this.size = 16});

  final int rating;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 1; i <= 5; i++)
          Icon(
            i <= rating ? Icons.star_rounded : Icons.star_outline_rounded,
            size: size,
            color: i <= rating ? AppColors.star : AppColors.textHint,
          ),
      ],
    );
  }
}

/// Tappable five-star input.
class StarRatingInput extends StatelessWidget {
  /// Creates the input; [value] is 0 when nothing is selected.
  const StarRatingInput({super.key, required this.value, required this.onChanged, this.size = 40});

  final int value;
  final ValueChanged<int> onChanged;
  final double size;

  static const _labels = ['', 'بد', 'متوسط', 'خوب', 'خیلی خوب', 'عالی'];

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 1; i <= 5; i++)
              IconButton(
                tooltip: _labels[i],
                onPressed: () => onChanged(i),
                iconSize: size,
                padding: const EdgeInsets.all(2),
                constraints: const BoxConstraints(),
                icon: AnimatedScale(
                  scale: i <= value ? 1.08 : 1,
                  duration: const Duration(milliseconds: 150),
                  child: Icon(
                    i <= value ? Icons.star_rounded : Icons.star_outline_rounded,
                    color: i <= value ? AppColors.star : AppColors.textHint,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value == 0 ? 'به این سفارش امتیاز دهید' : _labels[value],
          style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}
