import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_controller.dart';
import '../../restaurant/domain/menu_item.dart';
import '../../restaurant/domain/restaurant_detail.dart';
import '../data/cart_storage.dart';
import '../domain/cart.dart';

/// Outcome of [CartController.add].
enum AddToCartResult {
  /// The dish was added.
  added,

  /// The cart holds another restaurant's dishes; ask before replacing.
  otherRestaurant,
}

/// App-wide cart state, persisted on every change and cleared on logout.
class CartController extends Notifier<Cart> {
  @override
  Cart build() {
    ref.listen(authControllerProvider, (previous, next) {
      if (previous is Authenticated && next is Unauthenticated) clear();
    });
    return ref.read(cartStorageProvider).load();
  }

  void _set(Cart cart) {
    state = cart;
    ref.read(cartStorageProvider).save(cart);
  }

  /// Adds one [item]; returns [AddToCartResult.otherRestaurant] without
  /// changing anything when the cart belongs to another restaurant.
  AddToCartResult add(CartRestaurant restaurant, MenuItem item) {
    if (state.conflictsWith(restaurant.id)) return AddToCartResult.otherRestaurant;
    _set(state.add(restaurant, item));
    return AddToCartResult.added;
  }

  /// Empties the cart and adds [item] from [restaurant].
  void replaceWith(CartRestaurant restaurant, MenuItem item) => _set(Cart.empty.add(restaurant, item));

  /// One more of [menuItemId].
  void increment(int menuItemId) => _set(state.setQuantity(menuItemId, state.quantityOf(menuItemId) + 1));

  /// One less of [menuItemId] (removes the line at zero).
  void decrement(int menuItemId) => _set(state.setQuantity(menuItemId, state.quantityOf(menuItemId) - 1));

  /// Removes a dish.
  void remove(int menuItemId) => _set(state.setQuantity(menuItemId, 0));

  /// Updates prices and availability from a freshly loaded menu.
  void sync(RestaurantDetail detail) {
    final synced = state.syncWith(detail);
    if (!identical(synced, state)) _set(synced);
  }

  /// Empties the cart.
  void clear() => _set(Cart.empty);
}

/// The cart.
final cartProvider = NotifierProvider<CartController, Cart>(CartController.new);
