/// A saved delivery address (`/users/me/addresses`).
class Address {
  /// Creates an address.
  const Address({required this.id, required this.title, required this.details, this.lat, this.lng});

  /// Parses the API JSON.
  factory Address.fromJson(Map<String, dynamic> json) => Address(
        id: (json['id'] as num).toInt(),
        title: json['title'] as String,
        details: json['details'] as String,
        lat: (json['lat'] as num?)?.toDouble(),
        lng: (json['lng'] as num?)?.toDouble(),
      );

  final int id;

  /// Short label: «خانه»، «محل کار».
  final String title;

  /// Full address text.
  final String details;
  final double? lat;
  final double? lng;
}
