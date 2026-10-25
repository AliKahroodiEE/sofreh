import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'preferences.dart';

/// Persists the signed-in session (access token, refresh token and the
/// cached user profile).
///
/// **Demo note:** tokens are kept in [SharedPreferences] so the same code runs
/// on web, Android and iOS. A production mobile build should store them with
/// `flutter_secure_storage` (iOS Keychain / Android Keystore) instead; only
/// this class would need to change.
class SessionStorage {
  /// Creates a storage backed by [prefs]. Values are cached in memory so
  /// reads are synchronous (the HTTP interceptor reads them on every request).
  SessionStorage(this._prefs)
      : _accessToken = _prefs.getString(_accessKey),
        _refreshToken = _prefs.getString(_refreshKey);

  static const _accessKey = 'session.accessToken';
  static const _refreshKey = 'session.refreshToken';
  static const _userKey = 'session.user';

  final SharedPreferences _prefs;
  String? _accessToken;
  String? _refreshToken;

  /// Current access token (short-lived JWT), if signed in.
  String? get accessToken => _accessToken;

  /// Current refresh token (rotated on every refresh), if signed in.
  String? get refreshToken => _refreshToken;

  /// Whether a session has been stored.
  bool get hasSession => _refreshToken != null;

  /// The cached user JSON from the last sign-in or profile update.
  Map<String, dynamic>? get cachedUser {
    final raw = _prefs.getString(_userKey);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } on FormatException {
      return null;
    }
  }

  /// Saves a new token pair.
  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    await Future.wait([
      _prefs.setString(_accessKey, accessToken),
      _prefs.setString(_refreshKey, refreshToken),
    ]);
  }

  /// Caches the user's profile JSON.
  Future<void> saveUser(Map<String, dynamic> user) => _prefs.setString(_userKey, jsonEncode(user));

  /// Removes everything (logout or expired session).
  Future<void> clear() async {
    _accessToken = null;
    _refreshToken = null;
    await Future.wait([
      _prefs.remove(_accessKey),
      _prefs.remove(_refreshKey),
      _prefs.remove(_userKey),
    ]);
  }
}

/// The single [SessionStorage] instance.
final sessionStorageProvider = Provider<SessionStorage>(
  (ref) => SessionStorage(ref.watch(sharedPreferencesProvider)),
);
