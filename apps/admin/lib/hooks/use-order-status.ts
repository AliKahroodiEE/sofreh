import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/endpoints";
import type { AdminOrder, OrderStatus, Paginated } from "@/lib/api/types";
import { faDigits } from "@/lib/format";
import { STATUS_META } from "@/lib/orders";
import { queryKeys } from "@/lib/query-keys";

/** PATCH /admin/orders/:id/status and update every cached copy of the order. */
export function useOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to }: { id: number; to: OrderStatus }) => adminApi.setOrderStatus(id, to),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.order(order.id), order);
      queryClient.setQueriesData<Paginated<AdminOrder>>({ queryKey: queryKeys.orderLists }, (page) =>
        page
          ? {
              ...page,
              items: page.items.map((row) =>
                row.id === order.id ? { ...row, status: order.status, isPaid: order.isPaid, updatedAt: order.updatedAt } : row,
              ),
            }
          : page,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.orderLists, refetchType: "none" });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statsAll });
      toast.success(`سفارش ${faDigits(order.code)}: ${STATUS_META[order.status].label}`);
    },
  });
}
