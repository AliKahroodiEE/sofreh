import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/cart/presentation/cart_bar.dart';

/// Bottom-navigation scaffold around the four tabs, with the floating cart
/// bar above the navigation when the cart is not empty.
class AppShell extends StatelessWidget {
  /// Creates the shell for the given branch navigator.
  const AppShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  static const _destinations = [
    NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'خانه'),
    NavigationDestination(icon: Icon(Icons.search_rounded), selectedIcon: Icon(Icons.saved_search_rounded), label: 'جستجو'),
    NavigationDestination(
      icon: Icon(Icons.receipt_long_outlined),
      selectedIcon: Icon(Icons.receipt_long_rounded),
      label: 'سفارش‌ها',
    ),
    NavigationDestination(icon: Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded), label: 'پروفایل'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CartBar(compact: true),
          DecoratedBox(
            decoration: const BoxDecoration(
              boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 16, offset: Offset(0, -2))],
            ),
            child: NavigationBar(
              selectedIndex: shell.currentIndex,
              destinations: _destinations,
              onDestinationSelected: (index) => shell.goBranch(index, initialLocation: index == shell.currentIndex),
            ),
          ),
        ],
      ),
    );
  }
}
