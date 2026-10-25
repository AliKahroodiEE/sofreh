import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/common.dart';
import '../../../core/widgets/rating.dart';
import '../../../core/widgets/shimmer.dart';
import '../../../core/widgets/snackbars.dart';
import '../../../core/widgets/state_views.dart';
import '../../checkout/presentation/price_summary.dart';
import '../data/order_live_updates.dart';
import '../domain/order.dart';
import '../domain/order_status.dart';
import 'order_widgets.dart';
import 'orders_controllers.dart';

/// Live order tracking: status stepper (updated over Socket.IO and on app
/// resume), order details, cancel while pending and the review form once
/// delivered.
class OrderTrackingScreen extends ConsumerStatefulWidget {
  /// Creates the screen for [orderId].
  const OrderTrackingScreen({super.key, required this.orderId});

  final int orderId;

  @override
  ConsumerState<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends ConsumerState<OrderTrackingScreen> {
  late final AppLifecycleListener _lifecycle;

  @override
  void initState() {
    super.initState();
    // Events may have been missed while the app was in the background.
    _lifecycle = AppLifecycleListener(onResume: _reload);
  }

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  Future<void> _reload() => ref.read(orderDetailProvider(widget.orderId).notifier).reload();

  void _back() => context.canPop() ? context.pop() : context.go(AppRoutes.orders);

  @override
  Widget build(BuildContext context) {
    final order = ref.watch(orderDetailProvider(widget.orderId));
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: _back),
        title: Text(order.value == null ? 'پیگیری سفارش' : 'سفارش ${toPersianDigits(order.value!.code)}'),
        actions: const [_LiveBadge(), SizedBox(width: 12)],
      ),
      body: order.when(
        skipLoadingOnRefresh: true,
        loading: () => const _TrackingSkeleton(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(orderDetailProvider(widget.orderId))),
        data: (o) => RefreshIndicator(
          onRefresh: _reload,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              _StatusHero(order: o),
              if (o.awaitsPayment) ...[
                const SizedBox(height: 12),
                _PayNowCard(order: o),
              ],
              const SizedBox(height: 12),
              if (o.status == OrderStatus.cancelled)
                const _CancelledCard()
              else
                SurfaceCard(child: OrderStatusStepper(order: o)),
              if (o.status == OrderStatus.delivered) ...[
                const SizedBox(height: 12),
                o.review == null ? _ReviewForm(orderId: o.id) : _ReviewDone(review: o.review!),
              ],
              const SizedBox(height: 12),
              _ItemsCard(order: o),
              const SizedBox(height: 12),
              PriceSummary(breakdown: o.breakdown, totalLabel: 'مبلغ کل'),
              const SizedBox(height: 12),
              _InfoCard(order: o),
              if (o.canCancel) ...[
                const SizedBox(height: 20),
                _CancelButton(orderId: o.id),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _LiveBadge extends ConsumerWidget {
  const _LiveBadge();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connected = ref.watch(realtimeConnectedProvider);
    return ValueListenableBuilder<bool>(
      valueListenable: connected,
      builder: (context, live, _) => Tooltip(
        message: live ? 'وضعیت سفارش به‌صورت زنده به‌روز می‌شود' : 'در حال اتصال برای به‌روزرسانی زنده…',
        child: Pill(
          label: live ? 'زنده' : 'آفلاین',
          icon: live ? Icons.sensors_rounded : Icons.sensors_off_rounded,
          color: live ? AppColors.success : AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _StatusHero extends StatelessWidget {
  const _StatusHero({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    final status = order.status;
    final gradient = switch (status) {
      OrderStatus.delivered => const [Color(0xFF1F9D61), Color(0xFF17804E)],
      OrderStatus.cancelled => const [Color(0xFF75685F), Color(0xFF5A4F48)],
      _ => const [AppColors.primary, Color(0xFFB0182D)],
    };
    final step = status.stepIndex;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: gradient, begin: AlignmentDirectional.topStart, end: AlignmentDirectional.bottomEnd),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), shape: BoxShape.circle),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
                  child: Icon(status.icon, key: ValueKey(status), color: Colors.white, size: 30),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: Text(
                        status.label,
                        key: ValueKey(status),
                        style: theme.titleLarge?.copyWith(color: Colors.white, fontSize: 19),
                      ),
                    ),
                    Text(order.restaurant?.name ?? '', style: theme.bodyMedium?.copyWith(color: Colors.white70)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(status.description, style: theme.bodyMedium?.copyWith(color: Colors.white)),
          if (status.isActive && step >= 0) ...[
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: TweenAnimationBuilder<double>(
                tween: Tween(end: (step + 1) / OrderStatus.steps.length),
                duration: const Duration(milliseconds: 500),
                builder: (_, value, _) => LinearProgressIndicator(
                  value: value,
                  minHeight: 6,
                  backgroundColor: Colors.white.withValues(alpha: 0.25),
                  color: AppColors.saffron,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PayNowCard extends StatelessWidget {
  const _PayNowCard({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.saffronSoft, borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          const Icon(Icons.credit_card_off_rounded, color: Color(0xFF8A5A00)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'این سفارش هنوز پرداخت نشده است.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF6B4600)),
            ),
          ),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size(0, 40)),
            onPressed: () => context.go(AppRoutes.payment(order.id)),
            child: const Text('پرداخت'),
          ),
        ],
      ),
    );
  }
}

class _CancelledCard extends StatelessWidget {
  const _CancelledCard();

  @override
  Widget build(BuildContext context) {
    return const SurfaceCard(
      child: Row(
        children: [
          Icon(Icons.cancel_rounded, color: AppColors.textSecondary),
          SizedBox(width: 10),
          Expanded(child: Text('این سفارش لغو شد. اگر مبلغی پرداخت کرده‌اید، طی ۷۲ ساعت به حساب شما بازمی‌گردد.')),
        ],
      ),
    );
  }
}

class _ItemsCard extends StatelessWidget {
  const _ItemsCard({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.storefront_rounded, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text(order.restaurant?.name ?? '', style: theme.titleSmall)),
              Text('${toPersianDigits(order.itemCount)} غذا', style: theme.bodySmall),
            ],
          ),
          const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider()),
          for (final item in order.items)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
                    decoration: BoxDecoration(color: AppColors.surfaceMuted, borderRadius: BorderRadius.circular(6)),
                    child: Text('${toPersianDigits(item.quantity)}×', style: theme.labelMedium),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(item.name, style: theme.bodyMedium)),
                  if (item.total != null) Text(formatToman(item.total!), style: theme.bodyMedium),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final payment = switch ((order.paymentMethod, order.isPaid)) {
      (PaymentMethod.online, true) => 'پرداخت آنلاین (پرداخت شد)',
      (PaymentMethod.online, false) => 'پرداخت آنلاین (در انتظار پرداخت)',
      (PaymentMethod.cash, true) => 'پرداخت در محل (پرداخت شد)',
      (PaymentMethod.cash, false) => 'پرداخت در محل (هنگام تحویل)',
    };
    return SurfaceCard(
      child: Column(
        children: [
          _InfoRow(icon: Icons.tag_rounded, label: 'کد سفارش', value: toPersianDigits(order.code)),
          _InfoRow(icon: Icons.event_rounded, label: 'زمان ثبت', value: formatDateTime(order.createdAt)),
          _InfoRow(icon: order.paymentMethod.icon, label: 'پرداخت', value: payment),
          if (order.paymentRef != null)
            _InfoRow(icon: Icons.receipt_rounded, label: 'کد پیگیری پرداخت', value: order.paymentRef!),
          _InfoRow(icon: Icons.location_on_rounded, label: 'آدرس', value: order.addressText),
          if (order.note != null && order.note!.isNotEmpty)
            _InfoRow(icon: Icons.sticky_note_2_outlined, label: 'توضیحات', value: order.note!),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          SizedBox(width: 96, child: Text(label, style: theme.bodySmall?.copyWith(height: 1.7))),
          Expanded(child: Text(value, style: theme.bodyMedium?.copyWith(height: 1.5))),
        ],
      ),
    );
  }
}

class _CancelButton extends ConsumerStatefulWidget {
  const _CancelButton({required this.orderId});

  final int orderId;

  @override
  ConsumerState<_CancelButton> createState() => _CancelButtonState();
}

class _CancelButtonState extends ConsumerState<_CancelButton> {
  bool _busy = false;

  Future<void> _cancel() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('لغو سفارش؟'),
        content: const Text('تا پیش از تأیید رستوران می‌توانید سفارش را لغو کنید.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('منصرف شدم')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('لغو سفارش')),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(orderDetailProvider(widget.orderId).notifier).cancel();
      if (mounted) showInfoSnackBar(context, 'سفارش لغو شد.');
    } catch (error) {
      if (mounted) showErrorSnackBar(context, error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: _busy ? null : _cancel,
      icon: _busy
          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
          : const Icon(Icons.close_rounded),
      label: const Text('لغو سفارش'),
    );
  }
}

class _ReviewForm extends ConsumerStatefulWidget {
  const _ReviewForm({required this.orderId});

  final int orderId;

  @override
  ConsumerState<_ReviewForm> createState() => _ReviewFormState();
}

class _ReviewFormState extends ConsumerState<_ReviewForm> {
  final _comment = TextEditingController();
  int _rating = 0;
  bool _sending = false;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _sending = true);
    try {
      await ref.read(orderDetailProvider(widget.orderId).notifier).review(rating: _rating, comment: _comment.text);
      if (mounted) showInfoSnackBar(context, 'ممنون! نظر شما ثبت شد.', icon: Icons.favorite_rounded);
    } catch (error) {
      if (mounted) showErrorSnackBar(context, error);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('از این سفارش راضی بودید؟', style: theme.titleSmall, textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Center(child: StarRatingInput(value: _rating, onChanged: (v) => setState(() => _rating = v))),
          const SizedBox(height: 12),
          TextField(
            controller: _comment,
            maxLength: 500,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              counterText: '',
              hintText: 'نظر خود را درباره‌ی کیفیت غذا و ارسال بنویسید (اختیاری)',
            ),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: _rating == 0 || _sending ? null : _submit,
            child: _sending
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                : const Text('ثبت نظر'),
          ),
        ],
      ),
    );
  }
}

class _ReviewDone extends StatelessWidget {
  const _ReviewDone({required this.review});

  final OrderReview review;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return SurfaceCard(
      child: Row(
        children: [
          const Icon(Icons.favorite_rounded, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('نظر شما ثبت شده است', style: theme.titleSmall),
                if (review.comment != null && review.comment!.isNotEmpty) Text(review.comment!, style: theme.bodySmall),
              ],
            ),
          ),
          StarRow(rating: review.rating, size: 18),
        ],
      ),
    );
  }
}

class _TrackingSkeleton extends StatelessWidget {
  const _TrackingSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Shimmer(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            SkeletonBox(height: 150, radius: 24),
            SizedBox(height: 12),
            SkeletonBox(height: 260, radius: 20),
            SizedBox(height: 12),
            SkeletonBox(height: 120, radius: 20),
          ],
        ),
      ),
    );
  }
}
