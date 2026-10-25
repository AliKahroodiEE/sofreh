import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Order lifecycle: `PENDING → CONFIRMED → PREPARING → DELIVERING → DELIVERED`,
/// with `CANCELLED` possible from `PENDING`/`CONFIRMED`.
enum OrderStatus {
  pending('PENDING', 'در انتظار تأیید رستوران', Icons.hourglass_top_rounded),
  confirmed('CONFIRMED', 'تأیید شد', Icons.thumb_up_alt_rounded),
  preparing('PREPARING', 'در حال آماده‌سازی', Icons.soup_kitchen_rounded),
  delivering('DELIVERING', 'پیک در راه است', Icons.delivery_dining_rounded),
  delivered('DELIVERED', 'تحویل داده شد', Icons.check_circle_rounded),
  cancelled('CANCELLED', 'لغو شد', Icons.cancel_rounded);

  const OrderStatus(this.apiValue, this.label, this.icon);

  /// Parses the API value (unknown values fall back to [pending]).
  static OrderStatus fromApi(String? value) =>
      values.firstWhere((s) => s.apiValue == value, orElse: () => OrderStatus.pending);

  /// The steps shown in the tracking stepper, in order.
  static const steps = [pending, confirmed, preparing, delivering, delivered];

  /// Value used by the API.
  final String apiValue;

  /// Persian label (same wording as the API docs).
  final String label;
  final IconData icon;

  /// Position in [steps]; -1 for [cancelled].
  int get stepIndex => steps.indexOf(this);

  /// The order is finished (delivered or cancelled).
  bool get isFinal => this == delivered || this == cancelled;

  /// The order is still moving through the flow.
  bool get isActive => !isFinal;

  /// Short explanation under the status on the tracking page.
  String get description => switch (this) {
        pending => 'سفارش شما ثبت شد و منتظر تأیید رستوران است.',
        confirmed => 'رستوران سفارش شما را پذیرفت.',
        preparing => 'آشپزها در حال آماده کردن غذای شما هستند.',
        delivering => 'پیک سفارش را تحویل گرفت و به سمت شما می‌آید.',
        delivered => 'نوش جان! سفارش به دست شما رسید.',
        cancelled => 'این سفارش لغو شده است.',
      };

  /// Accent colour of the status chip.
  Color get color => switch (this) {
        pending => AppColors.saffron,
        confirmed || preparing => AppColors.info,
        delivering => AppColors.primary,
        delivered => AppColors.success,
        cancelled => AppColors.textSecondary,
      };
}

/// How the customer pays.
enum PaymentMethod {
  online('ONLINE', 'پرداخت آنلاین', Icons.credit_card_rounded),
  cash('CASH', 'پرداخت در محل', Icons.payments_rounded);

  const PaymentMethod(this.apiValue, this.label, this.icon);

  /// Parses the API value.
  static PaymentMethod fromApi(String? value) => value == 'CASH' ? cash : online;

  final String apiValue;
  final String label;
  final IconData icon;
}
