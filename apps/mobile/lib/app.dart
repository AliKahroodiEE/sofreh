import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

/// Root widget: Persian locale (RTL), brand theme and the router.
class SofrehApp extends ConsumerWidget {
  /// Creates the app.
  const SofrehApp({super.key});

  /// The only supported locale. `fa` makes every layout right-to-left.
  static const locale = Locale('fa', 'IR');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'سفره',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      locale: locale,
      supportedLocales: const [locale],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      routerConfig: ref.watch(routerProvider),
    );
  }
}
