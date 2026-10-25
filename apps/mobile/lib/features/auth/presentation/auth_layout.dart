import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/common.dart';

/// Shared layout of the sign-in screens: red brand header and a white sheet.
class AuthLayout extends StatelessWidget {
  /// Creates the layout.
  const AuthLayout({super.key, required this.title, this.subtitle, required this.child, this.onBack});

  final String title;
  final String? subtitle;
  final Widget child;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            SizedBox(
              height: 200,
              child: Stack(
                children: [
                  Positioned(
                    top: -40,
                    left: -30,
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.07)),
                    ),
                  ),
                  if (onBack != null)
                    PositionedDirectional(
                      top: 8,
                      start: 8,
                      // Icons.arrow_back is mirrored automatically in RTL.
                      child: BackButton(color: Colors.white, onPressed: onBack),
                    ),
                  const Center(child: SofrehLogo(size: 64, light: true)),
                ],
              ),
            ),
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                ),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 440),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(title, style: theme.textTheme.titleLarge),
                          if (subtitle != null) ...[
                            const SizedBox(height: 6),
                            Text(subtitle!, style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
                          ],
                          const SizedBox(height: 28),
                          child,
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
