import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../storage/session_storage.dart';
import 'auth_interceptor.dart';
import 'session_events.dart';

/// The configured HTTP client plus its [AuthInterceptor] (exposed so other
/// transports, like the Socket.IO connection, can request a fresh token).
class ApiClient {
  /// Builds the client for [AppConfig.apiBaseUrl].
  ApiClient({required SessionStorage storage, required void Function() onSessionExpired}) {
    final options = BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      contentType: Headers.jsonContentType,
      responseType: ResponseType.json,
    );
    dio = Dio(options);
    auth = AuthInterceptor(
      storage: storage,
      dio: dio,
      refreshClient: Dio(options),
      onSessionExpired: onSessionExpired,
    );
    dio.interceptors.add(auth);
  }

  /// Client used by every repository.
  late final Dio dio;

  /// Adds tokens and refreshes them on 401.
  late final AuthInterceptor auth;
}

/// The app-wide [ApiClient].
final apiClientProvider = Provider<ApiClient>((ref) {
  final events = ref.watch(sessionExpiredEventsProvider);
  final client = ApiClient(
    storage: ref.watch(sessionStorageProvider),
    onSessionExpired: () => events.add(null),
  );
  ref.onDispose(() => client.dio.close(force: true));
  return client;
});

/// Shortcut to the [Dio] instance used by repositories.
final dioProvider = Provider<Dio>((ref) => ref.watch(apiClientProvider).dio);
