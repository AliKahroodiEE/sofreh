# Sofreh (سفره) — customer app

Flutter customer app for the Sofreh food-delivery demo: Persian (RTL) UI, phone + OTP sign-in,
restaurant browsing, cart and checkout with discount codes, a simulated online payment and live order
tracking over Socket.IO. Backend: `apps/api` (NestJS). API contract: [`docs/API.md`](../../docs/API.md).

## Run

The API must be running (default `http://localhost:4100`). Its base URL is passed at build time with
`--dart-define=API_URL=...`.

```bash
flutter pub get

# Web (the API allows CORS from http://localhost:5100)
flutter run -d chrome --web-port 5100 --dart-define=API_URL=http://localhost:4100

# Web release build, served as static files
flutter build web --release --no-web-resources-cdn --dart-define=API_URL=http://localhost:4100
python3 -m http.server 5100 --directory build/web      # open http://localhost:5100

# Android emulator (10.0.2.2 is the emulator's alias for the host machine)
flutter run -d emulator-5554 --dart-define=API_URL=http://10.0.2.2:4100

# iOS simulator
flutter run -d "iPhone 16" --dart-define=API_URL=http://localhost:4100

# Quality
flutter analyze
flutter test
```

Demo login: customer `09121111111`. When the API runs with `OTP_DEV_MODE=true` the code is shown
on the OTP screen («کد آزمایشی»); tap it to fill it in. Try the discount code `WELCOME`.

`--no-web-resources-cdn` bundles CanvasKit with the build so the web app does not depend on Google's
CDN (often blocked in Iran). Fonts are bundled for the same reason (Vazirmatn, SIL OFL).

## Architecture

Feature-first layout. Each feature has three layers:

* **domain** — immutable models with hand-written `fromJson` and pure business rules (no Flutter
  imports beyond icons/colours for enums).
* **data** — repositories: thin wrappers around the REST endpoints. Every call goes through
  `guardApi`, so callers only ever see an `ApiException` carrying the API's Persian `message`.
* **presentation** — Riverpod controllers (`Notifier` / `AsyncNotifier`) and widgets.

State is managed with **flutter_riverpod 3**, navigation with **go_router** (auth redirects + a
`StatefulShellRoute` for the bottom tabs), HTTP with **dio**.

Key pieces:

| Concern | Where |
|---|---|
| API base URL, image URLs | `lib/core/config/app_config.dart` |
| Bearer token + single-flight refresh on 401 (refresh tokens are rotated) | `lib/core/network/auth_interceptor.dart` |
| Persian error messages | `lib/core/network/api_exception.dart` |
| Session storage (SharedPreferences for the demo; use `flutter_secure_storage` in production) | `lib/core/storage/session_storage.dart` |
| Socket.IO `/realtime` connection with token re-auth | `lib/core/realtime/realtime_service.dart`, `lib/features/orders/data/order_live_updates.dart` |
| Price rules identical to the server (`order-rules.ts`) | `lib/core/pricing/pricing.dart` |
| Persian digits, toman, phone, Jalali dates | `lib/core/formatters/persian_format.dart` |
| Theme (pomegranate red / saffron, Vazirmatn) | `lib/core/theme/` |
| Routes and auth redirect | `lib/core/router/app_router.dart` |

## Folder map

```
lib/
  main.dart                 bootstrap (SharedPreferences, ProviderScope)
  app.dart                  MaterialApp.router, fa locale (RTL), theme
  core/
    config/ formatters/ network/ pricing/ realtime/ router/ storage/ theme/ widgets/
  features/
    auth/        splash, phone, OTP, name step, session controller
    catalog/     home (address, cuisines, promo, discounted row, sortable paginated list), search
    restaurant/  restaurant page: menu sections, dish tiles, reviews
    cart/        cart model (one restaurant), persistence, sticky cart bar
    checkout/    checkout screen, discount validation, simulated payment gateway
    orders/      history, live tracking, cancel, review
    profile/     name, saved addresses, logout
test/
  core/ features/ widgets/    formatters, pricing/cart, model parsing, widgets, router redirect
```

## Screens

Splash → login (phone) → OTP (5 boxes, 60 s resend, dev-code hint) → name (new users) → tabs:
**خانه** (home), **جستجو** (search), **سفارش‌ها** (orders), **پروفایل** (profile). Restaurant page,
checkout, payment gateway and order tracking open above the tabs.
