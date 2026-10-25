import 'package:flutter/material.dart';

import '../formatters/persian_format.dart';
import '../theme/app_colors.dart';

/// Small rounded label (discount badges, status chips…).
class Pill extends StatelessWidget {
  /// Creates the pill.
  const Pill({
    super.key,
    required this.label,
    this.icon,
    this.color = AppColors.primary,
    this.background,
    this.dense = false,
  });

  final String label;
  final IconData? icon;
  final Color color;
  final Color? background;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: dense ? 7 : 10, vertical: dense ? 2 : 4),
      decoration: BoxDecoration(
        color: background ?? color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: dense ? 12 : 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                  fontSize: dense ? 10.5 : 11.5,
                  height: 1.5,
                ),
          ),
        ],
      ),
    );
  }
}

/// Price with the original (struck-through) price when discounted.
class PriceTag extends StatelessWidget {
  /// Creates the tag. [original] is shown only when it is larger than [price].
  const PriceTag({super.key, required this.price, this.original, this.large = false});

  final int price;
  final int? original;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    final hasDiscount = original != null && original! > price;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (hasDiscount)
          Text(
            formatNumber(original!),
            style: theme.bodySmall?.copyWith(
              decoration: TextDecoration.lineThrough,
              decorationColor: AppColors.textHint,
              color: AppColors.textHint,
              height: 1.2,
            ),
          ),
        Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: formatNumber(price),
                style: (large ? theme.titleMedium : theme.titleSmall)?.copyWith(fontWeight: FontWeight.w800),
              ),
              TextSpan(text: ' تومان', style: theme.bodySmall?.copyWith(color: AppColors.textSecondary)),
            ],
          ),
        ),
      ],
    );
  }
}

/// Title row for a section, with an optional trailing action.
class SectionHeader extends StatelessWidget {
  /// Creates the header.
  const SectionHeader({super.key, required this.title, this.trailing, this.padding});

  final String title;
  final Widget? trailing;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? const EdgeInsets.fromLTRB(16, 20, 16, 10),
      child: Row(
        children: [
          Expanded(child: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 17))),
          ?trailing,
        ],
      ),
    );
  }
}

/// White rounded container used for grouped content.
class SurfaceCard extends StatelessWidget {
  /// Creates the card.
  const SurfaceCard({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.margin});

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    );
  }
}

/// The Sofreh brand mark: a rounded tile with a dish icon and the wordmark.
class SofrehLogo extends StatelessWidget {
  /// Creates the logo. [light] renders it for dark/red backgrounds.
  const SofrehLogo({super.key, this.size = 56, this.light = false, this.showName = true});

  final double size;
  final bool light;
  final bool showName;

  @override
  Widget build(BuildContext context) {
    final tile = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: light ? Colors.white : AppColors.primary,
        borderRadius: BorderRadius.circular(size * 0.3),
        boxShadow: [
          BoxShadow(
            color: (light ? Colors.black : AppColors.primary).withValues(alpha: 0.18),
            blurRadius: size * 0.3,
            offset: Offset(0, size * 0.1),
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(Icons.ramen_dining_rounded, size: size * 0.56, color: light ? AppColors.primary : Colors.white),
          Positioned(
            top: size * 0.16,
            right: size * 0.18,
            child: Container(
              width: size * 0.14,
              height: size * 0.14,
              decoration: const BoxDecoration(color: AppColors.saffron, shape: BoxShape.circle),
            ),
          ),
        ],
      ),
    );
    if (!showName) return tile;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        tile,
        SizedBox(height: size * 0.22),
        Text(
          'سفره',
          style: TextStyle(
            fontFamily: 'Vazirmatn',
            fontWeight: FontWeight.w800,
            fontSize: size * 0.5,
            height: 1.2,
            color: light ? Colors.white : AppColors.primary,
          ),
        ),
      ],
    );
  }
}
