"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/endpoints";
import type { RestaurantInput } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { errorMessage } from "@/lib/api/client";
import { BackLink } from "@/components/ui/back-link";
import { buttonClass } from "@/components/ui/button";
import { EMPTY_RESTAURANT, RestaurantForm } from "./restaurant-form";

export function RestaurantNewView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function create(input: RestaurantInput) {
    try {
      const restaurant = await adminApi.createRestaurant(input);
      toast.success(`«${restaurant.name}» ساخته شد؛ حالا منوی آن را بسازید.`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.restaurantsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statsAll });
      router.push(`/restaurants/${restaurant.id}/menu`);
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/restaurants" label="رستوران‌ها" />}
        title="رستوران جدید"
        description="اطلاعات رستوران را وارد کنید؛ بعد از ذخیره به صفحه‌ی منو می‌روید."
      />
      <RestaurantForm
        initial={EMPTY_RESTAURANT}
        submitLabel="ایجاد رستوران"
        onSubmit={create}
        resetOnSuccess
        extraActions={
          <Link href="/restaurants" className={buttonClass("ghost")}>
            انصراف
          </Link>
        }
      />
    </>
  );
}
