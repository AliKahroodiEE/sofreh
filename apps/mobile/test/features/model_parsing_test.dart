import 'package:flutter_test/flutter_test.dart';
import 'package:sofreh/core/network/paginated.dart';
import 'package:sofreh/features/auth/domain/auth_models.dart';
import 'package:sofreh/features/catalog/domain/restaurant_summary.dart';
import 'package:sofreh/features/orders/domain/order.dart';
import 'package:sofreh/features/orders/domain/order_status.dart';
import 'package:sofreh/features/restaurant/domain/restaurant_detail.dart';

// JSON samples taken from docs/API.md.
void main() {
  test('restaurant list page', () {
    final page = Paginated.fromJson({
      'items': [
        {
          'id': 9,
          'name': 'کبابسرای آتشکده',
          'slug': 'atashkadeh',
          'logo': null,
          'cover': '/uploads/seed-kebab-grill.webp',
          'rating': 4.5,
          'ratingCount': 2,
          'deliveryFee': 25000,
          'minOrder': 200000,
          'deliveryTimeMin': 35,
          'deliveryTimeMax': 50,
          'isOpen': true,
          'cuisines': [
            {'id': 9, 'name': 'ایرانی', 'slug': 'iranian'},
          ],
          'maxDiscountPercent': 10,
        },
      ],
      'total': 8,
      'page': 1,
      'limit': 1,
    }, RestaurantSummary.fromJson);
    expect(page.hasMore, isTrue);
    final r = page.items.single;
    expect(r.slug, 'atashkadeh');
    expect(r.rating, 4.5);
    expect(r.maxDiscountPercent, 10);
    expect(r.cuisineNames, 'ایرانی');
  });

  test('restaurant detail with menu', () {
    final r = RestaurantDetail.fromJson({
      'id': 10,
      'name': 'پیتزا ناپل‌نو',
      'slug': 'napoli-no',
      'rating': 4.4,
      'ratingCount': 5,
      'deliveryFee': 30000,
      'minOrder': 250000,
      'deliveryTimeMin': 30,
      'deliveryTimeMax': 45,
      'isOpen': true,
      'cuisines': [],
      'sections': [
        {
          'id': 23,
          'name': 'پیتزاها',
          'items': [
            {'id': 59, 'restaurantId': 10, 'name': 'پیتزا پپرونی', 'price': 395000, 'discountPercent': 15, 'isAvailable': true},
          ],
        },
        {'id': 24, 'name': 'خالی', 'items': []},
      ],
    });
    expect(r.sections, hasLength(1)); // empty sections are dropped
    expect(r.allItems.single.finalPrice, 335750);
  });

  test('auth responses', () {
    final otp = OtpRequestResult.fromJson({'phone': '09121111111', 'expiresIn': 120, 'devCode': '24930'});
    expect(otp.devCode, '24930');
    final auth = AuthResult.fromJson({
      'accessToken': 'a',
      'refreshToken': 'r',
      'user': {'id': 28, 'phone': '09121111111', 'name': null, 'role': 'CUSTOMER'},
      'isNewUser': true,
    });
    expect(auth.isNewUser, isTrue);
    expect(auth.user.needsName, isTrue);
  });

  test('order detail', () {
    final order = Order.fromJson({
      'id': 171,
      'code': 'SF-727399',
      'status': 'PENDING',
      'paymentMethod': 'ONLINE',
      'isPaid': false,
      'paymentRef': null,
      'subtotal': 790000,
      'itemsDiscount': 118500,
      'codeDiscount': 60000,
      'deliveryFee': 30000,
      'total': 641500,
      'addressText': 'خانه — تهران',
      'note': null,
      'createdAt': '2026-10-25T07:09:24.224Z',
      'updatedAt': '2026-10-25T07:09:24.224Z',
      'items': [
        {'id': 288, 'orderId': 171, 'menuItemId': 59, 'name': 'پیتزا پپرونی', 'unitPrice': 335750, 'quantity': 2},
      ],
      'statusLogs': [
        {'id': 757, 'orderId': 171, 'status': 'PENDING', 'createdAt': '2026-10-25T07:09:24.224Z'},
      ],
      'restaurant': {'id': 10, 'name': 'پیتزا ناپل‌نو', 'slug': 'napoli-no', 'logo': null, 'address': 'تهران'},
      'review': null,
    });
    expect(order.status, OrderStatus.pending);
    expect(order.paymentMethod, PaymentMethod.online);
    expect(order.awaitsPayment, isTrue);
    expect(order.canCancel, isTrue);
    expect(order.items.single.total, 671500);
    expect(order.breakdown.total, 641500);
    expect(order.reachedAt(OrderStatus.pending), isNotNull);
    expect(order.itemsSummary, '2× پیتزا پپرونی');

    final updated = order.copyWith(status: OrderStatus.delivered, isPaid: true);
    expect(updated.canReview, isTrue);
    expect(updated.awaitsPayment, isFalse);
  });

  test('socket order.updated payload and status labels', () {
    final u = OrderUpdate.fromJson({'id': 171, 'code': 'SF-727399', 'status': 'DELIVERING', 'isPaid': true, 'updatedAt': '2026-10-25T07:20:00.000Z'});
    expect(u.status, OrderStatus.delivering);
    expect(u.status.label, 'پیک در راه است');
    expect(OrderStatus.fromApi('CANCELLED').stepIndex, -1);
  });
}
