import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/paginated.dart';
import '../../auth/presentation/auth_controller.dart';
import '../data/order_live_updates.dart';
import '../data/orders_repository.dart';
import '../domain/order.dart';

/// Order history with infinite scroll; live updates patch the status in place.
class OrdersListController extends AsyncNotifier<PagedList<Order>> {
  static const _pageSize = 15;

  @override
  Future<PagedList<Order>> build() async {
    ref.watch(authControllerProvider.select((s) => s is Authenticated ? s.user.id : null));
    final subscription = ref.watch(orderUpdatesProvider).listen(_apply);
    ref.onDispose(subscription.cancel);
    final page = await ref.read(ordersRepositoryProvider).list(limit: _pageSize);
    return PagedList.first(page);
  }

  void _apply(OrderUpdate update) {
    final current = state.value;
    if (current == null) return;
    final index = current.items.indexWhere((o) => o.id == update.id);
    if (index < 0) {
      // An order we have not loaded yet (e.g. placed on another device).
      ref.invalidateSelf();
      return;
    }
    final items = [...current.items];
    items[index] = items[index].copyWith(status: update.status, isPaid: update.isPaid, updatedAt: update.updatedAt);
    state = AsyncData(current.copyWith(items: items));
  }

  /// Loads the next page.
  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || !current.hasMore || current.isLoadingMore || state.isLoading) return;
    state = AsyncData(current.copyWith(isLoadingMore: true));
    try {
      final next = await ref.read(ordersRepositoryProvider).list(page: current.page + 1, limit: _pageSize);
      if (!ref.mounted) return;
      state = AsyncData(current.append(next));
    } catch (error) {
      if (!ref.mounted) return;
      state = AsyncData(current.copyWith(isLoadingMore: false, loadMoreError: ApiException.from(error).message));
    }
  }
}

/// My orders.
final ordersListProvider = AsyncNotifierProvider<OrdersListController, PagedList<Order>>(OrdersListController.new);

/// One order, kept fresh by Socket.IO `order.updated` events.
class OrderDetailController extends AsyncNotifier<Order> {
  /// Creates the controller for [orderId].
  OrderDetailController(this.orderId);

  final int orderId;

  @override
  Future<Order> build() async {
    final subscription = ref.watch(orderUpdatesProvider).where((u) => u.id == orderId).listen(_onLiveUpdate);
    ref.onDispose(subscription.cancel);
    return ref.read(ordersRepositoryProvider).get(orderId);
  }

  void _onLiveUpdate(OrderUpdate update) {
    final current = state.value;
    // Show the new status immediately, then fetch the full order (status
    // history timestamps, payment reference…).
    if (current != null) {
      state = AsyncData(current.copyWith(status: update.status, isPaid: update.isPaid, updatedAt: update.updatedAt));
    }
    unawaited(reload());
  }

  /// Re-fetches silently (keeps the current data on failure).
  Future<void> reload() async {
    try {
      final fresh = await ref.read(ordersRepositoryProvider).get(orderId);
      if (ref.mounted) state = AsyncData(fresh);
    } on ApiException {
      // Keep showing the last known state; pull-to-refresh can retry.
    }
  }

  /// Replaces the order (after paying elsewhere in the app).
  void replace(Order order) => state = AsyncData(order);

  /// Cancels the order (only while pending).
  Future<void> cancel() async {
    final order = await ref.read(ordersRepositoryProvider).cancel(orderId);
    if (ref.mounted) state = AsyncData(order);
    ref.invalidate(ordersListProvider);
  }

  /// Simulated online payment.
  Future<Order> pay() async {
    final order = await ref.read(ordersRepositoryProvider).pay(orderId);
    if (ref.mounted) state = AsyncData(order);
    ref.invalidate(ordersListProvider);
    return order;
  }

  /// Rates the delivered order.
  Future<void> review({required int rating, String? comment}) async {
    await ref.read(ordersRepositoryProvider).review(orderId, rating: rating, comment: comment);
    await reload();
    ref.invalidate(ordersListProvider);
  }
}

/// Order detail by id.
final orderDetailProvider =
    AsyncNotifierProvider.autoDispose.family<OrderDetailController, Order, int>(OrderDetailController.new);
