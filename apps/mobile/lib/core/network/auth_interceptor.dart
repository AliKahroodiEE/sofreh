import 'dart:async';

import 'package:dio/dio.dart';

import '../storage/session_storage.dart';

/// Request option keys understood by [AuthInterceptor].
abstract final class AuthOptions {
  /// Set `extra: {AuthOptions.skipAuth: true}` for public endpoints that must
  /// not carry a token or trigger a refresh (OTP request/verify, refresh).
  static const skipAuth = 'auth.skip';

  static const _retried = 'auth.retried';
}

/// Adds `Authorization: Bearer <accessToken>` to every request and refreshes
/// the token transparently when the API answers `401`.
///
/// Refresh is **single-flight**: when several requests fail at the same time
/// only one `POST /auth/refresh` is sent and every request waits for it, then
/// retries once with the new token. This matters because the API rotates the
/// refresh token: a second concurrent refresh with the old token would fail
/// and log the user out.
class AuthInterceptor extends Interceptor {
  /// Creates the interceptor.
  ///
  /// [dio] is the client the interceptor is attached to (used for retries);
  /// [refreshClient] is a bare client without this interceptor, used for the
  /// refresh call itself so it cannot recurse.
  AuthInterceptor({
    required this._storage,
    required this._dio,
    required this._refreshClient,
    required this._onSessionExpired,
  });

  final SessionStorage _storage;
  final Dio _dio;
  final Dio _refreshClient;
  final void Function() _onSessionExpired;

  /// The refresh in progress, shared by all waiting requests.
  Future<String?>? _refreshing;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _storage.accessToken;
    if (options.extra[AuthOptions.skipAuth] != true && token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final options = err.requestOptions;
    final canRetry = err.response?.statusCode == 401 &&
        options.extra[AuthOptions.skipAuth] != true &&
        options.extra[AuthOptions._retried] != true &&
        _storage.hasSession;
    if (!canRetry) return handler.next(err);

    try {
      // Another request may already have refreshed the token while this one
      // was in flight; then simply retry with the current token.
      final sentToken = options.headers['Authorization'];
      final current = _storage.accessToken;
      final token = (current != null && sentToken != 'Bearer $current') ? current : await refreshAccessToken();
      if (token == null) return handler.next(err);

      options.extra[AuthOptions._retried] = true;
      final response = await _dio.fetch<dynamic>(options);
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }

  /// Returns a fresh access token, starting a refresh only if none is running.
  /// Resolves to `null` when the session is no longer valid.
  Future<String?> refreshAccessToken() {
    return _refreshing ??= _refresh().whenComplete(() => _refreshing = null);
  }

  Future<String?> _refresh() async {
    final refreshToken = _storage.refreshToken;
    if (refreshToken == null) return null;
    try {
      final response = await _refreshClient.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data!;
      final access = data['accessToken'] as String;
      await _storage.saveTokens(accessToken: access, refreshToken: data['refreshToken'] as String);
      return access;
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 400 || status == 401 || status == 403) {
        // The refresh token is invalid or expired: the user must sign in again.
        await _storage.clear();
        _onSessionExpired();
        return null;
      }
      // Network problems: keep the session, the request just fails.
      rethrow;
    }
  }
}
