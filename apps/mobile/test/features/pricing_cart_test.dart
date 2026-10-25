import 'package:flutter_test/flutter_test.dart';
import 'package:sofreh/core/pricing/pricing.dart';
import 'package:sofreh/features/cart/domain/cart.dart';
import 'package:sofreh/features/restaurant/domain/menu_item.dart';

const _napoli = CartRestaurant(id: 10, name: 'پیتزا ناپل‌نو', slug: 'napoli-no', deliveryFee: 30000, minOrder: 250000);
const _other = CartRestaurant(id: 11, name: 'برگر دودی', slug: 'dudi-burger', deliveryFee: 20000, minOrder: 150000);

const _margherita = MenuItem(id: 58, restaurantId: 10, name: 'پیتزا مارگاریتا', price: 340000);
const _pepperoni = MenuItem(id: 59, restaurantId: 10, name: 'پیتزا پپرونی', price: 395000, discountPercent: 15);
const _burger = MenuItem(id: 70, restaurantId: 11, name: 'برگر دودی', price: 290000);

void main() {
  group('pricing (mirrors the server)', () {
    test('discountedPrice rounds to whole toman', () {
      expect(discountedPrice(395000, 15), 335750);
      expect(discountedPrice(340000, 0), 340000);
      expect(discountedPrice(99999, 33), 66999); // 66999.33 → 66999
      expect(discountedPrice(1005, 50), 503); // 502.5 → 503 (half up, like Math.round)
    });

    test('matches the API example order (2 × pepperoni, WELCOME, delivery 30k)', () {
      final cart = Cart.empty.add(_napoli, _pepperoni).add(_napoli, _pepperoni);
      final totals = cart.totals(codeDiscount: 60000);
      expect(totals.subtotal, 790000);
      expect(totals.itemsDiscount, 118500);
      expect(totals.foodTotal, 671500);
      expect(totals.deliveryFee, 30000);
      expect(totals.total, 641500);
    });

    test('code discount never makes the food total negative', () {
      final cart = Cart.empty.add(_napoli, _margherita);
      expect(cart.totals(codeDiscount: 999999).total, 30000);
    });
  });

  group('Cart', () {
    test('adds, increments and removes lines', () {
      var cart = Cart.empty.add(_napoli, _margherita).add(_napoli, _pepperoni).add(_napoli, _margherita);
      expect(cart.itemCount, 3);
      expect(cart.quantityOf(_margherita.id), 2);
      cart = cart.setQuantity(_margherita.id, 0);
      expect(cart.quantityOf(_margherita.id), 0);
      expect(cart.lines, hasLength(1));
      cart = cart.setQuantity(_pepperoni.id, 0);
      expect(cart.isEmpty, isTrue);
      expect(cart.restaurant, isNull);
    });

    test('caps quantity at 20 per dish', () {
      var cart = Cart.empty;
      for (var i = 0; i < 25; i++) {
        cart = cart.add(_napoli, _margherita);
      }
      expect(cart.quantityOf(_margherita.id), Cart.maxQuantity);
    });

    test('detects another restaurant', () {
      final cart = Cart.empty.add(_napoli, _margherita);
      expect(cart.conflictsWith(_other.id), isTrue);
      expect(cart.conflictsWith(_napoli.id), isFalse);
      // Adding from another restaurant replaces the cart (after confirmation in the UI).
      final replaced = cart.add(_other, _burger);
      expect(replaced.restaurant!.id, _other.id);
      expect(replaced.itemCount, 1);
    });

    test('minimum order uses the food total after dish discounts', () {
      final cart = Cart.empty.add(_napoli, _pepperoni); // 335,750 ≥ 250,000
      expect(cart.meetsMinOrder, isTrue);
      final small = Cart.empty.add(const CartRestaurant(id: 1, name: 'x', slug: 'x', deliveryFee: 0, minOrder: 400000), _pepperoni);
      expect(small.meetsMinOrder, isFalse);
      expect(small.remainingToMinOrder, 400000 - 335750);
    });

    test('survives a JSON round trip', () {
      final cart = Cart.empty.add(_napoli, _margherita).add(_napoli, _pepperoni).add(_napoli, _pepperoni);
      final restored = Cart.fromJson(cart.toJson());
      expect(restored.restaurant!.slug, 'napoli-no');
      expect(restored.quantityOf(_pepperoni.id), 2);
      expect(restored.totals().total, cart.totals().total);
    });
  });
}
