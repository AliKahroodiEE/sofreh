import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/common.dart';
import '../../../core/widgets/quantity_stepper.dart';
import '../../../core/widgets/snackbars.dart';
import '../../../core/widgets/state_views.dart';
import '../../cart/domain/cart.dart';
import '../../cart/presentation/cart_controller.dart';
import '../../orders/domain/order_status.dart';
import '../../orders/presentation/orders_controllers.dart';
import '../../profile/domain/address.dart';
import '../../profile/presentation/address_controller.dart';
import '../../profile/presentation/address_widgets.dart';
import 'checkout_controller.dart';
import 'price_summary.dart';

/// Cart review and checkout: items, address, discount code, payment method
/// and the price breakdown, then `POST /orders`.
class CheckoutScreen extends ConsumerStatefulWidget {
  /// Creates the screen.
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _note = TextEditingController();

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Address? _address(CheckoutState state) {
    final addresses = ref.read(addressesProvider).value ?? const [];
    if (state.addressId != null) {
      for (final a in addresses) {
        if (a.id == state.addressId) return a;
      }
    }
    return ref.read(selectedAddressProvider);
  }

  Future<void> _placeOrder() async {
    final checkout = ref.read(checkoutProvider);
    final address = _address(checkout);
    if (address == null) {
      showErrorSnackBar(context, 'لطفاً یک آدرس تحویل اضافه کنید.');
      return;
    }
    final router = GoRouter.of(context);
    try {
      final order = await ref.read(checkoutProvider.notifier).placeOrder(address: address, note: _note.text);
      ref.invalidate(ordersListProvider);
      router.go(order.awaitsPayment ? AppRoutes.payment(order.id) : AppRoutes.order(order.id));
      ref.read(cartProvider.notifier).clear();
    } catch (error) {
      if (mounted) showErrorSnackBar(context, error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final checkout = ref.watch(checkoutProvider);
    ref.watch(addressesProvider);
    final address = _address(checkout);

    if (cart.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('سبد خرید')),
        body: EmptyState(
          icon: Icons.shopping_bag_outlined,
          title: 'سبد خرید شما خالی است',
          message: 'از رستوران‌های اطرافتان غذای دلخواهتان را انتخاب کنید.',
          actionLabel: 'مشاهده‌ی رستوران‌ها',
          onAction: () => context.go(AppRoutes.home),
        ),
      );
    }

    final totals = cart.totals(codeDiscount: checkout.discount?.discount ?? 0);
    final restaurant = cart.restaurant!;
    final blocked = !restaurant.isOpen || !cart.meetsMinOrder || cart.unavailableLines.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text('تکمیل سفارش'),
        actions: [
          IconButton(
            tooltip: 'خالی کردن سبد',
            icon: const Icon(Icons.delete_sweep_outlined),
            onPressed: () async {
              final ok = await _confirm(context, 'سبد خرید خالی شود؟', 'همه‌ی غذاهای انتخاب‌شده حذف می‌شوند.');
              if (ok) ref.read(cartProvider.notifier).clear();
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          _CartItemsCard(cart: cart),
          if (!restaurant.isOpen)
            const _Warning(icon: Icons.lock_clock_rounded, text: 'این رستوران در حال حاضر بسته است و سفارش نمی‌پذیرد.'),
          if (cart.unavailableLines.isNotEmpty)
            _Warning(
              icon: Icons.block_rounded,
              text: '«${cart.unavailableLines.map((l) => l.item.name).join('، ')}» دیگر موجود نیست؛ آن را از سبد حذف کنید.',
            ),
          if (!cart.meetsMinOrder)
            _Warning(
              icon: Icons.info_rounded,
              text: 'حداقل سفارش از این رستوران ${formatToman(cart.minOrder)} است؛ '
                  '${formatToman(cart.remainingToMinOrder)} دیگر اضافه کنید.',
            ),
          const _Title('آدرس تحویل'),
          _AddressSection(
            selected: address,
            onSelect: (a) => ref.read(checkoutProvider.notifier).setAddress(a.id),
          ),
          const _Title('کد تخفیف'),
          _DiscountField(state: checkout),
          const _Title('روش پرداخت'),
          Row(
            children: [
              for (final method in PaymentMethod.values) ...[
                Expanded(
                  child: _PaymentOption(
                    method: method,
                    selected: checkout.paymentMethod == method,
                    onTap: () => ref.read(checkoutProvider.notifier).setPaymentMethod(method),
                  ),
                ),
                if (method != PaymentMethod.values.last) const SizedBox(width: 10),
              ],
            ],
          ),
          const _Title('توضیحات (اختیاری)'),
          TextField(
            controller: _note,
            maxLength: 200,
            minLines: 1,
            maxLines: 3,
            decoration: const InputDecoration(
              counterText: '',
              hintText: 'مثلاً: زنگ واحد ۴ خراب است',
              prefixIcon: Icon(Icons.sticky_note_2_outlined),
            ),
          ),
          const _Title('خلاصه‌ی پرداخت'),
          PriceSummary(breakdown: totals, discountCode: checkout.discount?.code),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 16, offset: Offset(0, -2))],
          ),
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('مبلغ قابل پرداخت', style: Theme.of(context).textTheme.bodySmall),
                  Text(formatToman(totals.total), style: Theme.of(context).textTheme.titleMedium),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: FilledButton(
                  onPressed: blocked || checkout.placing || checkout.validatingCode ? null : _placeOrder,
                  child: checkout.placing
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                      : Text(checkout.paymentMethod == PaymentMethod.online ? 'ثبت و پرداخت' : 'ثبت سفارش'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<bool> _confirm(BuildContext context, String title, String message) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('انصراف')),
        FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('بله')),
      ],
    ),
  );
  return result ?? false;
}

class _Title extends StatelessWidget {
  const _Title(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 22, 4, 10),
        child: Text(text, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 15)),
      );
}

class _Warning extends StatelessWidget {
  const _Warning({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.saffronSoft, borderRadius: BorderRadius.circular(14)),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF8A5A00), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF6B4600))),
          ),
        ],
      ),
    );
  }
}

class _CartItemsCard extends ConsumerWidget {
  const _CartItemsCard({required this.cart});

  final Cart cart;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context).textTheme;
    final restaurant = cart.restaurant!;
    return SurfaceCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          InkWell(
            onTap: () => context.push(AppRoutes.restaurant(restaurant.slug)),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  AppNetworkImage(restaurant.cover, width: 48, height: 48, borderRadius: BorderRadius.circular(12)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(restaurant.name, style: theme.titleSmall),
                        Text('${toPersianDigits(cart.itemCount)} غذا', style: theme.bodySmall),
                      ],
                    ),
                  ),
                  Text('افزودن غذا', style: theme.labelMedium?.copyWith(color: AppColors.primary)),
                  const Icon(Icons.chevron_right_rounded, color: AppColors.primary, size: 20),
                ],
              ),
            ),
          ),
          const Divider(),
          for (final line in cart.lines)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          line.item.name,
                          style: theme.titleSmall?.copyWith(
                            decoration: line.item.isAvailable ? null : TextDecoration.lineThrough,
                          ),
                        ),
                        const SizedBox(height: 2),
                        PriceTag(price: line.total, original: line.item.hasDiscount ? line.baseTotal : null),
                      ],
                    ),
                  ),
                  QuantityStepper(
                    dense: true,
                    quantity: line.quantity,
                    max: Cart.maxQuantity,
                    onIncrement: () => ref.read(cartProvider.notifier).increment(line.item.id),
                    onDecrement: () => ref.read(cartProvider.notifier).decrement(line.item.id),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

class _AddressSection extends ConsumerWidget {
  const _AddressSection({required this.selected, required this.onSelect});

  final Address? selected;
  final ValueChanged<Address> onSelect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addresses = ref.watch(addressesProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...addresses.when(
          loading: () => [const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()))],
          error: (e, _) => [ErrorView(error: e, compact: true, onRetry: () => ref.invalidate(addressesProvider))],
          data: (list) => [
            for (final a in list) AddressTile(address: a, selected: a.id == selected?.id, onTap: () => onSelect(a)),
          ],
        ),
        const SizedBox(height: 4),
        OutlinedButton.icon(
          onPressed: () async {
            final added = await showAddAddressSheet(context);
            if (added != null) onSelect(added);
          },
          icon: const Icon(Icons.add_location_alt_rounded),
          label: const Text('افزودن آدرس جدید'),
        ),
      ],
    );
  }
}

class _DiscountField extends ConsumerStatefulWidget {
  const _DiscountField({required this.state});

  final CheckoutState state;

  @override
  ConsumerState<_DiscountField> createState() => _DiscountFieldState();
}

class _DiscountFieldState extends ConsumerState<_DiscountField> {
  final _code = TextEditingController();

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    final theme = Theme.of(context).textTheme;
    final discount = state.discount;

    if (discount != null) {
      return Container(
        padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
        decoration: BoxDecoration(
          color: AppColors.successSoft,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.verified_rounded, color: AppColors.success),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('کد ${discount.code} اعمال شد', style: theme.titleSmall?.copyWith(color: AppColors.success)),
                  Text(
                    '${formatToman(discount.discount)} تخفیف',
                    style: theme.labelMedium?.copyWith(color: AppColors.success),
                  ),
                  if (discount.description != null) Text(discount.description!, style: theme.bodySmall),
                ],
              ),
            ),
            if (state.validatingCode)
              const Padding(
                padding: EdgeInsets.all(12),
                child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
              )
            else
              IconButton(
                tooltip: 'حذف کد',
                onPressed: () {
                  _code.clear();
                  ref.read(checkoutProvider.notifier).removeCode();
                },
                icon: const Icon(Icons.close_rounded),
              ),
          ],
        ),
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: TextField(
            controller: _code,
            textCapitalization: TextCapitalization.characters,
            textDirection: TextDirection.ltr,
            textInputAction: TextInputAction.done,
            onSubmitted: (v) => ref.read(checkoutProvider.notifier).applyCode(v),
            decoration: InputDecoration(
              hintText: 'مثلاً WELCOME',
              hintTextDirection: TextDirection.rtl,
              prefixIcon: const Icon(Icons.confirmation_number_outlined),
              errorText: state.discountError,
              errorMaxLines: 2,
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          height: 52,
          child: FilledButton.tonal(
            onPressed: state.validatingCode ? null : () => ref.read(checkoutProvider.notifier).applyCode(_code.text),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primarySoft,
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: state.validatingCode
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('اعمال'),
          ),
        ),
      ],
    );
  }
}

class _PaymentOption extends StatelessWidget {
  const _PaymentOption({required this.method, required this.selected, required this.onTap});

  final PaymentMethod method;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return Material(
      color: selected ? AppColors.primarySoft.withValues(alpha: 0.6) : AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: selected ? AppColors.primary : AppColors.border, width: selected ? 1.4 : 1),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          child: Row(
            children: [
              Icon(method.icon, color: selected ? AppColors.primary : AppColors.textSecondary),
              const SizedBox(width: 8),
              Expanded(child: Text(method.label, style: theme.titleSmall?.copyWith(fontSize: 13))),
              Icon(
                selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                size: 20,
                color: selected ? AppColors.primary : AppColors.textHint,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
