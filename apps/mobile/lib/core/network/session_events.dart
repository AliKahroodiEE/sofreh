import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Signals that the refresh token was rejected and the user must sign in
/// again. The HTTP layer emits; the auth controller listens. This keeps the
/// network code independent from the auth feature.
final sessionExpiredEventsProvider = Provider<StreamController<void>>((ref) {
  final controller = StreamController<void>.broadcast();
  ref.onDispose(controller.close);
  return controller;
});
