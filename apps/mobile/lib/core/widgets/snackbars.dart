import 'package:flutter/material.dart';

import '../network/api_exception.dart';
import '../theme/app_colors.dart';

/// Shows [error] (usually an [ApiException]) as a red snackbar.
void showErrorSnackBar(BuildContext context, Object error) {
  _show(context, ApiException.from(error).message, icon: Icons.error_outline_rounded, color: AppColors.error);
}

/// Shows a neutral confirmation message.
void showInfoSnackBar(BuildContext context, String message, {IconData icon = Icons.check_circle_rounded}) {
  _show(context, message, icon: icon, color: AppColors.textPrimary);
}

void _show(BuildContext context, String message, {required IconData icon, required Color color}) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        backgroundColor: color,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
          ],
        ),
      ),
    );
}
