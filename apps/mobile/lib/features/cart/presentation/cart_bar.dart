import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import 'cart_controller.dart';

/// Sticky «مشاهده‌ی سبد خرید» bar with item count and total. Hidden when
/// the cart is empty. [compact] is the variant shown above the bottom tabs.
class CartBar extends ConsumerWidget {
  /// Creates the bar.
  const CartBar({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final theme = Theme.of(context).textTheme;

    final bar = cart.isEmpty
        ? const SizedBox(width: double.infinity)
        : Padding(
            padding: EdgeInsets.fromLTRB(12, compact ? 8 : 10, 12, compact ? 8 : 12),
            child: Material(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(16),
              elevation: 6,
              shadowColor: AppColors.primary.withValues(alpha: 0.4),
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => context.push(AppRoutes.checkout),
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 14, vertical: compact ? 10 : 14),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          toPersianDigits(cart.itemCount),
                          style: theme.titleSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'مشاهده‌ی سبد خرید',
                              style: theme.titleSmall?.copyWith(color: Colors.white, height: 1.3),
                            ),
                            if (compact)
                              Text(
                                cart.restaurant!.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: theme.bodySmall?.copyWith(color: Colors.white70, height: 1.3),
                              ),
                          ],
                        ),
                      ),
                      Text(
                        formatToman(cart.foodTotal),
                        style: theme.titleSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right_rounded, color: Colors.white),
                    ],
                  ),
                ),
              ),
            ),
          );

    return AnimatedSize(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      alignment: Alignment.bottomCenter,
      child: bar,
    );
  }
}
