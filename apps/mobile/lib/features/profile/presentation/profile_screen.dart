import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/common.dart';
import '../../../core/widgets/snackbars.dart';
import '../../../core/widgets/state_views.dart';
import '../../auth/presentation/auth_controller.dart';
import 'address_controller.dart';
import 'address_widgets.dart';

/// Profile tab: name (editable), phone, saved addresses and logout.
class ProfileScreen extends ConsumerWidget {
  /// Creates the screen.
  const ProfileScreen({super.key});

  Future<void> _editName(BuildContext context, WidgetRef ref, String? current) async {
    final name = await showDialog<String>(context: context, builder: (_) => _NameDialog(initial: current ?? ''));
    if (name == null || !context.mounted) return;
    try {
      await ref.read(authControllerProvider.notifier).updateName(name);
      if (context.mounted) showInfoSnackBar(context, 'نام شما به‌روز شد.');
    } catch (error) {
      if (context.mounted) showErrorSnackBar(context, error);
    }
  }

  Future<void> _deleteAddress(BuildContext context, WidgetRef ref, int id, String title) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('حذف آدرس'),
        content: Text('آدرس «$title» حذف شود؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('انصراف')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('حذف')),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await ref.read(addressesProvider.notifier).remove(id);
    } catch (error) {
      if (context.mounted) showErrorSnackBar(context, error);
    }
  }

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('خروج از حساب'),
        content: const Text('می‌خواهید از حساب کاربری خود خارج شوید؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('انصراف')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('خروج')),
        ],
      ),
    );
    if (ok == true) await ref.read(authControllerProvider.notifier).logout();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider.select((s) => s is Authenticated ? s.user : null));
    final addresses = ref.watch(addressesProvider);
    final theme = Theme.of(context).textTheme;
    if (user == null) return const Scaffold();

    final initial = (user.name ?? 'س').characters.first;
    return Scaffold(
      appBar: AppBar(title: const Text('پروفایل'), centerTitle: false),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(addressesProvider.future),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            SurfaceCard(
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: AppColors.primary,
                    child: Text(initial, style: theme.titleLarge?.copyWith(color: Colors.white)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user.name ?? 'کاربر سفره', style: theme.titleMedium),
                        Text(
                          formatPhone(user.phone),
                          textDirection: TextDirection.ltr,
                          style: theme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  IconButton.filledTonal(
                    tooltip: 'ویرایش نام',
                    style: IconButton.styleFrom(backgroundColor: AppColors.primarySoft, foregroundColor: AppColors.primary),
                    onPressed: () => _editName(context, ref, user.name),
                    icon: const Icon(Icons.edit_rounded),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SurfaceCard(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: ListTile(
                leading: const Icon(Icons.receipt_long_rounded, color: AppColors.primary),
                title: const Text('سفارش‌های من'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.go(AppRoutes.orders),
              ),
            ),
            SectionHeader(
              title: 'آدرس‌های من',
              padding: const EdgeInsets.fromLTRB(4, 24, 4, 8),
              trailing: TextButton.icon(
                onPressed: () => showAddAddressSheet(context),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('افزودن'),
              ),
            ),
            addresses.when(
              loading: () => const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
              error: (e, _) => ErrorView(error: e, compact: true, onRetry: () => ref.invalidate(addressesProvider)),
              data: (list) => list.isEmpty
                  ? SurfaceCard(
                      child: Row(
                        children: [
                          const Icon(Icons.wrong_location_outlined, color: AppColors.textHint),
                          const SizedBox(width: 12),
                          const Expanded(child: Text('هنوز آدرسی ذخیره نکرده‌اید.')),
                          TextButton(onPressed: () => showAddAddressSheet(context), child: const Text('افزودن آدرس')),
                        ],
                      ),
                    )
                  : Column(
                      children: [
                        for (final a in list)
                          AddressTile(address: a, onDelete: () => _deleteAddress(context, ref, a.id, a.title)),
                      ],
                    ),
            ),
            const SizedBox(height: 24),
            SurfaceCard(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: ListTile(
                leading: const Icon(Icons.logout_rounded, color: AppColors.error),
                title: Text('خروج از حساب', style: theme.titleSmall?.copyWith(color: AppColors.error)),
                onTap: () => _logout(context, ref),
              ),
            ),
            const SizedBox(height: 24),
            Center(
              child: Text(
                'سفره · نسخه‌ی ${toPersianDigits('1.0.0')} (نسخه‌ی نمایشی)',
                style: theme.bodySmall?.copyWith(color: AppColors.textHint),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NameDialog extends StatefulWidget {
  const _NameDialog({required this.initial});

  final String initial;

  @override
  State<_NameDialog> createState() => _NameDialogState();
}

class _NameDialogState extends State<_NameDialog> {
  late final _controller = TextEditingController(text: widget.initial);
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) Navigator.pop(context, _controller.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('ویرایش نام'),
      content: Form(
        key: _formKey,
        child: TextFormField(
          controller: _controller,
          autofocus: true,
          maxLength: 50,
          decoration: const InputDecoration(labelText: 'نام و نام خانوادگی', counterText: ''),
          validator: (v) => (v?.trim().length ?? 0) < 2 ? 'نام باید حداقل ۲ حرف باشد.' : null,
          onFieldSubmitted: (_) => _submit(),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
        FilledButton(onPressed: _submit, child: const Text('ذخیره')),
      ],
    );
  }
}
