import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../orders/presentation/orders_controllers.dart';

enum _Phase { redirecting, paying, success, failed }

/// Simulated online payment gateway.
///
/// Shows «انتقال به درگاه پرداخت…», calls `POST /orders/:id/pay` (the API's
/// demo gateway) and continues to the tracking page. In production this
/// would open the real gateway (ZarinPal, IDPay…) and verify on callback.
class PaymentGatewayScreen extends ConsumerStatefulWidget {
  /// Creates the screen for [orderId].
  const PaymentGatewayScreen({super.key, required this.orderId});

  final int orderId;

  @override
  ConsumerState<PaymentGatewayScreen> createState() => _PaymentGatewayScreenState();
}

class _PaymentGatewayScreenState extends ConsumerState<PaymentGatewayScreen> {
  _Phase _phase = _Phase.redirecting;
  String? _error;
  String? _paymentRef;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _run());
  }

  Future<void> _run() async {
    setState(() {
      _phase = _Phase.redirecting;
      _error = null;
    });
    final controller = ref.read(orderDetailProvider(widget.orderId).notifier);
    try {
      final order = await ref.read(orderDetailProvider(widget.orderId).future);
      if (!order.awaitsPayment) return _finish();
      await Future<void>.delayed(const Duration(milliseconds: 1600));
      if (!mounted) return;
      setState(() => _phase = _Phase.paying);
      await Future<void>.delayed(const Duration(milliseconds: 700));
      final paid = await controller.pay();
      if (!mounted) return;
      setState(() {
        _phase = _Phase.success;
        _paymentRef = paid.paymentRef;
      });
      await Future<void>.delayed(const Duration(milliseconds: 1400));
      _finish();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _phase = _Phase.failed;
        _error = ApiException.from(error).message;
      });
    }
  }

  void _finish() {
    if (mounted) context.go(AppRoutes.order(widget.orderId));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    final order = ref.watch(orderDetailProvider(widget.orderId)).value;

    final (IconData icon, Color color, String title, String subtitle) = switch (_phase) {
      _Phase.redirecting => (Icons.lock_rounded, AppColors.info, 'انتقال به درگاه پرداخت…', 'لطفاً صبر کنید؛ این یک درگاه آزمایشی است.'),
      _Phase.paying => (Icons.credit_card_rounded, AppColors.info, 'در حال پرداخت…', 'ارتباط امن با بانک برقرار شد.'),
      _Phase.success => (Icons.check_circle_rounded, AppColors.success, 'پرداخت با موفقیت انجام شد', 'در حال انتقال به صفحه‌ی پیگیری سفارش'),
      _Phase.failed => (Icons.error_rounded, AppColors.error, 'پرداخت ناموفق بود', _error ?? ''),
    };

    return PopScope(
      canPop: _phase == _Phase.failed,
      child: Scaffold(
        backgroundColor: const Color(0xFFF2F5FA),
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.shield_rounded, color: AppColors.info, size: 20),
                        const SizedBox(width: 6),
                        Text('درگاه پرداخت امن (آزمایشی)', style: theme.labelMedium?.copyWith(color: AppColors.info)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 24, offset: Offset(0, 8))],
                      ),
                      child: Column(
                        children: [
                          SizedBox(
                            width: 84,
                            height: 84,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                if (_phase == _Phase.redirecting || _phase == _Phase.paying)
                                  SizedBox.expand(child: CircularProgressIndicator(strokeWidth: 3, color: color)),
                                AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 250),
                                  child: Icon(icon, key: ValueKey(_phase), color: color, size: 44),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(title, style: theme.titleMedium, textAlign: TextAlign.center),
                          const SizedBox(height: 6),
                          Text(subtitle, style: theme.bodySmall, textAlign: TextAlign.center),
                          if (order != null) ...[
                            const SizedBox(height: 20),
                            const Divider(),
                            const SizedBox(height: 12),
                            _Line(label: 'پذیرنده', value: 'سفره — ${order.restaurant?.name ?? ''}'),
                            _Line(label: 'شماره‌ی سفارش', value: toPersianDigits(order.code)),
                            _Line(label: 'مبلغ', value: formatToman(order.total), strong: true),
                            if (_paymentRef != null) _Line(label: 'کد پیگیری', value: _paymentRef!),
                          ],
                        ],
                      ),
                    ),
                    if (_phase == _Phase.failed) ...[
                      const SizedBox(height: 20),
                      FilledButton(onPressed: _run, child: const Text('تلاش دوباره')),
                      TextButton(onPressed: _finish, child: const Text('بعداً پرداخت می‌کنم')),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({required this.label, required this.value, this.strong = false});

  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(label, style: theme.bodySmall),
          const Spacer(),
          Text(value, style: (strong ? theme.titleMedium : theme.titleSmall)?.copyWith(height: 1.4)),
        ],
      ),
    );
  }
}
