"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/client";
import { adminApi } from "@/lib/api/endpoints";
import type { RestaurantInput } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";
import { BackLink } from "@/components/ui/back-link";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { RestaurantBadges } from "./restaurant-badges";
import { RestaurantForm, restaurantToForm } from "./restaurant-form";
import { useDeleteRestaurant } from "./use-delete-restaurant";

export function RestaurantEditView() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const remove = useDeleteRestaurant(() => router.push("/restaurants"));

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.restaurant(restaurantId),
    queryFn: () => adminApi.restaurant(restaurantId),
    enabled: Number.isInteger(restaurantId),
  });

  async function save(input: RestaurantInput) {
    try {
      await adminApi.updateRestaurant(restaurantId, input);
      toast.success("تغییرات رستوران ذخیره شد.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.restaurantsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statsAll });
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    }
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-[480px] rounded-2xl xl:col-span-2" />
          <Skeleton className="h-[480px] rounded-2xl" />
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <Card>
        <QueryError error={error} onRetry={() => void refetch()} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/restaurants" label="رستوران‌ها" />}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {data.name}
            <span className="flex gap-1.5 text-base font-normal">
              <RestaurantBadges isOpen={data.isOpen} isActive={data.isActive} />
            </span>
          </span>
        }
        description="ویرایش اطلاعات، تصاویر و وضعیت رستوران"
        actions={
          <Link href={`/restaurants/${data.id}/menu`} className={buttonClass("secondary")}>
            <UtensilsCrossed />
            مدیریت منو
          </Link>
        }
      />
      {/* Remount with fresh values after every save (updatedAt changes). */}
      <RestaurantForm
        key={data.updatedAt}
        initial={restaurantToForm(data)}
        submitLabel="ذخیره‌ی تغییرات"
        onSubmit={save}
        extraActions={
          <Button
            variant="ghost"
            loading={remove.isPending}
            onClick={() => void remove.request(data)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 />
            حذف رستوران
          </Button>
        }
      />
    </>
  );
}
