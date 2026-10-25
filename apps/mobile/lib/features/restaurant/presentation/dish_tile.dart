import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/common.dart';
import '../../../core/widgets/quantity_stepper.dart';
import '../../cart/domain/cart.dart';
import '../../cart/presentation/cart_controller.dart';
import '../domain/menu_item.dart';

/// A dish row: image, name, description, price (with the struck-through
/// original when discounted) and an add button that turns into a stepper.
class DishTile extends ConsumerWidget {
  /// Creates the tile for [item] of [restaurant].
  const DishTile({super.key, required this.item, required this.restaurant});

  final MenuItem item;
  final CartRestaurant restaurant;

  Future<void> _add(BuildContext context, WidgetRef ref) async {
    final cart = ref.read(cartProvider.notifier);
    if (cart.add(restaurant, item) == AddToCartResult.added) return;

    final current = ref.read(cartProvider).restaurant!.name;
    final replace = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.shopping_bag_rounded, color: AppColors.primary, size: 36),
        title: const Text('سبد خرید جدید؟'),
        content: Text(
          'سبد خرید شما از «$current» است. هر سفارش فقط از یک رستوران ممکن است؛ '
          'سبد قبلی پاک شود و «${item.name}» اضافه شود؟',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('انصراف')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('پاک کردن و افزودن')),
        ],
      ),
    );
    if (replace ?? false) cart.replaceWith(restaurant, item);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quantity = ref.watch(cartProvider.select((c) => c.restaurant?.id == restaurant.id ? c.quantityOf(item.id) : 0));
    final theme = Theme.of(context).textTheme;
    final available = item.isAvailable;
    final orderable = available && restaurant.isOpen;

    return Opacity(
      opacity: available ? 1 : 0.6,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: quantity > 0 ? AppColors.primary.withValues(alpha: 0.5) : AppColors.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                AppNetworkImage(
                  item.image,
                  width: 100,
                  height: 100,
                  borderRadius: BorderRadius.circular(14),
                  greyscale: !available,
                  placeholderIcon: Icons.fastfood_rounded,
                ),
                if (item.hasDiscount && available)
                  PositionedDirectional(
                    top: 6,
                    start: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(8)),
                      child: Text(
                        '${toPersianDigits(item.discountPercent)}٪',
                        style: theme.labelSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 100,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.titleSmall),
                    if (item.description != null && item.description!.isNotEmpty)
                      Text(
                        item.description!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: theme.bodySmall?.copyWith(height: 1.5),
                      ),
                    const Spacer(),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: PriceTag(price: item.finalPrice, original: item.hasDiscount ? item.price : null),
                        ),
                        if (!available)
                          const Pill(label: 'ناموجود', color: AppColors.textSecondary, icon: Icons.block_rounded)
                        else if (!orderable)
                          const SizedBox.shrink()
                        else if (quantity == 0)
                          _AddButton(onPressed: () => _add(context, ref))
                        else
                          QuantityStepper(
                            dense: true,
                            quantity: quantity,
                            max: Cart.maxQuantity,
                            onIncrement: () => ref.read(cartProvider.notifier).increment(item.id),
                            onDecrement: () => ref.read(cartProvider.notifier).decrement(item.id),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AddButton extends StatelessWidget {
  const _AddButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.primary, width: 1.2),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.add_rounded, size: 18, color: AppColors.primary),
              const SizedBox(width: 4),
              Text(
                'افزودن',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
