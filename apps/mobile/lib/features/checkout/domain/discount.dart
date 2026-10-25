/// A discount code accepted by `POST /discounts/validate`.
class AppliedDiscount {
  /// Creates the discount.
  const AppliedDiscount({required this.code, required this.discount, this.description, required this.amount});

  /// Parses the API JSON; [amount] is the food total it was validated for.
  factory AppliedDiscount.fromJson(Map<String, dynamic> json, {required int amount}) => AppliedDiscount(
        code: json['code'] as String,
        description: json['description'] as String?,
        discount: (json['discount'] as num).toInt(),
        amount: amount,
      );

  /// Normalised (upper-case) code.
  final String code;
  final String? description;

  /// Toman taken off the food total.
  final int discount;

  /// The food total the code was validated against; re-validate when it changes.
  final int amount;
}
