import 'package:flutter/material.dart';

import '../network/api_exception.dart';
import '../theme/app_colors.dart';

/// Friendly empty state: icon, title, message and an optional action.
class EmptyState extends StatelessWidget {
  /// Creates the view.
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: const BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
              child: Icon(icon, size: 44, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            Text(title, style: theme.textTheme.titleMedium, textAlign: TextAlign.center),
            if (message != null) ...[
              const SizedBox(height: 6),
              Text(
                message!,
                style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

/// Error state with the API's Persian message and a retry button.
class ErrorView extends StatelessWidget {
  /// Creates the view for [error].
  const ErrorView({super.key, required this.error, this.onRetry, this.compact = false});

  final Object error;
  final VoidCallback? onRetry;

  /// Smaller layout for use inside lists.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final message = ApiException.from(error).message;
    if (compact) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.wifi_off_rounded, color: AppColors.textSecondary),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: Theme.of(context).textTheme.bodyMedium)),
            if (onRetry != null) TextButton(onPressed: onRetry, child: const Text('تلاش دوباره')),
          ],
        ),
      );
    }
    return EmptyState(
      icon: Icons.cloud_off_rounded,
      title: 'مشکلی پیش آمد',
      message: message,
      actionLabel: onRetry == null ? null : 'تلاش دوباره',
      onAction: onRetry,
    );
  }
}
