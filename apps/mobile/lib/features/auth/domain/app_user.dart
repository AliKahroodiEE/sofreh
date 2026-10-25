/// The signed-in user (`GET /auth/me`, `PATCH /users/me`).
class AppUser {
  /// Creates a user.
  const AppUser({required this.id, required this.phone, this.name, this.role = 'CUSTOMER'});

  /// Parses the API JSON.
  factory AppUser.fromJson(Map<String, dynamic> json) {
    final name = (json['name'] as String?)?.trim();
    return AppUser(
      id: (json['id'] as num).toInt(),
      phone: json['phone'] as String,
      name: (name == null || name.isEmpty) ? null : name,
      role: json['role'] as String? ?? 'CUSTOMER',
    );
  }

  final int id;

  /// Normalised mobile number, `09xxxxxxxxx`.
  final String phone;

  /// Full name; `null` until the user sets it after the first sign-in.
  final String? name;

  /// `CUSTOMER` or `ADMIN`.
  final String role;

  /// Whether the profile still needs a name.
  bool get needsName => name == null;

  /// Serialises for the session cache.
  Map<String, dynamic> toJson() => {'id': id, 'phone': phone, 'name': name, 'role': role};

  /// Copies with a new name.
  AppUser copyWith({String? name}) => AppUser(id: id, phone: phone, name: name ?? this.name, role: role);
}
