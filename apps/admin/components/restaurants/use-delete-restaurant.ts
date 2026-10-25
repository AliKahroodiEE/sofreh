import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api/client";
import { adminApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import { useConfirm } from "@/components/ui/confirm";

/**
 * Delete a restaurant after confirmation. The API refuses (409) when the
 * restaurant has orders; then we show its message and offer to deactivate.
 */
export function useDeleteRestaurant(onDeleted?: () => void) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const deactivate = useMutation({
    mutationFn: (id: number) => adminApi.updateRestaurant(id, { isActive: false }),
    onSuccess: () => {
      toast.success("رستوران غیرفعال شد و دیگر در اپ مشتری نمایش داده نمی‌شود.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.restaurantsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statsAll });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deleteRestaurant(id),
    meta: { silent: true },
    onSuccess: () => {
      toast.success("رستوران حذف شد.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.restaurantsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statsAll });
      onDeleted?.();
    },
    onError: async (error, id) => {
      if (error instanceof ApiError && error.status === 409) {
        const ok = await confirm({
          title: "حذف این رستوران ممکن نیست",
          description: error.message,
          confirmLabel: "غیرفعال کردن رستوران",
          cancelLabel: "بستن",
          destructive: false,
        });
        if (ok) deactivate.mutate(id);
      } else {
        toast.error(errorMessage(error));
      }
    },
  });

  async function request(restaurant: { id: number; name: string }) {
    const ok = await confirm({
      title: `حذف «${restaurant.name}»؟`,
      description: "رستوران همراه با همه‌ی بخش‌ها و غذاهای منو برای همیشه حذف می‌شود. این کار قابل بازگشت نیست.",
      confirmLabel: "حذف رستوران",
    });
    if (ok) remove.mutate(restaurant.id);
  }

  return { request, isPending: remove.isPending || deactivate.isPending };
}
