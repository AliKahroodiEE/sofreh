import 'package:dio/dio.dart';

/// An error the UI can show as-is.
///
/// The Sofreh API always returns a Persian `message`; network failures are
/// mapped to Persian messages here, so screens never show raw exceptions.
class ApiException implements Exception {
  /// Creates an exception with a user-facing [message].
  const ApiException(this.message, {this.statusCode});

  /// Wraps any error thrown by the data layer.
  factory ApiException.from(Object error) {
    if (error is ApiException) return error;
    if (error is DioException) return ApiException._fromDio(error);
    return const ApiException(unexpectedMessage);
  }

  factory ApiException._fromDio(DioException error) {
    // An interceptor may already have wrapped the error.
    if (error.error is ApiException) return error.error! as ApiException;

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.transformTimeout:
        return const ApiException('پاسخی از سرور دریافت نشد. لطفاً دوباره تلاش کنید.');
      case DioExceptionType.connectionError:
        return const ApiException(offlineMessage);
      case DioExceptionType.cancel:
        return const ApiException('درخواست لغو شد.');
      case DioExceptionType.badCertificate:
      case DioExceptionType.badResponse:
      case DioExceptionType.unknown:
        break;
    }

    final response = error.response;
    final status = response?.statusCode;
    final data = response?.data;
    if (data is Map && data['message'] != null) {
      final message = data['message'];
      final text = message is List ? message.join('\n') : message.toString();
      return ApiException(text, statusCode: status);
    }
    if (status == 429) return ApiException('تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.', statusCode: status);
    if (status != null && status >= 500) {
      return ApiException('سرور با مشکل مواجه شد. لطفاً بعداً تلاش کنید.', statusCode: status);
    }
    if (response == null) return const ApiException(offlineMessage);
    return ApiException(unexpectedMessage, statusCode: status);
  }

  /// Shown when the server cannot be reached.
  static const offlineMessage = 'اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید.';

  /// Fallback for unknown failures.
  static const unexpectedMessage = 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.';

  /// Persian, user-facing message.
  final String message;

  /// HTTP status code, when the server answered.
  final int? statusCode;

  /// True for 401 responses.
  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}

/// Runs [request] and converts any failure into an [ApiException].
Future<T> guardApi<T>(Future<T> Function() request) async {
  try {
    return await request();
  } catch (error) {
    throw ApiException.from(error);
  }
}
