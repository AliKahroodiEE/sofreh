import 'app_user.dart';

/// Result of `POST /auth/otp/request`.
class OtpRequestResult {
  /// Creates the result.
  const OtpRequestResult({required this.phone, required this.expiresIn, this.devCode});

  /// Parses the API JSON.
  factory OtpRequestResult.fromJson(Map<String, dynamic> json) => OtpRequestResult(
        phone: json['phone'] as String,
        expiresIn: (json['expiresIn'] as num).toInt(),
        devCode: json['devCode'] as String?,
      );

  /// The normalised phone the code was sent to.
  final String phone;

  /// Seconds until the code expires.
  final int expiresIn;

  /// Only present when the API runs in OTP dev mode (local/demo).
  final String? devCode;
}

/// Result of `POST /auth/otp/verify`.
class AuthResult {
  /// Creates the result.
  const AuthResult({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
    required this.isNewUser,
  });

  /// Parses the API JSON.
  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        user: AppUser.fromJson(json['user'] as Map<String, dynamic>),
        isNewUser: json['isNewUser'] as bool? ?? false,
      );

  final String accessToken;
  final String refreshToken;
  final AppUser user;

  /// True when the user has no name yet.
  final bool isNewUser;
}
