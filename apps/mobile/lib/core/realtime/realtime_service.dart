import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

/// An event received from the server.
typedef RealtimeEvent = ({String name, Map<String, dynamic> data});

/// Socket.IO connection to the API's `/realtime` namespace.
///
/// The server authenticates the handshake with `{ auth: { token } }` and
/// drops the connection when the token is invalid or expired. In that case
/// the service asks for a fresh token (through [refreshToken], i.e. the HTTP
/// auth interceptor) and reconnects a few times before giving up.
class RealtimeService {
  /// Creates the service. Call [connect] to open the socket.
  RealtimeService({
    required this.url,
    required this._accessToken,
    required this._refreshToken,
    this.events = const ['order.updated'],
  });

  /// Namespace URL, e.g. `http://localhost:4100/realtime`.
  final String url;

  /// Server events forwarded to [stream].
  final List<String> events;

  final String? Function() _accessToken;
  final Future<String?> Function() _refreshToken;
  final _controller = StreamController<RealtimeEvent>.broadcast();
  io.Socket? _socket;
  bool _disposed = false;
  int _authAttempts = 0;

  /// Whether the socket is currently connected (drives the «زنده» badge).
  final ValueNotifier<bool> connected = ValueNotifier(false);

  /// Every received event.
  Stream<RealtimeEvent> get stream => _controller.stream;

  /// Opens the connection (no-op when already open).
  void connect() {
    if (_disposed || _socket != null) return;
    final socket = io.io(
      url,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .enableForceNew()
          .enableReconnection()
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(10000)
          // Evaluated on every (re)connect, so a refreshed token is picked up.
          .setAuthFn((callback) => callback({'token': _accessToken() ?? ''}))
          .build(),
    );

    socket
      ..onConnect((_) {
        _authAttempts = 0;
        connected.value = true;
      })
      ..onDisconnect((reason) {
        connected.value = false;
        // "io server disconnect": the server rejected us (expired token).
        // Socket.IO does not reconnect by itself in that case.
        if (reason == 'io server disconnect') unawaited(_reauthenticate());
      });

    for (final name in events) {
      socket.on(name, (dynamic data) {
        if (data is Map && !_controller.isClosed) {
          _controller.add((name: name, data: Map<String, dynamic>.from(data)));
        }
      });
    }

    _socket = socket..connect();
  }

  Future<void> _reauthenticate() async {
    if (_disposed || _authAttempts >= 3) return;
    _authAttempts++;
    try {
      final token = await _refreshToken();
      if (token == null) return; // signed out
    } catch (_) {
      // Offline: try again after the delay below.
    }
    await Future<void>.delayed(Duration(seconds: _authAttempts * 2));
    if (!_disposed) _socket?.connect();
  }

  /// Closes the socket and the event stream.
  void dispose() {
    _disposed = true;
    _socket
      ?..clearListeners()
      ..dispose();
    _socket = null;
    connected.dispose();
    _controller.close();
  }
}
