import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/realtime/realtime_service.dart';
import '../../../core/storage/session_storage.dart';
import '../../auth/presentation/auth_controller.dart';
import '../domain/order.dart';

/// The Socket.IO connection; open while a user is signed in.
final realtimeServiceProvider = Provider<RealtimeService?>((ref) {
  final userId = ref.watch(authControllerProvider.select((s) => s is Authenticated ? s.user.id : null));
  if (userId == null) return null;

  final storage = ref.read(sessionStorageProvider);
  final service = RealtimeService(
    url: AppConfig.realtimeUrl,
    accessToken: () => storage.accessToken,
    refreshToken: () => ref.read(apiClientProvider).auth.refreshAccessToken(),
  )..connect();
  ref.onDispose(service.dispose);
  return service;
});

/// Live `order.updated` events for the signed-in customer.
final orderUpdatesProvider = Provider<Stream<OrderUpdate>>((ref) {
  final service = ref.watch(realtimeServiceProvider);
  if (service == null) return const Stream.empty();
  return service.stream.where((e) => e.name == 'order.updated').map((e) => OrderUpdate.fromJson(e.data));
});

/// Whether live updates are connected.
final realtimeConnectedProvider = Provider<ValueListenable<bool>>((ref) {
  return ref.watch(realtimeServiceProvider)?.connected ?? ValueNotifier(false);
});
