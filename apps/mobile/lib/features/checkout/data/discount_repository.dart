import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../domain/discount.dart';

/// Discount-code validation.
class DiscountRepository {
  /// Creates the repository.
  const DiscountRepository(this._dio);

  final Dio _dio;

  /// Checks [code] against [amount] (food total after dish discounts, before
  /// delivery). Throws an [ApiException] with the Persian reason when invalid.
  Future<AppliedDiscount> validate(String code, int amount) => guardApi(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/discounts/validate',
          data: {'code': code.trim().toUpperCase(), 'amount': amount},
        );
        return AppliedDiscount.fromJson(res.data!, amount: amount);
      });
}

/// The [DiscountRepository] instance.
final discountRepositoryProvider = Provider<DiscountRepository>((ref) => DiscountRepository(ref.watch(dioProvider)));
