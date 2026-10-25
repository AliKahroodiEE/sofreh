import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';

/// Builds the Material 3 theme of the app (light only for this demo).
abstract final class AppTheme {
  /// Bundled Persian font (see `pubspec.yaml`).
  static const fontFamily = 'Vazirmatn';

  /// Radius used by cards and sheets.
  static const radius = 20.0;

  /// Radius used by inputs and buttons.
  static const controlRadius = 14.0;

  /// The light theme.
  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      onPrimary: Colors.white,
      primaryContainer: AppColors.primarySoft,
      onPrimaryContainer: AppColors.primaryDark,
      secondary: AppColors.saffron,
      onSecondary: AppColors.textPrimary,
      secondaryContainer: AppColors.saffronSoft,
      onSecondaryContainer: const Color(0xFF6B4600),
      surface: AppColors.surface,
      onSurface: AppColors.textPrimary,
      onSurfaceVariant: AppColors.textSecondary,
      surfaceContainerLowest: Colors.white,
      surfaceContainerLow: const Color(0xFFFFFBF8),
      surfaceContainer: AppColors.surfaceMuted,
      surfaceContainerHigh: const Color(0xFFF3E9E1),
      surfaceContainerHighest: const Color(0xFFEDE2D9),
      outline: const Color(0xFFD8CBC1),
      outlineVariant: AppColors.border,
      error: AppColors.error,
    );

    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      fontFamily: fontFamily,
      scaffoldBackgroundColor: AppColors.background,
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.standard,
    );

    final text = base.textTheme.apply(
      fontFamily: fontFamily,
      bodyColor: AppColors.textPrimary,
      displayColor: AppColors.textPrimary,
    );

    final textTheme = text.copyWith(
      headlineSmall: text.headlineSmall?.copyWith(fontWeight: FontWeight.w800, height: 1.4),
      titleLarge: text.titleLarge?.copyWith(fontWeight: FontWeight.w800, fontSize: 20, height: 1.4),
      titleMedium: text.titleMedium?.copyWith(fontWeight: FontWeight.w700, fontSize: 16, height: 1.5),
      titleSmall: text.titleSmall?.copyWith(fontWeight: FontWeight.w700, fontSize: 14, height: 1.5),
      bodyLarge: text.bodyLarge?.copyWith(fontSize: 15, height: 1.7),
      bodyMedium: text.bodyMedium?.copyWith(fontSize: 14, height: 1.7),
      bodySmall: text.bodySmall?.copyWith(fontSize: 12, height: 1.6, color: AppColors.textSecondary),
      labelLarge: text.labelLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 15),
      labelMedium: text.labelMedium?.copyWith(fontWeight: FontWeight.w600, fontSize: 13),
      labelSmall: text.labelSmall?.copyWith(fontWeight: FontWeight.w600, fontSize: 11, letterSpacing: 0),
    );

    final controlShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(controlRadius));

    return base.copyWith(
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: true,
        titleTextStyle: textTheme.titleMedium?.copyWith(fontSize: 17),
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: const BorderSide(color: AppColors.border),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(64, 52),
          shape: controlShape,
          textStyle: textTheme.labelLarge,
          disabledBackgroundColor: const Color(0xFFE9DFD8),
          disabledForegroundColor: AppColors.textHint,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(64, 48),
          shape: controlShape,
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary, width: 1.2),
          textStyle: textTheme.labelLarge,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          shape: controlShape,
          textStyle: textTheme.labelLarge?.copyWith(fontSize: 14),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.textHint),
        labelStyle: textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(controlRadius),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(controlRadius),
          borderSide: const BorderSide(color: Colors.transparent),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(controlRadius),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.4),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(controlRadius),
          borderSide: const BorderSide(color: AppColors.error),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surface,
        selectedColor: AppColors.primary,
        secondarySelectedColor: AppColors.primary,
        side: const BorderSide(color: AppColors.border),
        shape: const StadiumBorder(),
        labelStyle: textTheme.labelMedium?.copyWith(color: AppColors.textPrimary),
        secondaryLabelStyle: textTheme.labelMedium?.copyWith(color: Colors.white),
        checkmarkColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        showCheckmark: false,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        height: 68,
        indicatorColor: AppColors.primarySoft,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => textTheme.labelSmall?.copyWith(
            fontSize: 12,
            color: states.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSecondary,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        titleTextStyle: textTheme.titleMedium,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.textPrimary,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(controlRadius)),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.border, thickness: 1, space: 1),
      listTileTheme: ListTileThemeData(
        iconColor: AppColors.textSecondary,
        titleTextStyle: textTheme.titleSmall,
        subtitleTextStyle: textTheme.bodySmall,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(controlRadius)),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.primary),
      tabBarTheme: TabBarThemeData(
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.textSecondary,
        indicatorColor: AppColors.primary,
        labelStyle: textTheme.labelLarge?.copyWith(fontSize: 14),
        unselectedLabelStyle: textTheme.labelLarge?.copyWith(fontSize: 14, fontWeight: FontWeight.w500),
        dividerColor: Colors.transparent,
      ),
    );
  }
}
