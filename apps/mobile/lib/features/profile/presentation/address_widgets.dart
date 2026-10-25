import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/snackbars.dart';
import '../domain/address.dart';
import 'address_controller.dart';

/// «ارسال به …» header on the home screen; opens the address picker.
class DeliveryAddressHeader extends ConsumerWidget {
  /// Creates the header.
  const DeliveryAddressHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final address = ref.watch(selectedAddressProvider);
    final loading = ref.watch(addressesProvider).isLoading;
    final theme = Theme.of(context).textTheme;
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => showAddressPicker(context),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
              child: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('ارسال به', style: theme.bodySmall?.copyWith(height: 1.3)),
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          address == null
                              ? (loading ? 'در حال دریافت آدرس‌ها…' : 'افزودن آدرس تحویل')
                              : '${address.title}: ${address.details}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.titleSmall?.copyWith(height: 1.4),
                        ),
                      ),
                      const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primary),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Bottom sheet to choose the delivery address (and add a new one).
Future<void> showAddressPicker(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (_) => const _AddressPickerSheet(),
  );
}

class _AddressPickerSheet extends ConsumerWidget {
  const _AddressPickerSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addresses = ref.watch(addressesProvider);
    final selected = ref.watch(selectedAddressProvider);
    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.75),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text('آدرس تحویل را انتخاب کنید', style: Theme.of(context).textTheme.titleMedium),
            ),
            Flexible(
              child: addresses.when(
                loading: () => const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator())),
                error: (e, _) => Padding(padding: const EdgeInsets.all(24), child: Text(e.toString())),
                data: (list) => ListView(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    if (list.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('هنوز آدرسی ذخیره نکرده‌اید.'),
                      ),
                    for (final address in list)
                      AddressTile(
                        address: address,
                        selected: address.id == selected?.id,
                        onTap: () {
                          ref.read(selectedAddressIdProvider.notifier).select(address.id);
                          Navigator.of(context).pop();
                        },
                      ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: OutlinedButton.icon(
                onPressed: () async {
                  final added = await showAddAddressSheet(context);
                  if (added != null && context.mounted) Navigator.of(context).pop();
                },
                icon: const Icon(Icons.add_location_alt_rounded),
                label: const Text('افزودن آدرس جدید'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A selectable address row.
class AddressTile extends StatelessWidget {
  /// Creates the tile. Pass [onDelete] to show a delete button instead of a radio.
  const AddressTile({super.key, required this.address, this.selected = false, this.onTap, this.onDelete});

  final Address address;
  final bool selected;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;

  IconData get _icon => switch (address.title) {
        'خانه' => Icons.home_rounded,
        'محل کار' => Icons.work_rounded,
        _ => Icons.place_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Material(
        color: selected ? AppColors.primarySoft.withValues(alpha: 0.6) : AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: selected ? AppColors.primary : AppColors.border, width: selected ? 1.4 : 1),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
            child: Row(
              children: [
                Icon(_icon, color: selected ? AppColors.primary : AppColors.textSecondary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(address.title, style: theme.titleSmall),
                      Text(address.details, style: theme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                if (onDelete != null)
                  IconButton(
                    tooltip: 'حذف آدرس',
                    onPressed: onDelete,
                    icon: const Icon(Icons.delete_outline_rounded, color: AppColors.textSecondary),
                  )
                else
                  Icon(
                    selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                    color: selected ? AppColors.primary : AppColors.textHint,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Bottom sheet form for a new address. Returns the saved address (which is
/// also selected as the delivery address), or `null` when dismissed.
Future<Address?> showAddAddressSheet(BuildContext context) {
  return showModalBottomSheet<Address>(
    context: context,
    isScrollControlled: true,
    builder: (_) => const _AddAddressSheet(),
  );
}

class _AddAddressSheet extends ConsumerStatefulWidget {
  const _AddAddressSheet();

  @override
  ConsumerState<_AddAddressSheet> createState() => _AddAddressSheetState();
}

class _AddAddressSheetState extends ConsumerState<_AddAddressSheet> {
  static const _presets = ['خانه', 'محل کار', 'دیگر'];

  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController(text: 'خانه');
  final _details = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _title.dispose();
    _details.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final address = await ref.read(addressesProvider.notifier).add(title: _title.text, details: _details.text);
      if (!mounted) return;
      Navigator.of(context).pop(address);
    } catch (error) {
      if (mounted) showErrorSnackBar(context, error);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('آدرس جدید', style: theme.titleMedium),
                const SizedBox(height: 16),
                ListenableBuilder(
                  listenable: _title,
                  builder: (context, _) => Wrap(
                    spacing: 8,
                    children: [
                      for (final preset in _presets)
                        ChoiceChip(
                          label: Text(preset),
                          selected: _title.text == preset,
                          labelStyle: theme.labelMedium?.copyWith(
                            color: _title.text == preset ? Colors.white : AppColors.textPrimary,
                          ),
                          onSelected: (_) => _title.text = preset,
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _title,
                  maxLength: 30,
                  decoration: const InputDecoration(labelText: 'عنوان', counterText: '', prefixIcon: Icon(Icons.label_rounded)),
                  validator: (v) => (v?.trim().isEmpty ?? true) ? 'یک عنوان برای آدرس بنویسید.' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _details,
                  minLines: 2,
                  maxLines: 4,
                  maxLength: 250,
                  autofocus: true,
                  decoration: const InputDecoration(
                    labelText: 'نشانی کامل',
                    hintText: 'شهر، محله، خیابان، پلاک، واحد',
                    counterText: '',
                    alignLabelWithHint: true,
                  ),
                  validator: (v) => (v?.trim().length ?? 0) < 5 ? 'آدرس را کامل‌تر وارد کنید.' : null,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                      : const Text('ذخیره‌ی آدرس'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
