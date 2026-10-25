import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// The app-wide [SharedPreferences] instance.
///
/// It is loaded once in `main()` and injected with
/// `sharedPreferencesProvider.overrideWithValue(prefs)` so the rest of the
/// app can read it synchronously.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('sharedPreferencesProvider must be overridden in main()'),
);
