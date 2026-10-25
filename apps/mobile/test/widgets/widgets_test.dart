import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sofreh/core/router/app_router.dart';
import 'package:sofreh/core/theme/app_theme.dart';
import 'package:sofreh/core/widgets/quantity_stepper.dart';
import 'package:sofreh/features/auth/domain/app_user.dart';
import 'package:sofreh/features/auth/presentation/auth_controller.dart';
import 'package:sofreh/features/orders/domain/order.dart';
import 'package:sofreh/features/orders/domain/order_status.dart';
import 'package:sofreh/features/orders/presentation/order_widgets.dart';

Widget _wrap(Widget child) => MaterialApp(
      theme: AppTheme.light(),
      home: Directionality(textDirection: TextDirection.rtl, child: Scaffold(body: Center(child: child))),
    );

void main() {
  testWidgets('QuantityStepper shows Persian digits and calls back', (tester) async {
    var value = 2;
    await tester.pumpWidget(_wrap(StatefulBuilder(
      builder: (context, setState) => QuantityStepper(
        quantity: value,
        onIncrement: () => setState(() => value++),
        onDecrement: () => setState(() => value--),
      ),
    )));
    expect(find.text('۲'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.add_rounded));
    await tester.pump();
    expect(find.text('۳'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.remove_rounded));
    await tester.pump();
    expect(find.text('۲'), findsOneWidget);
  });

  testWidgets('OrderStatusStepper lists every step with its Persian label', (tester) async {
    final order = Order(
      id: 1,
      code: 'SF-1',
      status: OrderStatus.preparing,
      paymentMethod: PaymentMethod.cash,
      isPaid: false,
      subtotal: 0,
      itemsDiscount: 0,
      codeDiscount: 0,
      deliveryFee: 0,
      total: 0,
      addressText: '',
      createdAt: DateTime(2026),
      updatedAt: DateTime(2026),
      items: const [],
      statusLogs: [StatusLog(status: OrderStatus.pending, createdAt: DateTime(2026, 1, 1, 9, 5))],
    );
    await tester.pumpWidget(_wrap(SingleChildScrollView(child: OrderStatusStepper(order: order))));
    for (final s in OrderStatus.steps) {
      expect(find.text(s.label), findsOneWidget);
    }
    expect(find.text('۰۹:۰۵'), findsOneWidget);
    expect(find.byIcon(Icons.check_rounded), findsNWidgets(2)); // pending + confirmed are done
  });

  test('authRedirect sends users to the right place', () {
    final home = Uri.parse('/home');
    expect(authRedirect(const AuthUnknown(), home), startsWith('/splash'));
    expect(authRedirect(const Unauthenticated(), home), AppRoutes.login);
    expect(authRedirect(const Unauthenticated(), Uri.parse(AppRoutes.otp)), isNull);
    const named = Authenticated(AppUser(id: 1, phone: '09121111111', name: 'سارا'));
    const unnamed = Authenticated(AppUser(id: 1, phone: '09121111111'));
    expect(authRedirect(named, Uri.parse(AppRoutes.login)), AppRoutes.home);
    expect(authRedirect(unnamed, home), AppRoutes.name);
    expect(authRedirect(named, Uri.parse('/splash?from=%2Frestaurant%2Fnapoli-no')), '/restaurant/napoli-no');
  });
}
