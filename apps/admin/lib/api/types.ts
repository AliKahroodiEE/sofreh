/**
 * Types for the Sofreh REST API (see docs/API.md and docs/openapi.json).
 * Money is integer toman; dates are ISO-8601 UTC strings; images are paths
 * relative to the API origin (use `mediaUrl()`).
 */

export type Role = "CUSTOMER" | "ADMIN";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "DELIVERING" | "DELIVERED" | "CANCELLED";

export type PaymentMethod = "ONLINE" | "CASH";

export type DiscountType = "PERCENT" | "FIXED";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Error body returned by the API; `message` is Persian and safe to show. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  errors?: string[];
}

// ------------------------------------------------------------------ auth

export interface AuthUser {
  id: number;
  phone: string;
  name: string | null;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OtpRequestResponse {
  phone: string;
  expiresIn: number;
  /** Only present when the API runs with OTP_DEV_MODE=true. */
  devCode?: string;
}

export interface OtpVerifyResponse extends AuthTokens {
  user: AuthUser;
  isNewUser: boolean;
}

// ------------------------------------------------------------ dashboard

export interface DailyPoint {
  /** Tehran calendar day, `YYYY-MM-DD`. */
  date: string;
  orders: number;
  revenue: number;
}

export interface AdminStats {
  today: { orders: number; revenue: number };
  totals: { customers: number; restaurants: number; orders: number; revenue: number };
  series: DailyPoint[];
  statusCounts: Partial<Record<OrderStatus, number>>;
  topRestaurants: { id: number; name: string; orders: number; revenue: number }[];
}

// --------------------------------------------------------------- catalog

export interface Cuisine {
  id: number;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  sectionId: number;
  name: string;
  description: string | null;
  price: number;
  discountPercent: number;
  image: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuSection {
  id: number;
  restaurantId: number;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  cover: string | null;
  address: string;
  rating: number;
  ratingCount: number;
  deliveryFee: number;
  minOrder: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  isOpen: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  cuisines: { id: number; name: string }[];
}

/** Row of `GET /admin/restaurants`. */
export interface AdminRestaurant extends Restaurant {
  _count: { items: number; orders: number };
}

/** `GET /admin/restaurants/:id` — includes inactive sections and dishes. */
export interface AdminRestaurantDetail extends Restaurant {
  sections: MenuSection[];
}

export interface RestaurantInput {
  name: string;
  slug: string;
  description?: string;
  logo?: string | null;
  cover?: string | null;
  address: string;
  deliveryFee: number;
  minOrder: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  isOpen?: boolean;
  isActive?: boolean;
  cuisineIds?: number[];
}

export interface SectionInput {
  name: string;
  sortOrder?: number;
}

export interface MenuItemInput {
  sectionId: number;
  name: string;
  description?: string | null;
  price: number;
  discountPercent?: number;
  image?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
}

// ---------------------------------------------------------------- orders

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number | null;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderStatusLog {
  id: number;
  orderId: number;
  status: OrderStatus;
  createdAt: string;
}

interface OrderBase {
  id: number;
  code: string;
  userId: number;
  restaurantId: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  paymentRef: string | null;
  subtotal: number;
  itemsDiscount: number;
  codeDiscount: number;
  deliveryFee: number;
  total: number;
  discountCodeId: number | null;
  addressText: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Row of `GET /admin/orders`. */
export interface AdminOrder extends OrderBase {
  restaurant: { id: number; name: string };
  user: { id: number; phone: string; name: string | null };
  items: { name: string; quantity: number }[];
}

/** `GET /orders/:id` (admins may read any order). */
export interface OrderDetail extends OrderBase {
  items: OrderItem[];
  statusLogs: OrderStatusLog[];
  restaurant: { id: number; name: string; slug: string; logo: string | null; address: string };
  user: { id: number; phone: string; name: string | null };
  review: { rating: number; comment: string | null } | null;
}

export interface AdminOrdersQuery {
  status?: OrderStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ------------------------------------------------------------- discounts

export interface DiscountCode {
  id: number;
  code: string;
  description: string | null;
  type: DiscountType;
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DiscountInput {
  code: string;
  description?: string;
  type: DiscountType;
  value: number;
  maxDiscount?: number | null;
  minOrder?: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

// ----------------------------------------------------------------- users

export interface AdminUser {
  id: number;
  phone: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number };
}

export interface SearchQuery {
  search?: string;
  page?: number;
  limit?: number;
}

// -------------------------------------------------------------- realtime

/** Socket.IO `order.created` payload (admins only). */
export interface OrderCreatedEvent {
  id: number;
  code: string;
  status: OrderStatus;
  total: number;
  restaurantId: number;
  createdAt: string;
}

/** Socket.IO `order.updated` payload. */
export interface OrderUpdatedEvent {
  id: number;
  code: string;
  status: OrderStatus;
  isPaid: boolean;
  updatedAt: string;
}
