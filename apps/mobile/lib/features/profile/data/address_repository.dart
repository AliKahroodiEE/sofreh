import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../domain/address.dart';

/// Saved-address endpoints of the signed-in user.
class AddressRepository {
  /// Creates the repository.
  const AddressRepository(this._dio);

  final Dio _dio;

  /// Newest first.
  Future<List<Address>> list() => guardApi(() async {
        final res = await _dio.get<List<dynamic>>('/users/me/addresses');
        return res.data!.map((e) => Address.fromJson(e as Map<String, dynamic>)).toList();
      });

  /// Saves a new address.
  Future<Address> add({required String title, required String details}) => guardApi(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/users/me/addresses',
          data: {'title': title.trim(), 'details': details.trim()},
        );
        return Address.fromJson(res.data!);
      });

  /// Deletes an address.
  Future<void> remove(int id) => guardApi(() async {
        await _dio.delete<void>('/users/me/addresses/$id');
      });
}

/// The [AddressRepository] instance.
final addressRepositoryProvider = Provider<AddressRepository>((ref) => AddressRepository(ref.watch(dioProvider)));
