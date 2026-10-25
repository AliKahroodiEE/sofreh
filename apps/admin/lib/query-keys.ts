import type { AdminOrdersQuery, SearchQuery } from "@/lib/api/types";

/**
 * TanStack Query keys in one place, so invalidation after mutations and
 * real-time events stays consistent. Prefixes (e.g. `orders.all`) match
 * every key below them.
 */
export const queryKeys = {
  me: ["me"] as const,
  stats: (days: number) => ["stats", days] as const,
  statsAll: ["stats"] as const,

  ordersAll: ["orders"] as const,
  orderLists: ["orders", "list"] as const,
  orderList: (query: AdminOrdersQuery) => ["orders", "list", query] as const,
  order: (id: number) => ["orders", "detail", id] as const,

  restaurantsAll: ["restaurants"] as const,
  restaurantLists: ["restaurants", "list"] as const,
  restaurantList: (query: SearchQuery) => ["restaurants", "list", query] as const,
  restaurant: (id: number) => ["restaurants", "detail", id] as const,

  cuisines: ["cuisines"] as const,
  discounts: ["discounts"] as const,

  usersAll: ["users"] as const,
  userLists: ["users", "list"] as const,
  userList: (query: SearchQuery) => ["users", "list", query] as const,
};
