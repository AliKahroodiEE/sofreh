import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/rating.dart';
import '../../../core/widgets/shimmer.dart';
import '../../../core/widgets/state_views.dart';
import '../domain/order.dart';
import 'order_widgets.dart';
import 'orders_controllers.dart';

/// Orders tab: history list (newest first); tap opens tracking/details.
class OrdersScreen extends ConsumerWidget {
  /// Creates the screen.
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(ordersListProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('سفارش‌های من'), centerTitle: false),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(ordersListProvider.future),
        child: orders.when(
          skipLoadingOnRefresh: true,
          loading: () => ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: 4,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (_, _) => const Shimmer(child: SkeletonBox(height: 132, radius: 20)),
          ),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [ErrorView(error: e, onRetry: () => ref.invalidate(ordersListProvider))],
          ),
          data: (page) {
            if (page.items.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  const SizedBox(height: 60),
                  EmptyState(
                    icon: Icons.receipt_long_rounded,
                    title: 'هنوز سفارشی ثبت نکرده‌اید',
                    message: 'اولین سفارش‌تان را با کد WELCOME با ۲۰٪ تخفیف ثبت کنید.',
                    actionLabel: 'سفارش غذا',
                    onAction: () => context.go(AppRoutes.home),
                  ),
                ],
              );
            }
            return NotificationListener<ScrollNotification>(
              onNotification: (n) {
                if (n.metrics.extentAfter < 400) ref.read(ordersListProvider.notifier).loadMore();
                return false;
              },
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                itemCount: page.items.length + (page.hasMore || page.isLoadingMore ? 1 : 0),
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, i) {
                  if (i >= page.items.length) {
                    return const Padding(
                      padding: EdgeInsets.all(12),
                      child: Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.4))),
                    );
                  }
                  return OrderCard(order: page.items[i]);
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

/// A row of the order history.
class OrderCard extends StatelessWidget {
  /// Creates the card.
  const OrderCard({super.key, required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return Card(
      child: InkWell(
        onTap: () => context.go(AppRoutes.order(order.id)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(14)),
                    child: const Icon(Icons.storefront_rounded, color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(order.restaurant?.name ?? '', style: theme.titleSmall),
                        Text(formatDateTime(order.createdAt), style: theme.bodySmall),
                      ],
                    ),
                  ),
                  OrderStatusChip(status: order.status),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                order.itemsSummary,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.bodyMedium?.copyWith(color: AppColors.textSecondary),
              ),
              const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider()),
              Row(
                children: [
                  Text(toPersianDigits(order.code), style: theme.labelMedium?.copyWith(color: AppColors.textSecondary)),
                  if (order.review != null) ...[
                    const SizedBox(width: 10),
                    StarRow(rating: order.review!.rating, size: 14),
                  ],
                  const Spacer(),
                  Text(formatToman(order.total), style: theme.titleSmall),
                  const Icon(Icons.chevron_right_rounded, color: AppColors.textHint),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
