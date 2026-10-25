/// Compile-time configuration of the app.
///
/// The API origin is injected with `--dart-define=API_URL=...`:
///
/// * Web / iOS simulator: `http://localhost:4100` (default)
/// * Android emulator: `http://10.0.2.2:4100` (the emulator's alias for the
///   host machine's `localhost`)
/// * Real device: the LAN address of the machine running the API, or the
///   public HTTPS URL in production.
abstract final class AppConfig {
  static const String _rawApiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:4100',
  );

  /// API origin without a trailing slash, e.g. `http://localhost:4100`.
  static final String apiOrigin = _rawApiUrl.endsWith('/')
      ? _rawApiUrl.substring(0, _rawApiUrl.length - 1)
      : _rawApiUrl;

  /// Base URL of the REST API.
  static String get apiBaseUrl => '$apiOrigin/api/v1';

  /// Socket.IO namespace used for live order updates.
  static String get realtimeUrl => '$apiOrigin/realtime';

  /// HTTP timeouts.
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 20);

  /// The API returns image paths relative to its origin
  /// (`/uploads/seed-latte.webp`); this turns them into absolute URLs.
  /// Returns `null` for empty values so callers can show a placeholder.
  static String? imageUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.startsWith('/') ? '$apiOrigin$path' : '$apiOrigin/$path';
  }
}
