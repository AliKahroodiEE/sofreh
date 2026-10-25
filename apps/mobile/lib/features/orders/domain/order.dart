import '../../../core/pricing/pricing.dart';
import 'order_status.dart';

/// A dish in an order. The list endpoint only returns `name` and `quantity`.
class OrderItem {
  /// Creates an order line.
  const OrderItem({required this.name, required this.quantity, this.menuItemId, this.unitPrice});

  /// Parses the API JSON.
  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        name: json['name'] as String,
        quantity: (json['quantity'] as num).toInt(),
        menuItemId: (json['menuItemId'] as num?)?.toInt(),
        unitPrice: (json['unitPrice'] as num?)?.toInt(),
      );

  final String name;
  final int quantity;
  final int? menuItemId;

  /// Price paid per unit (after the dish discount).
  final int? unitPrice;

  /// `unitPrice × quantity`, when known.
  int? get total => unitPrice == null ? null : unitPrice! * quantity;
}

/// One entry of the status history.
class StatusLog {
  /// Creates a log entry.
  const StatusLog({required this.status, required this.createdAt});

  /// Parses the API JSON.
  factory StatusLog.fromJson(Map<String, dynamic> json) => StatusLog(
        status: OrderStatus.fromApi(json['status'] as String?),
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  final OrderStatus status;
  final DateTime createdAt;
}

/// The restaurant summary embedded in orders.
class OrderRestaurant {
  /// Creates the summary.
  const OrderRestaurant({required this.id, required this.name, this.slug, this.logo, this.address});

  /// Parses the API JSON.
  factory OrderRestaurant.fromJson(Map<String, dynamic> json) => OrderRestaurant(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        slug: json['slug'] as String?,
        logo: json['logo'] as String?,
        address: json['address'] as String?,
      );

  final int id;
  final String name;
  final String? slug;
  final String? logo;
  final String? address;
}

/// The customer's review of an order.
class OrderReview {
  /// Creates a review.
  const OrderReview({required this.rating, this.comment});

  /// Parses the API JSON.
  factory OrderReview.fromJson(Map<String, dynamic> json) => OrderReview(
        rating: (json['rating'] as num).toInt(),
        comment: json['comment'] as String?,
      );

  final int rating;
  final String? comment;
}

/// An order (`GET /orders`, `GET /orders/:id`, `POST /orders`, …).
///
/// List responses omit some fields (status history, item prices); they are
/// empty/null in that case.
class Order {
  /// Creates an order.
  const Order({
    required this.id,
    required this.code,
    required this.status,
    required this.paymentMethod,
    required this.isPaid,
    this.paymentRef,
    required this.subtotal,
    required this.itemsDiscount,
    required this.codeDiscount,
    required this.deliveryFee,
    required this.total,
    required this.addressText,
    this.note,
    required this.createdAt,
    required this.updatedAt,
    required this.items,
    this.statusLogs = const [],
    this.restaurant,
    this.review,
  });

  /// Parses the API JSON.
  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: (json['id'] as num).toInt(),
        code: json['code'] as String,
        status: OrderStatus.fromApi(json['status'] as String?),
        paymentMethod: PaymentMethod.fromApi(json['paymentMethod'] as String?),
        isPaid: json['isPaid'] as bool? ?? false,
        paymentRef: json['paymentRef'] as String?,
        subtotal: (json['subtotal'] as num?)?.toInt() ?? 0,
        itemsDiscount: (json['itemsDiscount'] as num?)?.toInt() ?? 0,
        codeDiscount: (json['codeDiscount'] as num?)?.toInt() ?? 0,
        deliveryFee: (json['deliveryFee'] as num?)?.toInt() ?? 0,
        total: (json['total'] as num?)?.toInt() ?? 0,
        addressText: json['addressText'] as String? ?? '',
        note: json['note'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: DateTime.parse((json['updatedAt'] ?? json['createdAt']) as String),
        items: (json['items'] as List<dynamic>? ?? const [])
            .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        statusLogs: (json['statusLogs'] as List<dynamic>? ?? const [])
            .map((e) => StatusLog.fromJson(e as Map<String, dynamic>))
            .toList(),
        restaurant: json['restaurant'] == null
            ? null
            : OrderRestaurant.fromJson(json['restaurant'] as Map<String, dynamic>),
        review: json['review'] == null ? null : OrderReview.fromJson(json['review'] as Map<String, dynamic>),
      );

  final int id;

  /// Human-friendly code, e.g. `SF-727399`.
  final String code;
  final OrderStatus status;
  final PaymentMethod paymentMethod;
  final bool isPaid;

  /// Gateway reference after a successful online payment.
  final String? paymentRef;
  final int subtotal;
  final int itemsDiscount;
  final int codeDiscount;
  final int deliveryFee;
  final int total;
  final String addressText;
  final String? note;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<OrderItem> items;
  final List<StatusLog> statusLogs;
  final OrderRestaurant? restaurant;
  final OrderReview? review;

  /// The price breakdown as charged by the server.
  PriceBreakdown get breakdown => PriceBreakdown(
        subtotal: subtotal,
        itemsDiscount: itemsDiscount,
        codeDiscount: codeDiscount,
        deliveryFee: deliveryFee,
        total: total,
      );

  /// Total number of dishes.
  int get itemCount => items.fold(0, (sum, i) => sum + i.quantity);

  /// «۲× پیتزا پپرونی، ۱× نوشابه».
  String get itemsSummary => items.map((i) => '${i.quantity}× ${i.name}').join('، ');

  /// An online order that still needs to be paid.
  bool get awaitsPayment => paymentMethod == PaymentMethod.online && !isPaid && status != OrderStatus.cancelled;

  /// Customers can cancel only before the restaurant confirms.
  bool get canCancel => status == OrderStatus.pending;

  /// Delivered orders can be reviewed once.
  bool get canReview => status == OrderStatus.delivered && review == null;

  /// When the order reached [s], if it did.
  DateTime? reachedAt(OrderStatus s) {
    for (final log in statusLogs) {
      if (log.status == s) return log.createdAt;
    }
    return null;
  }

  /// Copies with fields from a live update.
  Order copyWith({OrderStatus? status, bool? isPaid, DateTime? updatedAt}) => Order(
        id: id,
        code: code,
        status: status ?? this.status,
        paymentMethod: paymentMethod,
        isPaid: isPaid ?? this.isPaid,
        paymentRef: paymentRef,
        subtotal: subtotal,
        itemsDiscount: itemsDiscount,
        codeDiscount: codeDiscount,
        deliveryFee: deliveryFee,
        total: total,
        addressText: addressText,
        note: note,
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        items: items,
        statusLogs: statusLogs,
        restaurant: restaurant,
        review: review,
      );
}

/// Payload of the Socket.IO `order.updated` event.
class OrderUpdate {
  /// Creates an update.
  const OrderUpdate({required this.id, required this.code, required this.status, required this.isPaid, this.updatedAt});

  /// Parses the event payload.
  factory OrderUpdate.fromJson(Map<String, dynamic> json) => OrderUpdate(
        id: (json['id'] as num).toInt(),
        code: json['code'] as String? ?? '',
        status: OrderStatus.fromApi(json['status'] as String?),
        isPaid: json['isPaid'] as bool? ?? false,
        updatedAt: json['updatedAt'] == null ? null : DateTime.tryParse(json['updatedAt'].toString()),
      );

  final int id;
  final String code;
  final OrderStatus status;
  final bool isPaid;
  final DateTime? updatedAt;
}
