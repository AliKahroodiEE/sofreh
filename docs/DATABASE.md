# Database

PostgreSQL 17, accessed through [Prisma](https://www.prisma.io/) (`apps/api/prisma/schema.prisma` is the source of truth).
Migrations live in `apps/api/prisma/migrations/` and are applied automatically when the API container starts
(`prisma migrate deploy`). Redis holds only short-lived data (see the end of this page).

## Entity-relationship diagram

```mermaid
erDiagram
  User ||--o{ Address : has
  User ||--o{ Order : places
  User ||--o{ Review : writes
  Cuisine }o--o{ Restaurant : tags
  Restaurant ||--o{ MenuSection : has
  Restaurant ||--o{ MenuItem : sells
  MenuSection ||--o{ MenuItem : groups
  Restaurant ||--o{ Order : receives
  Order ||--|{ OrderItem : contains
  MenuItem |o--o{ OrderItem : "snapshot of"
  Order ||--o{ OrderStatusLog : "history"
  Order |o--o| Review : "rated by"
  DiscountCode |o--o{ Order : "applied to"

  User {
    int id PK
    string phone UK "09xxxxxxxxx"
    string name
    enum role "CUSTOMER | ADMIN"
    bool isActive
  }
  Restaurant {
    int id PK
    string slug UK
    float rating "average of reviews"
    int deliveryFee "toman"
    int minOrder "toman"
    bool isOpen
    bool isActive
  }
  MenuItem {
    int id PK
    int price "toman"
    int discountPercent
    bool isAvailable
  }
  Order {
    int id PK
    string code UK "SF-123456"
    enum status
    enum paymentMethod "ONLINE | CASH"
    bool isPaid
    int subtotal
    int itemsDiscount
    int codeDiscount
    int deliveryFee
    int total
  }
  OrderItem {
    string name "copied at order time"
    int unitPrice "after dish discount"
    int quantity
  }
  DiscountCode {
    string code UK
    enum type "PERCENT | FIXED"
    int value
    int maxDiscount
    int minOrder
    int usageLimit
    int usedCount
    datetime expiresAt
  }
```

## Tables

| Table | Purpose | Notes |
|---|---|---|
| `User` | Customers and admins | Created on first OTP login. Role `ADMIN` is given to phones listed in `ADMIN_PHONES`. |
| `Address` | Saved delivery addresses | Optional `lat`/`lng` for a future map picker. Deleted with the user. |
| `Cuisine` | Restaurant categories | `icon` is a key the apps map to an icon. Many-to-many with `Restaurant` (`_CuisineToRestaurant`). |
| `Restaurant` | Vendors | `rating`/`ratingCount` are denormalised from `Review` for fast listing; recalculated on every review. `isActive=false` hides it everywhere; `isOpen=false` shows it as closed. |
| `MenuSection` | Menu groups («پیتزاها», «نوشیدنی») | Ordered by `sortOrder`. |
| `MenuItem` | Dishes | Final price = `round(price × (100 − discountPercent) / 100)`. |
| `Order` | Customer orders | Totals are calculated on the server and stored, so reports never depend on today's prices. |
| `OrderItem` | Lines of an order | Name and price are **copied** at order time; editing or deleting a dish later doesn't change old orders (`menuItemId` becomes null on delete). |
| `OrderStatusLog` | Status timeline | One row per status change; drives the tracking screen and the admin timeline. |
| `DiscountCode` | Promo codes | `usedCount` is incremented with an atomic conditional update, so a limited code can't be over-used by parallel orders. Cancelling an order gives the use back. |
| `Review` | 1–5 star ratings | One per delivered order (`orderId` is unique). |

## Order status flow

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> CONFIRMED
  PENDING --> CANCELLED
  CONFIRMED --> PREPARING
  CONFIRMED --> CANCELLED
  PREPARING --> DELIVERING
  DELIVERING --> DELIVERED
  DELIVERED --> [*]
  CANCELLED --> [*]
```

The rules live in `apps/api/src/orders/order-rules.ts` (pure functions, unit-tested). Customers can cancel only while `PENDING`.

## Indexes

Foreign keys used in filters are indexed (`userId`, `restaurantId`, `sectionId`, `orderId`), plus `Order.status` and
`Order.createdAt` for the admin board and dashboard. Unique: `User.phone`, `Restaurant.slug`, `Cuisine.slug`,
`Order.code`, `DiscountCode.code`, `Review.orderId`.

## Redis keys

| Key | Value | TTL |
|---|---|---|
| `otp:code:<phone>` | 5-digit login code | 120 s |
| `otp:cooldown:<phone>` | blocks re-sending | 60 s |
| `otp:attempts:<phone>` | wrong-code counter (max 5) | 120 s |
| `refresh:<token>` | user id (refresh tokens, rotated on use) | 30 days |
| `catalog:*` | cached cuisines, restaurant lists and menus | 60–300 s, cleared on any admin change |

## Common tasks

```bash
cd apps/api
npx prisma migrate dev --name <change>   # after editing schema.prisma: create + apply a migration
npx prisma studio                         # browse data in the browser
npm run db:seed                           # reload demo data (wipes everything)
npm run db:reset                          # drop, re-migrate and seed
```
