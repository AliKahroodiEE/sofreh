import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/snackbars.dart';
import 'auth_controller.dart';
import 'auth_layout.dart';

/// Step 3 for new users: their full name (`PATCH /users/me`). The router
/// continues to home once the profile has a name.
class NameScreen extends ConsumerStatefulWidget {
  /// Creates the screen.
  const NameScreen({super.key});

  @override
  ConsumerState<NameScreen> createState() => _NameScreenState();
}

class _NameScreenState extends ConsumerState<NameScreen> {
  final _name = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref.read(authControllerProvider.notifier).updateName(_name.text);
    } catch (error) {
      if (mounted) showErrorSnackBar(context, error);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      title: 'به سفره خوش آمدید!',
      subtitle: 'برای تکمیل ثبت‌نام، نام خود را وارد کنید.',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _name,
              autofocus: true,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.name],
              maxLength: 50,
              decoration: const InputDecoration(
                counterText: '',
                labelText: 'نام و نام خانوادگی',
                hintText: 'مثلاً سارا محمدی',
                prefixIcon: Icon(Icons.person_rounded),
              ),
              validator: (value) => (value?.trim().length ?? 0) < 2 ? 'نام باید حداقل ۲ حرف باشد.' : null,
              onFieldSubmitted: (_) => _save(),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                  : const Text('شروع سفارش'),
            ),
          ],
        ),
      ),
    );
  }
}
