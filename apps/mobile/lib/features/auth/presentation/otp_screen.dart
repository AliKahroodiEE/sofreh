import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/input_formatters.dart';
import '../../../core/formatters/persian_format.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/snackbars.dart';
import '../domain/auth_models.dart';
import 'auth_controller.dart';
import 'auth_layout.dart';

/// Step 2 of sign-in: the 5-digit code (`POST /auth/otp/verify`).
///
/// On success the router moves on by itself (to the name step for new users,
/// otherwise home), because the session state changes.
class OtpScreen extends ConsumerStatefulWidget {
  /// Creates the screen for a code sent by [request].
  const OtpScreen({super.key, required this.request});

  final OtpRequestResult request;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  static const _length = 5;
  static const _resendAfter = 60;

  final _code = TextEditingController();
  final _focus = FocusNode();
  late OtpRequestResult _request = widget.request;
  Timer? _timer;
  int _secondsLeft = _resendAfter;
  bool _verifying = false;
  bool _resending = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _startCountdown() {
    _timer?.cancel();
    setState(() => _secondsLeft = _resendAfter);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsLeft <= 1) timer.cancel();
      setState(() => _secondsLeft--);
    });
  }

  String get _latinCode => toLatinDigits(_code.text);

  void _onChanged(String _) {
    setState(() => _hasError = false);
    if (_latinCode.length == _length) _verify();
  }

  Future<void> _verify() async {
    if (_verifying || _latinCode.length != _length) return;
    setState(() => _verifying = true);
    try {
      await ref.read(authControllerProvider.notifier).verifyOtp(_request.phone, _latinCode);
    } catch (error) {
      if (!mounted) return;
      setState(() => _hasError = true);
      _code.clear();
      _focus.requestFocus();
      showErrorSnackBar(context, error);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _resend() async {
    setState(() => _resending = true);
    try {
      final result = await ref.read(authControllerProvider.notifier).requestOtp(_request.phone);
      if (!mounted) return;
      setState(() => _request = result);
      _code.clear();
      _startCountdown();
      showInfoSnackBar(context, 'کد جدید ارسال شد.', icon: Icons.sms_rounded);
    } catch (error) {
      if (mounted) showErrorSnackBar(context, error);
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  void _fillDevCode() {
    final code = _request.devCode;
    if (code == null) return;
    _code.text = toPersianDigits(code);
    setState(() => _hasError = false);
    _verify();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    final minutes = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final seconds = (_secondsLeft % 60).toString().padLeft(2, '0');

    return AuthLayout(
      title: 'کد تأیید را وارد کنید',
      subtitle: 'کد ۵ رقمی به شماره‌ی ${ltr(formatPhone(_request.phone))} پیامک شد.',
      onBack: () => context.pop(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _CodeBoxes(
            controller: _code,
            focusNode: _focus,
            length: _length,
            hasError: _hasError,
            onChanged: _onChanged,
          ),
          if (_request.devCode != null) ...[
            const SizedBox(height: 16),
            Material(
              color: AppColors.saffronSoft,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: _fillDevCode,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      const Icon(Icons.science_rounded, color: Color(0xFF8A5A00), size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'کد آزمایشی: ${toPersianDigits(_request.devCode)}',
                          style: theme.titleSmall?.copyWith(color: const Color(0xFF6B4600)),
                        ),
                      ),
                      Text('برای پر کردن بزنید', style: theme.bodySmall?.copyWith(color: const Color(0xFF8A5A00))),
                    ],
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _verifying || _latinCode.length != _length ? null : _verify,
            child: _verifying
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                : const Text('تأیید و ورود'),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.edit_rounded, size: 18),
                label: const Text('ویرایش شماره'),
              ),
              if (_secondsLeft > 0)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    'ارسال مجدد تا ${toPersianDigits('$minutes:$seconds')}',
                    style: theme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                  ),
                )
              else
                TextButton.icon(
                  onPressed: _resending ? null : _resend,
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text('ارسال مجدد کد'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Five boxes drawn over a single invisible text field, so typing, paste and
/// SMS autofill (`oneTimeCode`) all work naturally.
class _CodeBoxes extends StatelessWidget {
  const _CodeBoxes({
    required this.controller,
    required this.focusNode,
    required this.length,
    required this.hasError,
    required this.onChanged,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final int length;
  final bool hasError;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 64,
      child: Directionality(
        // Codes are read left to right.
        textDirection: TextDirection.ltr,
        child: Stack(
          children: [
            ListenableBuilder(
              listenable: Listenable.merge([controller, focusNode]),
              builder: (context, _) {
                final text = controller.text;
                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    for (var i = 0; i < length; i++)
                      _Box(
                        digit: i < text.length ? text[i] : '',
                        active: focusNode.hasFocus && i == text.length.clamp(0, length - 1),
                        error: hasError,
                      ),
                  ],
                );
              },
            ),
            Positioned.fill(
              child: TextField(
                controller: controller,
                focusNode: focusNode,
                autofocus: true,
                keyboardType: TextInputType.number,
                maxLength: length,
                showCursor: false,
                enableInteractiveSelection: false,
                autofillHints: const [AutofillHints.oneTimeCode],
                inputFormatters: [digitsOnlyFormatter, const PersianDigitsFormatter()],
                style: const TextStyle(color: Colors.transparent, fontSize: 1),
                decoration: const InputDecoration(
                  counterText: '',
                  filled: false,
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                onChanged: onChanged,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Box extends StatelessWidget {
  const _Box({required this.digit, required this.active, required this.error});

  final String digit;
  final bool active;
  final bool error;

  @override
  Widget build(BuildContext context) {
    final color = error
        ? AppColors.error
        : active
            ? AppColors.primary
            : digit.isNotEmpty
                ? AppColors.primary.withValues(alpha: 0.45)
                : AppColors.border;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      width: 56,
      height: 64,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color, width: active || error ? 2 : 1.4),
        boxShadow: active
            ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.15), blurRadius: 12, offset: const Offset(0, 4))]
            : null,
      ),
      child: Text(
        digit,
        style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800, height: 1.2),
      ),
    );
  }
}
