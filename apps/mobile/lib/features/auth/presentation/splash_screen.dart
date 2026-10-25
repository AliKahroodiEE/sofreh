import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/common.dart';
import 'auth_controller.dart';

/// Brand splash while the stored session is checked. The router leaves this
/// screen as soon as [AuthController.restore] settles the session state.
class SplashScreen extends ConsumerStatefulWidget {
  /// Creates the screen.
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _restore());
  }

  Future<void> _restore() async {
    // Keep the brand visible for a moment even when the check is instant.
    await Future.wait([
      ref.read(authControllerProvider.notifier).restore(),
      Future<void>.delayed(const Duration(milliseconds: 900)),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Stack(
        children: [
          const Positioned(top: -60, left: -40, child: _Circle(size: 220)),
          const Positioned(bottom: -80, right: -60, child: _Circle(size: 280)),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SofrehLogo(size: 84, light: true),
                const SizedBox(height: 8),
                Text(
                  'غذای خوب، نزدیک‌تر از همیشه',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),
          const Positioned(
            bottom: 48,
            left: 0,
            right: 0,
            child: Center(
              child: SizedBox(
                width: 26,
                height: 26,
                child: CircularProgressIndicator(strokeWidth: 2.6, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Circle extends StatelessWidget {
  const _Circle({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.07)),
    );
  }
}
