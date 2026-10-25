import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/paginated.dart';
import '../domain/order.dart';
import '../domain/order_status.dart';

/// A line of a new order.
typedef OrderLineInput = ({int menuItemId, int quantity});

/// Order endpoints of the signed-in customer.
class OrdersRepository {
  /// Creates the repository.
  const OrdersRepository(this._dio);

  final Dio _dio;

  /// Places an order. Send [addressId] (saved address) or [addressText].
  Future<Order> create({
    required int restaurantId,
    required List<OrderLineInput> items,
    required PaymentMethod paymentMethod,
    int? addressId,
    String? addressText,
    String? discountCode,
    String? note,
  }) =>
      guardApi(() async {
        final res = await _dio.post<Map<String, dynamic>>('/orders', data: {
          'restaurantId': restaurantId,
          'items': [
            for (final line in items) {'menuItemId': line.menuItemId, 'quantity': line.quantity},
          ],
          'addressId': ?addressId,
          'addressText': ?addressText,
          'paymentMethod': paymentMethod.apiValue,
          if (discountCode != null && discountCode.isNotEmpty) 'discountCode': discountCode,
          if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
        });
        return Order.fromJson(res.data!);
      });

  /// My orders, newest first.
  Future<Paginated<Order>> list({int page = 1, int limit = 15}) => guardApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/orders', queryParameters: {'page': page, 'limit': limit});
        return Paginated.fromJson(res.data!, Order.fromJson);
      });

  /// Full order detail.
  Future<Order> get(int id) => guardApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/orders/$id');
        return Order.fromJson(res.data!);
      });

  /// Simulated online payment.
  Future<Order> pay(int id) => guardApi(() async {
        final res = await _dio.post<Map<String, dynamic>>('/orders/$id/pay');
        return Order.fromJson(res.data!);
      });

  /// Cancels a `PENDING` order.
  Future<Order> cancel(int id) => guardApi(() async {
        final res = await _dio.post<Map<String, dynamic>>('/orders/$id/cancel');
        return Order.fromJson(res.data!);
      });

  /// Reviews a delivered order (1–5 stars).
  Future<void> review(int id, {required int rating, String? comment}) => guardApi(() async {
        await _dio.post<void>('/orders/$id/review', data: {
          'rating': rating,
          if (comment != null && comment.trim().isNotEmpty) 'comment': comment.trim(),
        });
      });
}

/// The [OrdersRepository] instance.
final ordersRepositoryProvider = Provider<OrdersRepository>((ref) => OrdersRepository(ref.watch(dioProvider)));
