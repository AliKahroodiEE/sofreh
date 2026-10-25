import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/auth_interceptor.dart';
import '../domain/app_user.dart';
import '../domain/auth_models.dart';

/// Auth and profile endpoints.
class AuthRepository {
  /// Creates the repository.
  const AuthRepository(this._dio);

  final Dio _dio;

  static final _public = Options(extra: {AuthOptions.skipAuth: true});

  /// Sends a one-time code by SMS (`devCode` is returned in dev mode).
  Future<OtpRequestResult> requestOtp(String phone) => guardApi(() async {
        final res = await _dio.post<Map<String, dynamic>>('/auth/otp/request', data: {'phone': phone}, options: _public);
        return OtpRequestResult.fromJson(res.data!);
      });

  /// Exchanges the code for a token pair.
  Future<AuthResult> verifyOtp(String phone, String code) => guardApi(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/auth/otp/verify',
          data: {'phone': phone, 'code': code},
          options: _public,
        );
        return AuthResult.fromJson(res.data!);
      });

  /// The current user (refreshes the token through the interceptor if needed).
  Future<AppUser> me() => guardApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/auth/me');
        return AppUser.fromJson(res.data!);
      });

  /// Sets the user's full name.
  Future<AppUser> updateName(String name) => guardApi(() async {
        final res = await _dio.patch<Map<String, dynamic>>('/users/me', data: {'name': name});
        return AppUser.fromJson(res.data!);
      });

  /// Revokes the refresh token on the server.
  Future<void> logout(String refreshToken) => guardApi(() async {
        await _dio.post<void>('/auth/logout', data: {'refreshToken': refreshToken});
      });
}

/// The [AuthRepository] instance.
final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref.watch(dioProvider)));
