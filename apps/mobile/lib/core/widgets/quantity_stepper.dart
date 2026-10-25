import 'package:flutter/material.dart';

import '../formatters/persian_format.dart';
import '../theme/app_colors.dart';

/// Compact `+ n −` control used for dishes and cart lines.
class QuantityStepper extends StatelessWidget {
  /// Creates the stepper.
  const QuantityStepper({
    super.key,
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
    this.max = 20,
    this.dense = false,
  });

  final int quantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  /// Upper bound per dish (the API allows 20).
  final int max;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final size = dense ? 30.0 : 34.0;
    return Container(
      height: size + 6,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            icon: Icons.add_rounded,
            size: size,
            filled: true,
            onPressed: quantity < max ? onIncrement : null,
            tooltip: 'افزودن',
          ),
          SizedBox(
            width: dense ? 28 : 32,
            child: Text(
              toPersianDigits(quantity),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppColors.primaryDark),
            ),
          ),
          _StepButton(
            icon: quantity == 1 ? Icons.delete_outline_rounded : Icons.remove_rounded,
            size: size,
            onPressed: onDecrement,
            tooltip: quantity == 1 ? 'حذف' : 'کم کردن',
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({
    required this.icon,
    required this.size,
    required this.onPressed,
    required this.tooltip,
    this.filled = false,
  });

  final IconData icon;
  final double size;
  final VoidCallback? onPressed;
  final String tooltip;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: filled ? AppColors.primary : Colors.white,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onPressed,
          child: SizedBox(
            width: size,
            height: size,
            child: Icon(icon, size: 18, color: filled ? Colors.white : AppColors.primary),
          ),
        ),
      ),
    );
  }
}
