import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/pricing/pricing.dart';
import '../../cart/presentation/cart_controller.dart';
import '../../orders/data/orders_repository.dart';
import '../../orders/domain/order.dart';
import '../../orders/domain/order_status.dart';
import '../../profile/domain/address.dart';
import '../data/discount_repository.dart';
import '../domain/discount.dart';

/// Checkout choices: address, discount code and payment method.
class CheckoutState {
  /// Creates the state.
  const CheckoutState({
    this.paymentMethod = PaymentMethod.online,
    this.addressId,
    this.discount,
    this.discountError,
    this.validatingCode = false,
    this.placing = false,
  });

  final PaymentMethod paymentMethod;

  /// Chosen address; `null` means "the address picked on the home screen".
  final int? addressId;

  /// The validated discount code, if any.
  final AppliedDiscount? discount;

  /// Persian reason when the last code was rejected.
  final String? discountError;
  final bool validatingCode;
  final bool placing;

  /// Copies with changes. `discount`/`discountError` are replaced as given
  /// when [updateDiscount] is true.
  CheckoutState copyWith({
    PaymentMethod? paymentMethod,
    int? addressId,
    bool updateDiscount = false,
    AppliedDiscount? discount,
    String? discountError,
    bool? validatingCode,
    bool? placing,
  }) =>
      CheckoutState(
        paymentMethod: paymentMethod ?? this.paymentMethod,
        addressId: addressId ?? this.addressId,
        discount: updateDiscount ? discount : this.discount,
        discountError: updateDiscount ? discountError : this.discountError,
        validatingCode: validatingCode ?? this.validatingCode,
        placing: placing ?? this.placing,
      );
}

/// Drives the checkout screen. The discount code is re-validated whenever the
/// food total changes, because the API computes it from that amount.
class CheckoutController extends Notifier<CheckoutState> {
  @override
  CheckoutState build() {
    ref.listen(cartProvider.select((c) => c.foodTotal), (_, total) {
      final discount = state.discount;
      if (discount != null && discount.amount != total && total > 0) _revalidate(discount.code, total);
    });
    return const CheckoutState();
  }

  /// The price breakdown for the current cart and code.
  PriceBreakdown get totals => ref.read(cartProvider).totals(codeDiscount: state.discount?.discount ?? 0);

  /// Chooses the payment method.
  void setPaymentMethod(PaymentMethod method) => state = state.copyWith(paymentMethod: method);

  /// Chooses the delivery address.
  void setAddress(int id) => state = state.copyWith(addressId: id);

  /// Validates and applies [code]; on failure the reason is kept in
  /// [CheckoutState.discountError].
  Future<void> applyCode(String code) async {
    final trimmed = code.trim();
    if (trimmed.isEmpty) return;
    state = state.copyWith(validatingCode: true, updateDiscount: true);
    await _revalidate(trimmed, ref.read(cartProvider).foodTotal);
  }

  Future<void> _revalidate(String code, int amount) async {
    state = state.copyWith(validatingCode: true);
    try {
      final discount = await ref.read(discountRepositoryProvider).validate(code, amount);
      if (!ref.mounted) return;
      state = state.copyWith(validatingCode: false, updateDiscount: true, discount: discount);
    } on ApiException catch (error) {
      if (!ref.mounted) return;
      state = state.copyWith(validatingCode: false, updateDiscount: true, discountError: error.message);
    }
  }

  /// Removes the discount code.
  void removeCode() => state = state.copyWith(updateDiscount: true);

  /// Sends `POST /orders` for the current cart. The caller navigates and
  /// clears the cart afterwards (so the screen never flashes an empty cart).
  Future<Order> placeOrder({required Address address, String? note}) async {
    final cart = ref.read(cartProvider);
    state = state.copyWith(placing: true);
    try {
      return await ref.read(ordersRepositoryProvider).create(
            restaurantId: cart.restaurant!.id,
            items: [for (final line in cart.lines) (menuItemId: line.item.id, quantity: line.quantity)],
            paymentMethod: state.paymentMethod,
            addressId: address.id,
            discountCode: state.discount?.code,
            note: note,
          );
    } finally {
      if (ref.mounted) state = state.copyWith(placing: false);
    }
  }
}

/// Checkout state; reset each time the checkout screen is opened.
final checkoutProvider = NotifierProvider.autoDispose<CheckoutController, CheckoutState>(CheckoutController.new);
