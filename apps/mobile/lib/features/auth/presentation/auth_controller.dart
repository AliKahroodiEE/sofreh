import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/session_events.dart';
import '../../../core/storage/session_storage.dart';
import '../data/auth_repository.dart';
import '../domain/app_user.dart';
import '../domain/auth_models.dart';

/// Where the session stands. The router redirects based on this.
sealed class AuthState {
  const AuthState();
}

/// The stored session has not been checked yet (splash screen).
class AuthUnknown extends AuthState {
  const AuthUnknown();
}

/// Signed in as [user].
class Authenticated extends AuthState {
  const Authenticated(this.user);

  final AppUser user;
}

/// Signed out. [sessionExpired] is true when the server rejected the session.
class Unauthenticated extends AuthState {
  const Unauthenticated({this.sessionExpired = false});

  final bool sessionExpired;
}

/// Owns the session lifecycle: restore on start, sign in with OTP, profile
/// name, logout and forced logout when the refresh token is rejected.
class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    final subscription = ref.watch(sessionExpiredEventsProvider).stream.listen((_) {
      if (state is Authenticated) state = const Unauthenticated(sessionExpired: true);
    });
    ref.onDispose(subscription.cancel);
    return const AuthUnknown();
  }

  SessionStorage get _storage => ref.read(sessionStorageProvider);
  AuthRepository get _repository => ref.read(authRepositoryProvider);

  /// The signed-in user, if any.
  AppUser? get user => switch (state) {
        Authenticated(:final user) => user,
        _ => null,
      };

  /// Checks the stored session (called by the splash screen).
  ///
  /// A valid (or refreshable) token leads to [Authenticated]. When the API is
  /// unreachable the cached profile is used so the app still opens offline.
  Future<void> restore() async {
    if (!_storage.hasSession) {
      state = const Unauthenticated();
      return;
    }
    try {
      final user = await _repository.me();
      await _storage.saveUser(user.toJson());
      state = Authenticated(user);
    } on ApiException catch (error) {
      final cached = _storage.cachedUser;
      if (_storage.hasSession && !error.isUnauthorized && cached != null) {
        state = Authenticated(AppUser.fromJson(cached));
      } else {
        await _storage.clear();
        state = const Unauthenticated();
      }
    }
  }

  /// Sends the one-time code.
  Future<OtpRequestResult> requestOtp(String phone) => _repository.requestOtp(phone);

  /// Verifies the code and stores the session.
  Future<AuthResult> verifyOtp(String phone, String code) async {
    final result = await _repository.verifyOtp(phone, code);
    await _storage.saveTokens(accessToken: result.accessToken, refreshToken: result.refreshToken);
    await _storage.saveUser(result.user.toJson());
    state = Authenticated(result.user);
    return result;
  }

  /// Updates the profile name (`PATCH /users/me`).
  Future<void> updateName(String name) async {
    final updated = await _repository.updateName(name.trim());
    await _storage.saveUser(updated.toJson());
    state = Authenticated(updated);
  }

  /// Revokes the refresh token (best effort) and clears the session.
  Future<void> logout() async {
    final refreshToken = _storage.refreshToken;
    if (refreshToken != null) {
      try {
        await _repository.logout(refreshToken);
      } on ApiException {
        // Signing out locally is enough when the server is unreachable.
      }
    }
    await _storage.clear();
    state = const Unauthenticated();
  }
}

/// The session state.
final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);
