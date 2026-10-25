"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Bike, Clock3, Pencil, Plus, SearchX, Star, Store, Trash2, UtensilsCrossed } from "lucide-react";
import { adminApi } from "@/lib/api/endpoints";
import type { AdminRestaurant } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { faNumber, toman } from "@/lib/format";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { queryKeys } from "@/lib/query-keys";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Thumb } from "@/components/ui/thumb";
import { RestaurantBadges } from "./restaurant-badges";
import { useDeleteRestaurant } from "./use-delete-restaurant";

const PAGE_SIZE = 12;

export function RestaurantsView() {
  const [params, setParams] = useUrlState();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const pushSearch = useDebouncedCallback((value: string) => setParams({ q: value.trim(), page: null }), 400);

  const query = { search: search || undefined, page, limit: PAGE_SIZE };
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuery({
    queryKey: queryKeys.restaurantList(query),
    queryFn: () => adminApi.restaurants(query),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="رستوران‌ها"
        description={data ? `${faNumber(data.total)} رستوران در سفره` : "مدیریت رستوران‌ها و منوی آن‌ها"}
        actions={
          <Link href="/restaurants/new" className={buttonClass()}>
            <Plus />
            رستوران جدید
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            pushSearch(value);
          }}
          placeholder="جستجوی نام رستوران"
          className="w-full sm:w-80"
        />
      </div>

      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <QueryError error={error} onRetry={() => void refetch()} />
        </Card>
      ) : data.items.length === 0 ? (
        <Card>
          {search ? (
            <EmptyState icon={<SearchX />} title="رستورانی پیدا نشد" description={`نتیجه‌ای برای «${search}» نبود.`} />
          ) : (
            <EmptyState
              icon={<Store />}
              title="هنوز رستورانی ثبت نشده"
              description="اولین رستوران را اضافه کنید و منوی آن را بسازید."
              action={
                <Link href="/restaurants/new" className={buttonClass()}>
                  <Plus />
                  رستوران جدید
                </Link>
              }
            />
          )}
        </Card>
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
          <Pagination
            className="mt-4 px-0"
            page={data.page}
            limit={data.limit}
            total={data.total}
            onPageChange={(next) => setParams({ page: next === 1 ? null : next })}
          />
        </div>
      )}
    </>
  );
}

function RestaurantCard({ restaurant: r }: { restaurant: AdminRestaurant }) {
  const remove = useDeleteRestaurant();
  return (
    <Card className={cn("group flex flex-col overflow-hidden transition hover:shadow-pop", !r.isActive && "opacity-80")}>
      <div className="relative">
        <Thumb src={r.cover} alt={r.name} className="aspect-[16/8] rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/45 via-transparent to-transparent" aria-hidden />
        <div className="absolute top-3 right-3 flex gap-1.5">
          <RestaurantBadges isOpen={r.isOpen} isActive={r.isActive} />
        </div>
        <Thumb
          src={r.logo}
          alt={`لوگوی ${r.name}`}
          className="absolute right-4 -bottom-6 size-14 rounded-2xl bg-white shadow-card ring-4 ring-white"
          fallback={<span className="text-lg font-black text-brand-600">{r.name.charAt(0)}</span>}
        />
      </div>

      <div className="flex flex-1 flex-col px-4 pt-8 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-stone-900">{r.name}</h3>
            <p className="mt-0.5 truncate text-xs text-stone-500">{r.cuisines.map((c) => c.name).join("، ") || "بدون دسته‌بندی"}</p>
          </div>
          <span className="tabular flex shrink-0 items-center gap-1 rounded-lg bg-saffron-50 px-2 py-1 text-xs font-bold text-saffron-800">
            <Star className="size-3.5 fill-saffron-400 text-saffron-400" />
            {r.rating ? faNumber(r.rating) : "—"}
            <span className="font-normal text-saffron-700/70">({faNumber(r.ratingCount)})</span>
          </span>
        </div>

        <dl className="tabular mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-stone-50 px-2 py-2">
            <dt className="flex items-center justify-center gap-1 text-stone-400">
              <Clock3 className="size-3.5" />
              ارسال
            </dt>
            <dd className="mt-0.5 font-semibold text-stone-700">
              {faNumber(r.deliveryTimeMin)}–{faNumber(r.deliveryTimeMax)} دقیقه
            </dd>
          </div>
          <div className="rounded-xl bg-stone-50 px-2 py-2">
            <dt className="flex items-center justify-center gap-1 text-stone-400">
              <Bike className="size-3.5" />
              پیک
            </dt>
            <dd className="mt-0.5 font-semibold text-stone-700">{r.deliveryFee ? toman(r.deliveryFee) : "رایگان"}</dd>
          </div>
          <div className="rounded-xl bg-stone-50 px-2 py-2">
            <dt className="flex items-center justify-center gap-1 text-stone-400">
              <UtensilsCrossed className="size-3.5" />
              منو
            </dt>
            <dd className="mt-0.5 font-semibold text-stone-700">
              {faNumber(r._count.items)} غذا · {faNumber(r._count.orders)} سفارش
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center gap-2 border-t border-stone-100 p-3">
        <Link href={`/restaurants/${r.id}/menu`} className={buttonClass("soft", "sm", "flex-1")}>
          <UtensilsCrossed />
          مدیریت منو
        </Link>
        <Link href={`/restaurants/${r.id}`} className={buttonClass("secondary", "sm", "flex-1")}>
          <Pencil />
          ویرایش
        </Link>
        <button
          type="button"
          onClick={() => void remove.request(r)}
          disabled={remove.isPending}
          className={buttonClass("ghost", "icon-sm", "text-stone-400 hover:bg-red-50 hover:text-red-600")}
          aria-label={`حذف ${r.name}`}
          title="حذف"
        >
          <Trash2 />
        </button>
      </div>
    </Card>
  );
}
