import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Animated shimmer for loading skeletons. Wrap a tree of [SkeletonBox]es.
class Shimmer extends StatefulWidget {
  /// Creates the shimmer.
  const Shimmer({super.key, required this.child});

  final Widget child;

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1300))..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      child: widget.child,
      builder: (context, child) {
        final t = _controller.value;
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) => LinearGradient(
            begin: Alignment(-1.0 + 3 * t - 1, 0),
            end: Alignment(1.0 + 3 * t - 1, 0),
            colors: const [Color(0xFFF1E7DF), Color(0xFFFFFBF7), Color(0xFFF1E7DF)],
            stops: const [0.25, 0.5, 0.75],
          ).createShader(bounds),
          child: child,
        );
      },
    );
  }
}

/// A rounded grey block used inside [Shimmer] skeletons.
class SkeletonBox extends StatelessWidget {
  /// Creates a block of the given size.
  const SkeletonBox({super.key, this.width, this.height = 14, this.radius = 8});

  final double? width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}
