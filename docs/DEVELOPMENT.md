# Development guide

## Requirements

- Node.js 22.18+ (24 recommended) and npm
- Docker (Docker Desktop, OrbStack or Colima) for PostgreSQL and Redis
- Flutter 3.x for the mobile app (Android Studio / Xcode for device builds)

## First run

```bash
# 1. databases
docker compose up -d postgres redis

# 2. API  → http://localhost:4100/api/v1   (Swagger: http://localhost:4100/api/docs)
cd apps/api
cp .env.example .env            # then set JWT_ACCESS_SECRET (openssl rand -hex 32)
npm install
npx prisma migrate deploy
npm run db:seed                 # demo restaurants, orders and users
npm run start:dev

# 3. admin panel  → http://localhost:3100
cd apps/admin
npm install
npm run dev

# 4. mobile app (web build for quick testing)  → http://localhost:5100
cd apps/mobile
flutter pub get
flutter run -d chrome --web-port 5100 --dart-define=API_URL=http://localhost:4100
```

**Demo logins** (with `OTP_DEV_MODE=true` the code is returned by the API and shown on screen):
admin `09120000000`, customer `09121111111`. Discount codes: `WELCOME`, `SOFREH50`.

## Everyday commands (`apps/api`)

| Command | What it does |
|---|---|
| `npm run start:dev` | API with auto-reload |
| `npm test` | unit tests (Vitest) |
| `npm run test:e2e` | end-to-end tests against the local PostgreSQL + Redis |
| `npm run lint` | Oxlint (type-aware) |
| `npx prisma migrate dev --name <change>` | create a migration after editing `schema.prisma` |
| `npx prisma studio` | browse the database |
| `npm run db:reset` | recreate the database and reload demo data |

## Adding a feature (example: «favourite restaurants»)

1. **Database:** add a `Favorite` model to `prisma/schema.prisma`, run `npx prisma migrate dev --name favorites`.
2. **API:** create `src/favorites/favorites.module.ts` with a controller (routes), a service (Prisma calls) and
   DTO classes with `class-validator` decorators; register the module in `app.module.ts`. Routes are private by
   default; add `@Public()` or `@Roles('ADMIN')` as needed. Swagger picks up the routes and DTOs automatically.
3. **Rules:** put pure business logic in a separate file and unit-test it (see `orders/order-rules.ts`).
4. **Clients:** regenerate `docs/openapi.json` (`curl localhost:4100/api/docs-json`), then add the call to the
   admin API client (`apps/admin`) or a repository in the Flutter feature folder (`apps/mobile/lib/features/...`).
5. Run lint + tests; CI runs the same checks on every push.

## Conventions

- API messages shown to users are in Persian; code, comments and docs are in English.
- Money is integer toman everywhere; dates are UTC in the API and formatted to the Persian calendar in the clients.
- Image fields hold paths like `/uploads/x.webp`; clients prefix the API origin.
- Commit messages: imperative mood (“Add favourites API”).

## Integrations to switch on for production

| Integration | Where | What to do |
|---|---|---|
| SMS (OTP) | `apps/api/src/auth/sms.service.ts` | call your provider's API in `send()`, set `OTP_DEV_MODE=false` |
| Payment gateway | `OrdersService.pay()` | replace with gateway request + verify callback |
| Push notifications | `RealtimeService` | also send FCM notifications for status changes |
| Maps | `Address.lat/lng` | add a map picker (Neshan / Mapir) in the app |
