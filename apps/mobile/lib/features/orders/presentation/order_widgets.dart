import 'package:flutter/material.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/theme/app_colors.dart';
import '../domain/order.dart';
import '../domain/order_status.dart';

/// Coloured chip with the Persian status label.
class OrderStatusChip extends StatelessWidget {
  /// Creates the chip.
  const OrderStatusChip({super.key, required this.status});

  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(status.icon, size: 14, color: status.color),
          const SizedBox(width: 4),
          Text(
            status.label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: status.color, fontWeight: FontWeight.w700, fontSize: 11.5),
          ),
        ],
      ),
    );
  }
}

/// Vertical stepper PENDING → … → DELIVERED with the time of each step.
class OrderStatusStepper extends StatelessWidget {
  /// Creates the stepper for [order].
  const OrderStatusStepper({super.key, required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final current = order.status.stepIndex;
    final theme = Theme.of(context).textTheme;
    final steps = OrderStatus.steps;

    return Column(
      children: [
        for (var i = 0; i < steps.length; i++)
          _StepRow(
            status: steps[i],
            state: i < current || order.status == OrderStatus.delivered
                ? _StepState.done
                : i == current
                    ? _StepState.current
                    : _StepState.upcoming,
            time: order.reachedAt(steps[i]),
            isLast: i == steps.length - 1,
            theme: theme,
          ),
      ],
    );
  }
}

enum _StepState { done, current, upcoming }

class _StepRow extends StatelessWidget {
  const _StepRow({
    required this.status,
    required this.state,
    required this.time,
    required this.isLast,
    required this.theme,
  });

  final OrderStatus status;
  final _StepState state;
  final DateTime? time;
  final bool isLast;
  final TextTheme theme;

  @override
  Widget build(BuildContext context) {
    final active = state != _StepState.upcoming;
    final color = switch (state) {
      _StepState.done => AppColors.success,
      _StepState.current => AppColors.primary,
      _StepState.upcoming => AppColors.border,
    };
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 36,
            child: Column(
              children: [
                _Dot(state: state, color: color, icon: status.icon),
                if (!isLast)
                  Expanded(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 400),
                      width: 3,
                      margin: const EdgeInsets.symmetric(vertical: 2),
                      decoration: BoxDecoration(
                        color: state == _StepState.done ? AppColors.success : AppColors.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(top: 4, bottom: isLast ? 0 : 18),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      status.label,
                      style: theme.titleSmall?.copyWith(
                        color: active ? AppColors.textPrimary : AppColors.textHint,
                        fontWeight: state == _StepState.current ? FontWeight.w800 : FontWeight.w600,
                      ),
                    ),
                  ),
                  if (time != null) Text(formatTime(time!), style: theme.bodySmall),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  const _Dot({required this.state, required this.color, required this.icon});

  final _StepState state;
  final Color color;
  final IconData icon;

  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));

  @override
  void initState() {
    super.initState();
    _sync();
  }

  @override
  void didUpdateWidget(_Dot oldWidget) {
    super.didUpdateWidget(oldWidget);
    _sync();
  }

  void _sync() {
    if (widget.state == _StepState.current) {
      if (!_pulse.isAnimating) _pulse.repeat(reverse: true);
    } else {
      _pulse
        ..stop()
        ..value = 0;
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final done = widget.state == _StepState.done;
    final current = widget.state == _StepState.current;
    return AnimatedBuilder(
      animation: _pulse,
      builder: (context, child) => Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: done || current ? widget.color : Colors.white,
          border: Border.all(color: widget.color, width: 2),
          boxShadow: current
              ? [BoxShadow(color: widget.color.withValues(alpha: 0.35 * (1 - _pulse.value) + 0.1), blurRadius: 4 + 10 * _pulse.value, spreadRadius: 2 * _pulse.value)]
              : null,
        ),
        child: child,
      ),
      child: Icon(
        done ? Icons.check_rounded : widget.icon,
        size: 17,
        color: done || current ? Colors.white : AppColors.textHint,
      ),
    );
  }
}
