import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../theme/app_colors.dart';

/// Network image for API paths (`/uploads/...`) with a warm placeholder, an
/// error fallback and an optional greyscale filter (used for closed
/// restaurants and unavailable dishes).
class AppNetworkImage extends StatelessWidget {
  /// Creates the image. [path] may be relative to the API origin.
  const AppNetworkImage(
    this.path, {
    super.key,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.greyscale = false,
    this.placeholderIcon = Icons.restaurant_rounded,
  });

  final String? path;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final bool greyscale;
  final IconData placeholderIcon;

  static const _greyscaleMatrix = <double>[
    0.2126, 0.7152, 0.0722, 0, 0, //
    0.2126, 0.7152, 0.0722, 0, 0, //
    0.2126, 0.7152, 0.0722, 0, 0, //
    0, 0, 0, 1, 0,
  ];

  @override
  Widget build(BuildContext context) {
    final url = AppConfig.imageUrl(path);
    Widget child = url == null
        ? _Placeholder(icon: placeholderIcon)
        : CachedNetworkImage(
            imageUrl: url,
            width: width,
            height: height,
            fit: fit,
            fadeInDuration: const Duration(milliseconds: 220),
            placeholder: (_, _) => const _Placeholder(),
            errorWidget: (_, _, _) => _Placeholder(icon: placeholderIcon),
          );
    if (greyscale) {
      child = ColorFiltered(colorFilter: const ColorFilter.matrix(_greyscaleMatrix), child: child);
    }
    child = SizedBox(width: width, height: height, child: child);
    if (borderRadius != null) child = ClipRRect(borderRadius: borderRadius!, child: child);
    return child;
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder({this.icon});

  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.surfaceMuted,
      child: icon == null
          ? const SizedBox.expand()
          : Center(child: Icon(icon, color: AppColors.textHint, size: 32)),
    );
  }
}
