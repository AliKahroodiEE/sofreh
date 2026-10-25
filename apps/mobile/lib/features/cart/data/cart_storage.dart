import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/storage/preferences.dart';
import '../domain/cart.dart';

/// Keeps the cart across app restarts / page reloads.
class CartStorage {
  /// Creates the storage.
  const CartStorage(this._prefs);

  static const _key = 'cart.v1';
  final SharedPreferences _prefs;

  /// The saved cart, or an empty one (also when the data is corrupt).
  Cart load() {
    final raw = _prefs.getString(_key);
    if (raw == null) return Cart.empty;
    try {
      return Cart.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return Cart.empty;
    }
  }

  /// Saves [cart] (an empty cart removes the key).
  Future<void> save(Cart cart) =>
      cart.isEmpty ? _prefs.remove(_key) : _prefs.setString(_key, jsonEncode(cart.toJson()));
}

/// The [CartStorage] instance.
final cartStorageProvider = Provider<CartStorage>((ref) => CartStorage(ref.watch(sharedPreferencesProvider)));
