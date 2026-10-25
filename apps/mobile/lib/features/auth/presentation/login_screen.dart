import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/input_formatters.dart';
import '../../../core/formatters/persian_format.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/snackbars.dart';
import 'auth_controller.dart';
import 'auth_layout.dart';

/// Step 1 of sign-in: the mobile number (`POST /auth/otp/request`).
class LoginScreen extends ConsumerStatefulWidget {
  /// Creates the screen.
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phone = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authControllerProvider);
    if (auth is Unauthenticated && auth.sessionExpired) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => showInfoSnackBar(context, 'نشست شما به پایان رسید؛ لطفاً دوباره وارد شوید.', icon: Icons.lock_clock_rounded),
      );
    }
  }

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final phone = normalizeIranMobile(_phone.text)!;
    setState(() => _loading = true);
    try {
      final result = await ref.read(authControllerProvider.notifier).requestOtp(phone);
      if (!mounted) return;
      await context.push(AppRoutes.otp, extra: result);
    } catch (error) {
      if (mounted) showErrorSnackBar(context, error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      title: 'ورود یا ثبت‌نام',
      subtitle: 'شماره‌ی موبایل خود را وارد کنید تا کد تأیید برایتان پیامک شود.',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _phone,
              autofocus: true,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.done,
              textDirection: TextDirection.ltr,
              textAlign: TextAlign.left,
              autofillHints: const [AutofillHints.telephoneNumber],
              maxLength: 14,
              inputFormatters: const [PersianDigitsFormatter()],
              style: Theme.of(context).textTheme.titleMedium?.copyWith(letterSpacing: 1.5),
              decoration: const InputDecoration(
                counterText: '',
                hintText: '۰۹۱۲ ۳۴۵ ۶۷۸۹',
                hintTextDirection: TextDirection.ltr,
                labelText: 'شماره‌ی موبایل',
                prefixIcon: Icon(Icons.smartphone_rounded),
              ),
              validator: (value) =>
                  normalizeIranMobile(value ?? '') == null ? 'شماره‌ی موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' : null,
              onFieldSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                  : const Text('دریافت کد تأیید'),
            ),
            const SizedBox(height: 24),
            Text(
              'با ورود به سفره، شرایط استفاده و حریم خصوصی را می‌پذیرید.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textHint),
            ),
          ],
        ),
      ),
    );
  }
}
