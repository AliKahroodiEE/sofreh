# Sofreh API reference

Interactive docs (Swagger UI): `http://localhost:4100/api/docs` · machine-readable spec: [`openapi.json`](openapi.json).
All examples below were captured from the running API with the demo data.

## Conventions

- **Base URL:** `/api/v1` (e.g. `http://localhost:4100/api/v1`; behind Nginx: `http://localhost:8080/api/v1`).
- **Auth:** `Authorization: Bearer <accessToken>`. Access tokens live 15 minutes; on `401` call `POST /auth/refresh`
  with the refresh token (it is rotated: the response has a new pair and the old refresh token stops working).
- **Money** is integer **toman**. **Dates** are ISO-8601 UTC strings.
- **Images** are paths relative to the API origin (`/uploads/seed-latte.webp`); prepend the origin (`http://localhost:4100`).
- **Lists** are paginated: `?page=1&limit=20` → `{ items, total, page, limit }`.
- **Errors** always have a Persian `message` that can be shown to the user as-is:
```json
{
  "message": "مهلت استفاده از این کد تمام شده است.",
  "error": "Bad Request",
  "statusCode": 400
}
```
  Validation errors also list every problem in `errors`:
```json
{
  "statusCode": 400,
  "message": "سبد خرید خالی است.",
  "errors": [
    "سبد خرید خالی است."
  ]
}
```

## Auth (phone + one-time code)

`POST /auth/otp/request` `{ "phone": "09121111111" }` — Persian digits and `+98` are accepted.
`devCode` is only present when the server runs with `OTP_DEV_MODE=true` (local/demo); a new code can be requested after 60 s.
```json
{
  "phone": "09121111111",
  "expiresIn": 120,
  "devCode": "24930"
}
```

`POST /auth/otp/verify` `{ "phone", "code" }` → tokens + user. `isNewUser` is true when the user has no name yet (ask for it).
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<random string>",
  "user": {
    "id": 28,
    "phone": "09121111111",
    "name": "سارا محمدی",
    "role": "CUSTOMER"
  },
  "isNewUser": false
}
```

`POST /auth/refresh` `{ "refreshToken" }` → `{ accessToken, refreshToken }` · `POST /auth/logout` `{ "refreshToken" }` · `GET /auth/me` → user.
Phones in `ADMIN_PHONES` get role `ADMIN`. Demo: admin `09120000000`, customer `09121111111`.

## Profile & addresses (customer)

`PATCH /users/me` `{ "name" }` · `GET /users/me/addresses` · `POST /users/me/addresses` `{ title, details, lat?, lng? }` · `DELETE /users/me/addresses/:id`
```json
[
  {
    "id": 3,
    "userId": 28,
    "title": "خانه",
    "details": "تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۱۲، واحد ۴",
    "lat": 35.7801,
    "lng": 51.3762,
    "createdAt": "2026-10-25T07:09:23.389Z"
  },
  {
    "id": 4,
    "userId": 28,
    "title": "محل کار",
    "details": "تهران، ونک، خیابان ملاصدرا، برج نگار، طبقه‌ی ۶",
    "lat": 35.7579,
    "lng": 51.4096,
    "createdAt": "2026-10-25T07:09:23.389Z"
  }
]
```

## Catalog (public)

`GET /cuisines` — `icon` is one of `iranian, burger, pizza, coffee, cake, salad, breakfast, fish`.
```json
[
  {
    "id": 9,
    "name": "ایرانی",
    "slug": "iranian",
    "icon": "iranian",
    "sortOrder": 0
  },
  {
    "id": 10,
    "name": "فست‌فود",
    "slug": "fastfood",
    "icon": "burger",
    "sortOrder": 1
  }
]
```

`GET /restaurants?search=&cuisine=<slug>&sort=recommended|rating|delivery_time|delivery_fee&openNow=true&hasDiscount=true&page=&limit=`
— `maxDiscountPercent` is the biggest dish discount (show a badge when > 0). `isOpen: false` restaurants still appear (show them as closed) unless `openNow=true`.
```json
{
  "items": [
    {
      "id": 9,
      "name": "کبابسرای آتشکده",
      "slug": "atashkadeh",
      "logo": null,
      "cover": "/uploads/seed-kebab-grill.webp",
      "rating": 4.5,
      "ratingCount": 2,
      "deliveryFee": 25000,
      "minOrder": 200000,
      "deliveryTimeMin": 35,
      "deliveryTimeMax": 50,
      "isOpen": true,
      "cuisines": [
        {
          "id": 9,
          "name": "ایرانی",
          "slug": "iranian"
        }
      ],
      "maxDiscountPercent": 10
    },
    {
      "id": 11,
      "name": "برگر دودی",
      "slug": "dudi-burger",
      "logo": null,
      "cover": "/uploads/seed-burger-cover.webp",
      "rating": 4.5,
      "ratingCount": 6,
      "deliveryFee": 20000,
      "minOrder": 150000,
      "deliveryTimeMin": 25,
      "deliveryTimeMax": 40,
      "isOpen": true,
      "cuisines": [
        {
          "id": 10,
          "name": "فست‌فود",
          "slug": "fastfood"
        }
      ],
      "maxDiscountPercent": 10
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 2
}
```

`GET /restaurants/:slug` — full menu grouped in `sections` (only the first section shown here). The price a customer pays for a dish is
`round(price × (100 − discountPercent) / 100)`. Dishes with `isAvailable: false` are shown but can't be added.
```json
{
  "id": 10,
  "name": "پیتزا ناپل‌نو",
  "slug": "napoli-no",
  "description": "پیتزای ناپلی با خمیر ۴۸ساعته و تنور هیزمی.",
  "logo": null,
  "cover": "/uploads/seed-pizza-cover.webp",
  "address": "تهران، سعادت‌آباد، میدان کاج",
  "rating": 4.4,
  "ratingCount": 5,
  "deliveryFee": 30000,
  "minOrder": 250000,
  "deliveryTimeMin": 30,
  "deliveryTimeMax": 45,
  "isOpen": true,
  "isActive": true,
  "createdAt": "2026-10-25T07:09:23.289Z",
  "updatedAt": "2026-10-25T07:09:23.874Z",
  "cuisines": [
    {
      "id": 10,
      "name": "فست‌فود",
      "slug": "fastfood"
    },
    {
      "id": 11,
      "name": "پیتزا",
      "slug": "pizza"
    }
  ],
  "sections": [
    {
      "id": 23,
      "restaurantId": 10,
      "name": "پیتزاها",
      "sortOrder": 0,
      "items": [
        {
          "id": 58,
          "restaurantId": 10,
          "sectionId": 23,
          "name": "پیتزا مارگاریتا",
          "description": "سس گوجه‌ی دست‌ساز، موتزارلا، ریحان تازه",
          "price": 340000,
          "discountPercent": 0,
          "image": "/uploads/seed-pizza-margherita.webp",
          "isAvailable": true,
          "sortOrder": 0,
          "createdAt": "2026-10-25T07:09:23.294Z",
          "updatedAt": "2026-10-25T07:09:23.294Z"
        },
        {
          "id": 59,
          "restaurantId": 10,
          "sectionId": 23,
          "name": "پیتزا پپرونی",
          "description": "پپرونی تند، موتزارلا، سس گوجه",
          "price": 395000,
          "discountPercent": 15,
          "image": "/uploads/seed-pizza-pepperoni.webp",
          "isAvailable": true,
          "sortOrder": 1,
          "createdAt": "2026-10-25T07:09:23.296Z",
          "updatedAt": "2026-10-25T07:09:23.296Z"
        }
      ]
    }
  ]
}
```

`GET /restaurants/:id/reviews?page=&limit=`
```json
{
  "items": [
    {
      "id": 81,
      "rating": 4,
      "comment": "بسته‌بندی تمیز و حجم مناسب.",
      "createdAt": "2026-10-25T04:37:23.826Z",
      "user": {
        "name": "زهرا رحیمی"
      }
    },
    {
      "id": 83,
      "rating": 5,
      "comment": "خیلی خوشمزه بود و داغ رسید.",
      "createdAt": "2026-10-22T07:18:23.836Z",
      "user": {
        "name": "یاسمن اکبری"
      }
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 2
}
```

## Checkout & orders (customer)

`POST /discounts/validate` `{ "code", "amount" }` — `amount` = food total after dish discounts, before delivery.
```json
{
  "code": "WELCOME",
  "description": "۲۰٪ تخفیف تا سقف ۶۰ هزار تومان",
  "discount": 60000
}
```

`POST /orders` — the server recalculates every price; send `addressId` (saved address) **or** `addressText`.
```json
{ "restaurantId": 2, "items": [{ "menuItemId": 10, "quantity": 2 }], "addressId": 1, "paymentMethod": "ONLINE", "discountCode": "WELCOME", "note": "..." }
```
Response (order detail; the same shape is returned by `GET /orders/:id`, `/pay`, `/cancel` and admin status changes):
```json
{
  "id": 171,
  "code": "SF-727399",
  "userId": 28,
  "restaurantId": 10,
  "status": "PENDING",
  "paymentMethod": "ONLINE",
  "isPaid": false,
  "paymentRef": null,
  "subtotal": 790000,
  "itemsDiscount": 118500,
  "codeDiscount": 60000,
  "deliveryFee": 30000,
  "total": 641500,
  "discountCodeId": 4,
  "addressText": "خانه — تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۱۲، واحد ۴",
  "note": null,
  "createdAt": "2026-10-25T07:09:24.224Z",
  "updatedAt": "2026-10-25T07:09:24.224Z",
  "items": [
    {
      "id": 288,
      "orderId": 171,
      "menuItemId": 59,
      "name": "پیتزا پپرونی",
      "unitPrice": 335750,
      "quantity": 2
    }
  ],
  "statusLogs": [
    {
      "id": 757,
      "orderId": 171,
      "status": "PENDING",
      "createdAt": "2026-10-25T07:09:24.224Z"
    }
  ],
  "restaurant": {
    "id": 10,
    "name": "پیتزا ناپل‌نو",
    "slug": "napoli-no",
    "logo": null,
    "address": "تهران، سعادت‌آباد، میدان کاج"
  },
  "user": {
    "id": 28,
    "phone": "09121111111",
    "name": "سارا محمدی"
  },
  "review": null
}
```

`POST /orders/:id/pay` — **simulated** online payment gateway for `ONLINE` orders (sets `isPaid`, `paymentRef`). Call it right after creating an online order.
```json
{
  "id": 171,
  "code": "SF-727399",
  "status": "PENDING",
  "isPaid": true,
  "paymentRef": "DEMO-637D4236"
}
```

`POST /orders/:id/cancel` — only while `PENDING`. `POST /orders/:id/review` `{ rating: 1-5, comment? }` — only once, after `DELIVERED`.

`GET /orders?page=&limit=` — my orders, newest first:
```json
{
  "items": [
    {
      "id": 171,
      "code": "SF-727399",
      "userId": 28,
      "restaurantId": 10,
      "status": "PENDING",
      "paymentMethod": "ONLINE",
      "isPaid": true,
      "paymentRef": "DEMO-637D4236",
      "subtotal": 790000,
      "itemsDiscount": 118500,
      "codeDiscount": 60000,
      "deliveryFee": 30000,
      "total": 641500,
      "discountCodeId": 4,
      "addressText": "خانه — تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۱۲، واحد ۴",
      "note": null,
      "createdAt": "2026-10-25T07:09:24.224Z",
      "updatedAt": "2026-10-25T07:09:24.237Z",
      "restaurant": {
        "id": 10,
        "name": "پیتزا ناپل‌نو",
        "slug": "napoli-no",
        "logo": null
      },
      "items": [
        {
          "name": "پیتزا پپرونی",
          "quantity": 2
        }
      ],
      "review": null
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 1
}
```

**Status flow:** `PENDING → CONFIRMED → PREPARING → DELIVERING → DELIVERED`; `PENDING` or `CONFIRMED` can also go to `CANCELLED`.
Persian labels: PENDING «در انتظار تأیید رستوران», CONFIRMED «تأیید شد», PREPARING «در حال آماده‌سازی», DELIVERING «پیک در راه است», DELIVERED «تحویل داده شد», CANCELLED «لغو شد».

## Real-time updates (Socket.IO)

Connect to namespace **`/realtime`** on the API origin (default path `/socket.io`) with `{ auth: { token: <accessToken> } }`.
Customers join their own room; admins also get every order.

| Event | Who receives it | Payload |
|---|---|---|
| `order.created` | admins | `{ id, code, status, total, restaurantId, createdAt }` |
| `order.updated` | the order's customer + admins | `{ id, code, status, isPaid, updatedAt }` |

## Admin (role ADMIN)

`GET /admin/stats?days=7` — dashboard (`series` has one entry per day, Tehran calendar, oldest first; `statusCounts` keys are statuses):
```json
{
  "today": {
    "orders": 23,
    "revenue": 20862500
  },
  "totals": {
    "customers": 25,
    "restaurants": 8,
    "orders": 85,
    "revenue": 55696250
  },
  "series": [
    {
      "date": "2026-10-19",
      "orders": 10,
      "revenue": 7579500
    },
    {
      "date": "2026-10-20",
      "orders": 12,
      "revenue": 6233000
    }
  ],
  "statusCounts": {
    "PREPARING": 2,
    "DELIVERING": 2,
    "PENDING": 4,
    "CANCELLED": 6,
    "CONFIRMED": 3,
    "DELIVERED": 68
  },
  "topRestaurants": [
    {
      "id": 11,
      "name": "برگر دودی",
      "orders": 11,
      "revenue": 10328000
    },
    {
      "id": 16,
      "name": "دریایی بندر",
      "orders": 8,
      "revenue": 8832000
    }
  ]
}
```

`GET /admin/orders?status=&search=<code or phone>&page=&limit=` · `PATCH /admin/orders/:id/status` `{ "status" }` (must follow the flow above)
```json
{
  "items": [
    {
      "id": 171,
      "code": "SF-727399",
      "userId": 28,
      "restaurantId": 10,
      "status": "PENDING",
      "paymentMethod": "ONLINE",
      "isPaid": true,
      "paymentRef": "DEMO-637D4236",
      "subtotal": 790000,
      "itemsDiscount": 118500,
      "codeDiscount": 60000,
      "deliveryFee": 30000,
      "total": 641500,
      "discountCodeId": 4,
      "addressText": "خانه — تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۱۲، واحد ۴",
      "note": null,
      "createdAt": "2026-10-25T07:09:24.224Z",
      "updatedAt": "2026-10-25T07:09:24.237Z",
      "restaurant": {
        "id": 10,
        "name": "پیتزا ناپل‌نو"
      },
      "user": {
        "id": 28,
        "phone": "09121111111",
        "name": "سارا محمدی"
      },
      "items": [
        {
          "name": "پیتزا پپرونی",
          "quantity": 2
        }
      ]
    }
  ],
  "total": 85,
  "page": 1,
  "limit": 1
}
```

`GET /admin/restaurants?search=&page=&limit=` · `GET /admin/restaurants/:id` (with `sections[].items[]`, including inactive data) ·
`POST /admin/restaurants` · `PATCH /admin/restaurants/:id` · `DELETE /admin/restaurants/:id` (409 if it has orders → deactivate instead).
Body: `{ name, slug, description?, logo?, cover?, address, deliveryFee, minOrder, deliveryTimeMin, deliveryTimeMax, isOpen?, isActive?, cuisineIds?: number[] }`.
```json
{
  "items": [
    {
      "id": 16,
      "name": "دریایی بندر",
      "slug": "bandar-seafood",
      "description": "غذاهای دریایی به سبک جنوب؛ میگو و ماهی تازه‌ی خلیج فارس.",
      "logo": null,
      "cover": "/uploads/seed-seafood-cover.webp",
      "address": "تهران، شهرک غرب، بلوار فرحزادی",
      "rating": 4.2,
      "ratingCount": 5,
      "deliveryFee": 35000,
      "minOrder": 300000,
      "deliveryTimeMin": 40,
      "deliveryTimeMax": 60,
      "isOpen": true,
      "isActive": true,
      "createdAt": "2026-10-25T07:09:23.377Z",
      "updatedAt": "2026-10-25T07:09:23.880Z",
      "cuisines": [
        {
          "id": 9,
          "name": "ایرانی"
        },
        {
          "id": 16,
          "name": "دریایی"
        }
      ],
      "_count": {
        "items": 5,
        "orders": 10
      }
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 1
}
```

Menu: `POST /admin/restaurants/:id/sections` `{ name, sortOrder? }` · `PATCH|DELETE /admin/sections/:id` ·
`POST /admin/menu-items` `{ sectionId, name, description?, price, discountPercent?, image?, isAvailable?, sortOrder? }` · `PATCH|DELETE /admin/menu-items/:id`.

Discount codes: `GET /admin/discounts` · `POST /admin/discounts` `{ code, description?, type: PERCENT|FIXED, value, maxDiscount?, minOrder?, usageLimit?, expiresAt?, isActive? }` · `PATCH|DELETE /admin/discounts/:id`
```json
[
  {
    "id": 5,
    "code": "SOFREH50",
    "description": "۵۰ هزار تومان تخفیف برای سفارش‌های بالای ۴۰۰ هزار تومان",
    "type": "FIXED",
    "value": 50000,
    "maxDiscount": null,
    "minOrder": 400000,
    "usageLimit": 500,
    "usedCount": 0,
    "expiresAt": null,
    "isActive": true,
    "createdAt": "2026-10-25T07:09:23.406Z"
  },
  {
    "id": 6,
    "code": "YALDA",
    "description": "کد مناسبتی منقضی‌شده",
    "type": "PERCENT",
    "value": 30,
    "maxDiscount": 100000,
    "minOrder": 0,
    "usageLimit": null,
    "usedCount": 0,
    "expiresAt": "2025-12-21T20:30:00.000Z",
    "isActive": true,
    "createdAt": "2026-10-25T07:09:23.406Z"
  }
]
```

Users: `GET /admin/users?search=<phone or name>&page=&limit=` · `PATCH /admin/users/:id` `{ role?, isActive? }`
```json
{
  "items": [
    {
      "id": 28,
      "phone": "09121111111",
      "name": "سارا محمدی",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-10-25T07:09:23.389Z",
      "_count": {
        "orders": 8
      }
    },
    {
      "id": 27,
      "phone": "09120000000",
      "name": "مدیر سامانه",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-10-25T07:09:23.387Z",
      "_count": {
        "orders": 0
      }
    }
  ],
  "total": 26,
  "page": 1,
  "limit": 2
}
```

Uploads: `POST /admin/uploads` (multipart, field **`file`**, max 8 MB) → `{ "url": "/uploads/1761….webp" }` — use the URL for `logo`, `cover` or `image`.

## Health

`GET /health` → `{ "status": "ok", "db": "up", "redis": "up" }` (503 when a dependency is down).
