import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/auth_models.dart';
import '../../features/auth/presentation/auth_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/name_screen.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/catalog/presentation/home_screen.dart';
import '../../features/catalog/presentation/search_screen.dart';
import '../../features/checkout/presentation/checkout_screen.dart';
import '../../features/checkout/presentation/payment_gateway_screen.dart';
import '../../features/orders/presentation/order_tracking_screen.dart';
import '../../features/orders/presentation/orders_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/restaurant/presentation/restaurant_screen.dart';
import 'app_shell.dart';

/// Route paths, so screens never hard-code strings.
abstract final class AppRoutes {
  static const splash = '/splash';
  static const login = '/auth/login';
  static const otp = '/auth/otp';
  static const name = '/auth/name';
  static const home = '/home';
  static const search = '/search';
  static const orders = '/orders';
  static const profile = '/profile';
  static const checkout = '/checkout';

  /// Search tab, optionally pre-filtered by cuisine slug or focused.
  static String searchWith({String? cuisine, bool focus = false}) => Uri(
        path: search,
        queryParameters: {'cuisine': ?cuisine, if (focus) 'focus': '1'},
      ).toString();

  static String restaurant(String slug) => '/restaurant/$slug';
  static String order(int id) => '/orders/$id';
  static String payment(int orderId) => '/payment/$orderId';
}

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

/// Decides where the user may go for a given session state:
/// splash while unknown, auth screens when signed out, the name step for new
/// users and the app otherwise. Exposed for tests.
String? authRedirect(AuthState auth, Uri uri) {
  final path = uri.path;
  final onSplash = path == AppRoutes.splash;
  final onAuth = path.startsWith('/auth');

  switch (auth) {
    case AuthUnknown():
      if (onSplash) return null;
      return Uri(path: AppRoutes.splash, queryParameters: {'from': uri.toString()}).toString();
    case Unauthenticated():
      return onAuth ? null : AppRoutes.login;
    case Authenticated(:final user):
      if (user.needsName) return path == AppRoutes.name ? null : AppRoutes.name;
      if (onSplash) {
        final from = uri.queryParameters['from'];
        final valid = from != null && from.startsWith('/') && !from.startsWith('/splash') && !from.startsWith('/auth');
        return valid ? from : AppRoutes.home;
      }
      return onAuth ? AppRoutes.home : null;
  }
}

/// The app's [GoRouter]. Re-evaluates redirects whenever the session changes.
final routerProvider = Provider<GoRouter>((ref) {
  final session = ValueNotifier<AuthState>(ref.read(authControllerProvider));
  ref.listen(authControllerProvider, (_, next) => session.value = next);

  final router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    refreshListenable: session,
    redirect: (context, state) => authRedirect(session.value, state.uri),
    routes: [
      GoRoute(path: AppRoutes.splash, builder: (_, _) => const SplashScreen()),
      GoRoute(path: AppRoutes.login, builder: (_, _) => const LoginScreen()),
      GoRoute(
        path: AppRoutes.otp,
        // The OTP request result is passed as `extra`; it is lost on a web
        // reload, so go back to the phone step in that case.
        redirect: (_, state) => state.extra is OtpRequestResult ? null : AppRoutes.login,
        builder: (_, state) => OtpScreen(request: state.extra! as OtpRequestResult),
      ),
      GoRoute(path: AppRoutes.name, builder: (_, _) => const NameScreen()),
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: AppRoutes.home, builder: (_, _) => const HomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.search,
              builder: (_, state) => SearchScreen(
                initialCuisine: state.uri.queryParameters['cuisine'],
                autofocus: state.uri.queryParameters['focus'] == '1',
              ),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.orders,
              builder: (_, _) => const OrdersScreen(),
              routes: [
                // Full-screen above the tabs; `go(order(id))` keeps the
                // orders tab underneath so "back" lands in the history.
                GoRoute(
                  path: ':id',
                  parentNavigatorKey: _rootNavigatorKey,
                  builder: (_, state) => OrderTrackingScreen(orderId: int.parse(state.pathParameters['id']!)),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: AppRoutes.profile, builder: (_, _) => const ProfileScreen()),
          ]),
        ],
      ),
      GoRoute(
        path: '/restaurant/:slug',
        builder: (_, state) => RestaurantScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(path: AppRoutes.checkout, builder: (_, _) => const CheckoutScreen()),
      GoRoute(
        path: '/payment/:orderId',
        builder: (_, state) => PaymentGatewayScreen(orderId: int.parse(state.pathParameters['orderId']!)),
      ),
    ],
  );
  ref.onDispose(() {
    router.dispose();
    session.dispose();
  });
  return router;
});
