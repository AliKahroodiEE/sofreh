import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/storage/preferences.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      // Riverpod retries failed providers automatically by default; this app
      // shows the error with a "try again" button instead, so the user stays
      // in control and the API is not hammered while offline.
      retry: (retryCount, error) => null,
      child: const SofrehApp(),
    ),
  );
}
