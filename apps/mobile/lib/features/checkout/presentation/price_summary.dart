import 'package:flutter/material.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/pricing/pricing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/common.dart';

/// Subtotal, dish discounts, code discount, delivery fee and total.
class PriceSummary extends StatelessWidget {
  /// Creates the summary.
  const PriceSummary({super.key, required this.breakdown, this.discountCode, this.totalLabel = 'مبلغ قابل پرداخت'});

  final PriceBreakdown breakdown;
  final String? discountCode;
  final String totalLabel;

  @override
  Widget build(BuildContext context) {
    final b = breakdown;
    final theme = Theme.of(context).textTheme;
    return SurfaceCard(
      child: Column(
        children: [
          _Row(label: 'جمع سفارش', value: formatToman(b.subtotal)),
          if (b.itemsDiscount > 0)
            _Row(label: 'تخفیف غذاها', value: '− ${formatToman(b.itemsDiscount)}', color: AppColors.success),
          if (b.codeDiscount > 0)
            _Row(
              label: discountCode == null ? 'کد تخفیف' : 'کد تخفیف ($discountCode)',
              value: '− ${formatToman(b.codeDiscount)}',
              color: AppColors.success,
            ),
          _Row(label: 'هزینه‌ی ارسال', value: formatDeliveryFee(b.deliveryFee)),
          const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider()),
          Row(
            children: [
              Expanded(child: Text(totalLabel, style: theme.titleSmall)),
              Text(formatToman(b.total), style: theme.titleMedium?.copyWith(color: AppColors.primary)),
            ],
          ),
          if (b.itemsDiscount + b.codeDiscount > 0) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(color: AppColors.successSoft, borderRadius: BorderRadius.circular(10)),
              child: Text(
                'سود شما از این خرید: ${formatToman(b.itemsDiscount + b.codeDiscount)}',
                textAlign: TextAlign.center,
                style: theme.labelMedium?.copyWith(color: AppColors.success),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.color});

  final String label;
  final String value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label, style: theme.bodyMedium?.copyWith(color: AppColors.textSecondary))),
          Text(value, style: theme.titleSmall?.copyWith(color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
