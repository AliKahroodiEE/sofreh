import { request } from "./client";
import type {
  AdminOrder,
  AdminOrdersQuery,
  AdminRestaurant,
  AdminRestaurantDetail,
  AdminStats,
  AdminUser,
  AuthUser,
  Cuisine,
  DiscountCode,
  DiscountInput,
  MenuItem,
  MenuItemInput,
  MenuSection,
  OrderDetail,
  OrderStatus,
  OtpRequestResponse,
  OtpVerifyResponse,
  Paginated,
  Restaurant,
  RestaurantInput,
  Role,
  SearchQuery,
  SectionInput,
} from "./types";

/** One function per API endpoint used by the admin panel. */

export const authApi = {
  requestOtp: (phone: string) =>
    request<OtpRequestResponse>("/auth/otp/request", { method: "POST", body: { phone }, auth: false }),
  verifyOtp: (phone: string, code: string) =>
    request<OtpVerifyResponse>("/auth/otp/verify", { method: "POST", body: { phone, code }, auth: false }),
  logout: (refreshToken: string) =>
    request<{ ok: true }>("/auth/logout", { method: "POST", body: { refreshToken }, auth: false }),
  me: () => request<AuthUser>("/auth/me"),
};

export const catalogApi = {
  cuisines: () => request<Cuisine[]>("/cuisines", { auth: false }),
};

type Ok = { ok: true };

export const adminApi = {
  stats: (days = 7) => request<AdminStats>("/admin/stats", { query: { days } }),

  // orders
  orders: (query: AdminOrdersQuery) => request<Paginated<AdminOrder>>("/admin/orders", { query }),
  order: (id: number) => request<OrderDetail>(`/orders/${id}`),
  setOrderStatus: (id: number, status: OrderStatus) =>
    request<OrderDetail>(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } }),

  // restaurants
  restaurants: (query: SearchQuery) => request<Paginated<AdminRestaurant>>("/admin/restaurants", { query }),
  restaurant: (id: number) => request<AdminRestaurantDetail>(`/admin/restaurants/${id}`),
  createRestaurant: (input: RestaurantInput) =>
    request<Restaurant>("/admin/restaurants", { method: "POST", body: input }),
  updateRestaurant: (id: number, input: Partial<RestaurantInput>) =>
    request<Restaurant>(`/admin/restaurants/${id}`, { method: "PATCH", body: input }),
  deleteRestaurant: (id: number) => request<Ok>(`/admin/restaurants/${id}`, { method: "DELETE" }),

  // menu
  createSection: (restaurantId: number, input: SectionInput) =>
    request<MenuSection>(`/admin/restaurants/${restaurantId}/sections`, { method: "POST", body: input }),
  updateSection: (id: number, input: SectionInput) =>
    request<MenuSection>(`/admin/sections/${id}`, { method: "PATCH", body: input }),
  deleteSection: (id: number) => request<Ok>(`/admin/sections/${id}`, { method: "DELETE" }),
  createMenuItem: (input: MenuItemInput) => request<MenuItem>("/admin/menu-items", { method: "POST", body: input }),
  updateMenuItem: (id: number, input: Partial<MenuItemInput>) =>
    request<MenuItem>(`/admin/menu-items/${id}`, { method: "PATCH", body: input }),
  deleteMenuItem: (id: number) => request<Ok>(`/admin/menu-items/${id}`, { method: "DELETE" }),

  // discount codes
  discounts: () => request<DiscountCode[]>("/admin/discounts"),
  createDiscount: (input: DiscountInput) => request<DiscountCode>("/admin/discounts", { method: "POST", body: input }),
  updateDiscount: (id: number, input: Partial<DiscountInput>) =>
    request<DiscountCode>(`/admin/discounts/${id}`, { method: "PATCH", body: input }),
  deleteDiscount: (id: number) => request<Ok>(`/admin/discounts/${id}`, { method: "DELETE" }),

  // users
  users: (query: SearchQuery) => request<Paginated<AdminUser>>("/admin/users", { query }),
  updateUser: (id: number, input: { role?: Role; isActive?: boolean }) =>
    request<Omit<AdminUser, "createdAt" | "_count">>(`/admin/users/${id}`, { method: "PATCH", body: input }),

  /** Upload an image (resized to WebP by the API); returns its relative URL. */
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>("/admin/uploads", { method: "POST", body: form });
  },
};
