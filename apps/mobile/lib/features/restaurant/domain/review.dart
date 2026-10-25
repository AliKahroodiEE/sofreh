/// A customer review of a restaurant (`GET /restaurants/:id/reviews`).
class Review {
  /// Creates a review.
  const Review({required this.id, required this.rating, this.comment, required this.createdAt, this.userName});

  /// Parses the API JSON.
  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: (json['id'] as num).toInt(),
        rating: (json['rating'] as num).toInt(),
        comment: json['comment'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        userName: (json['user'] as Map<String, dynamic>?)?['name'] as String?,
      );

  final int id;

  /// 1–5.
  final int rating;
  final String? comment;
  final DateTime createdAt;
  final String? userName;
}
