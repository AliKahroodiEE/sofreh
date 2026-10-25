"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Pencil, Plus, Settings2, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/endpoints";
import type { AdminRestaurantDetail, MenuItem, MenuItemInput, MenuSection } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { faNumber, toman } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Thumb } from "@/components/ui/thumb";
import { RestaurantBadges } from "@/components/restaurants/restaurant-badges";
import { DishDialog, finalPrice } from "./dish-dialog";
import { SectionDialog } from "./section-dialog";

type SectionDialogState = { section?: MenuSection } | null;
type DishDialogState = { sectionId: number; dish?: MenuItem } | null;

const nextSortOrder = (rows: { sortOrder: number }[]) => rows.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

/** Menu editor: sections (add / rename / delete) and their dishes. */
export function MenuView() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const key = queryKeys.restaurant(restaurantId);

  const [sectionDialog, setSectionDialog] = useState<SectionDialogState>(null);
  const [dishDialog, setDishDialog] = useState<DishDialogState>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => adminApi.restaurant(restaurantId),
    enabled: Number.isInteger(restaurantId),
  });

  /** Refresh this menu and the restaurant list (dish counts). */
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: queryKeys.restaurantLists });
  };

  const saveSection = useMutation({
    mutationFn: ({ section, name }: { section?: MenuSection; name: string }) =>
      section
        ? adminApi.updateSection(section.id, { name })
        : adminApi.createSection(restaurantId, { name, sortOrder: nextSortOrder(data?.sections ?? []) }),
    onSuccess: (_, { section }) => {
      toast.success(section ? "نام بخش به‌روز شد." : "بخش جدید اضافه شد.");
      refresh();
    },
  });

  const deleteSection = useMutation({
    mutationFn: (section: MenuSection) => adminApi.deleteSection(section.id),
    onSuccess: () => {
      toast.success("بخش حذف شد.");
      refresh();
    },
  });

  const saveDish = useMutation({
    mutationFn: ({ dish, input }: { dish?: MenuItem; input: MenuItemInput }) => {
      if (dish) return adminApi.updateMenuItem(dish.id, input);
      const section = data?.sections.find((s) => s.id === input.sectionId);
      return adminApi.createMenuItem({ ...input, sortOrder: nextSortOrder(section?.items ?? []) });
    },
    onSuccess: (_, { dish }) => {
      toast.success(dish ? "غذا به‌روز شد." : "غذا به منو اضافه شد.");
      refresh();
    },
  });

  const deleteDish = useMutation({
    mutationFn: (dish: MenuItem) => adminApi.deleteMenuItem(dish.id),
    onSuccess: () => {
      toast.success("غذا از منو حذف شد.");
      refresh();
    },
  });

  // Availability toggles update the cache immediately and roll back on error.
  const toggleAvailability = useMutation({
    mutationFn: ({ dish, isAvailable }: { dish: MenuItem; isAvailable: boolean }) =>
      adminApi.updateMenuItem(dish.id, { isAvailable }),
    onMutate: async ({ dish, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<AdminRestaurantDetail>(key);
      queryClient.setQueryData<AdminRestaurantDetail>(key, (current) =>
        current && {
          ...current,
          sections: current.sections.map((s) => ({
            ...s,
            items: s.items.map((item) => (item.id === dish.id ? { ...item, isAvailable } : item)),
          })),
        },
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (_, { dish, isAvailable }) => toast.success(`«${dish.name}» ${isAvailable ? "موجود" : "ناموجود"} شد.`),
    onSettled: refresh,
  });

  async function askDeleteSection(section: MenuSection) {
    const ok = await confirm({
      title: `حذف بخش «${section.name}»؟`,
      description:
        section.items.length > 0
          ? `${faNumber(section.items.length)} غذای این بخش هم حذف می‌شوند. سفارش‌های قبلی دست‌نخورده می‌مانند.`
          : "این بخش خالی است.",
      confirmLabel: "حذف بخش",
    });
    if (ok) deleteSection.mutate(section);
  }

  async function askDeleteDish(dish: MenuItem) {
    const ok = await confirm({
      title: `حذف «${dish.name}»؟`,
      description: "غذا از منو حذف می‌شود. سفارش‌های قبلی دست‌نخورده می‌مانند.",
      confirmLabel: "حذف غذا",
    });
    if (ok) deleteDish.mutate(dish);
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
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

  const dishCount = data.sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/restaurants" label="رستوران‌ها" />}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Thumb
              src={data.logo ?? data.cover}
              alt={data.name}
              className="size-11 rounded-xl"
              fallback={<span className="font-black text-brand-600">{data.name.charAt(0)}</span>}
            />
            منوی {data.name}
            <span className="flex gap-1.5 text-base font-normal">
              <RestaurantBadges isOpen={data.isOpen} isActive={data.isActive} />
            </span>
          </span>
        }
        description={`${faNumber(data.sections.length)} بخش · ${faNumber(dishCount)} غذا`}
        actions={
          <>
            <Link href={`/restaurants/${data.id}`} className={buttonClass("secondary")}>
              <Settings2 />
              اطلاعات رستوران
            </Link>
            <Button onClick={() => setSectionDialog({})}>
              <FolderPlus />
              بخش جدید
            </Button>
          </>
        }
      />

      {data.sections.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UtensilsCrossed />}
            title="منو هنوز خالی است"
            description="ابتدا یک بخش (مثل «پیتزاها» یا «نوشیدنی‌ها») بسازید و بعد غذاها را به آن اضافه کنید."
            action={
              <Button onClick={() => setSectionDialog({})}>
                <FolderPlus />
                ساخت اولین بخش
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {data.sections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/50 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-bold text-stone-900">{section.name}</h2>
                  <Badge>{faNumber(section.items.length)} غذا</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="soft" onClick={() => setDishDialog({ sectionId: section.id })}>
                    <Plus />
                    افزودن غذا
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setSectionDialog({ section })} aria-label={`ویرایش نام ${section.name}`} title="ویرایش نام">
                    <Pencil />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => void askDeleteSection(section)}
                    className="hover:bg-red-50 hover:text-red-600"
                    aria-label={`حذف ${section.name}`}
                    title="حذف بخش"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              {section.items.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-stone-400">
                  این بخش هنوز غذایی ندارد.{" "}
                  <button
                    type="button"
                    className="cursor-pointer font-medium text-brand-700 hover:underline"
                    onClick={() => setDishDialog({ sectionId: section.id })}
                  >
                    افزودن غذا
                  </button>
                </p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {section.items.map((dish) => (
                    <DishRow
                      key={dish.id}
                      dish={dish}
                      onEdit={() => setDishDialog({ sectionId: section.id, dish })}
                      onDelete={() => void askDeleteDish(dish)}
                      onToggle={(isAvailable) => toggleAvailability.mutate({ dish, isAvailable })}
                    />
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      <SectionDialog
        open={sectionDialog !== null}
        onClose={() => setSectionDialog(null)}
        initialName={sectionDialog?.section?.name}
        onSubmit={(name) => saveSection.mutateAsync({ section: sectionDialog?.section, name })}
      />
      <DishDialog
        open={dishDialog !== null}
        onClose={() => setDishDialog(null)}
        sections={data.sections}
        sectionId={dishDialog?.sectionId ?? data.sections[0]?.id ?? 0}
        dish={dishDialog?.dish}
        onSubmit={(input) => saveDish.mutateAsync({ dish: dishDialog?.dish, input })}
      />
    </>
  );
}

interface DishRowProps {
  dish: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (isAvailable: boolean) => void;
}

function DishRow({ dish, onEdit, onDelete, onToggle }: DishRowProps) {
  const price = finalPrice(dish.price, dish.discountPercent);
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-3.5 sm:flex-nowrap">
      <Thumb src={dish.image} alt={dish.name} className={cn("size-16 shrink-0", !dish.isAvailable && "opacity-50 grayscale")} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("font-semibold", dish.isAvailable ? "text-stone-800" : "text-stone-400")}>{dish.name}</h3>
          {dish.discountPercent > 0 && <Badge tone="brand">{faNumber(dish.discountPercent)}٪ تخفیف</Badge>}
          {!dish.isAvailable && <Badge>ناموجود</Badge>}
        </div>
        {dish.description && <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-stone-500">{dish.description}</p>}
      </div>
      <div className="tabular min-w-28 text-left">
        {dish.discountPercent > 0 && <div className="text-xs text-stone-400 line-through">{toman(dish.price)}</div>}
        <div className="font-bold text-stone-800">{toman(price)}</div>
      </div>
      <div className="flex items-center gap-1 sm:ms-2">
        <Switch size="sm" checked={dish.isAvailable} onCheckedChange={onToggle} label={`موجود بودن ${dish.name}`} />
        <span className="ms-1.5 me-2 w-12 text-xs text-stone-500">{dish.isAvailable ? "موجود" : "ناموجود"}</span>
        <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={`ویرایش ${dish.name}`} title="ویرایش">
          <Pencil />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onDelete} className="hover:bg-red-50 hover:text-red-600" aria-label={`حذف ${dish.name}`} title="حذف">
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
