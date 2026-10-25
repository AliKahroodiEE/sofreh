"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Copy, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api/client";
import { adminApi } from "@/lib/api/endpoints";
import type { DiscountCode, DiscountInput } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { faNumber, formatDate, toman } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";
import { queryKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { QueryError } from "@/components/ui/query-error";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { DiscountDialog } from "./discount-dialog";
import { describeValue, DISCOUNT_STATE, discountState } from "./discount-utils";

type DialogState = { discount?: DiscountCode } | null;

export function DiscountsView() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const now = useNow(60_000);
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: queryKeys.discounts, queryFn: adminApi.discounts });
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.discounts });

  const save = useMutation({
    mutationFn: ({ discount, input }: { discount?: DiscountCode; input: DiscountInput }) =>
      discount ? adminApi.updateDiscount(discount.id, input) : adminApi.createDiscount(input),
    onSuccess: (code, { discount }) => {
      toast.success(discount ? `کد ${code.code} به‌روز شد.` : `کد ${code.code} ساخته شد.`);
      void refresh();
    },
  });

  // Optimistic on/off switch.
  const toggle = useMutation({
    mutationFn: ({ discount, isActive }: { discount: DiscountCode; isActive: boolean }) =>
      adminApi.updateDiscount(discount.id, { isActive }),
    onMutate: async ({ discount, isActive }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.discounts });
      const previous = queryClient.getQueryData<DiscountCode[]>(queryKeys.discounts);
      queryClient.setQueryData<DiscountCode[]>(queryKeys.discounts, (rows) =>
        rows?.map((row) => (row.id === discount.id ? { ...row, isActive } : row)),
      );
      return { previous };
    },
    onError: (_e, _v, context) => context?.previous && queryClient.setQueryData(queryKeys.discounts, context.previous),
    onSuccess: (code) => toast.success(`کد ${code.code} ${code.isActive ? "فعال" : "غیرفعال"} شد.`),
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: (discount: DiscountCode) => adminApi.deleteDiscount(discount.id),
    meta: { silent: true },
    onSuccess: () => {
      toast.success("کد تخفیف حذف شد.");
      void refresh();
    },
    onError: async (err, discount) => {
      // Used codes cannot be deleted (409): offer to deactivate instead.
      if (err instanceof ApiError && err.status === 409 && discount.isActive) {
        const ok = await confirm({
          title: "حذف این کد ممکن نیست",
          description: err.message,
          confirmLabel: "غیرفعال کردن کد",
          cancelLabel: "بستن",
          destructive: false,
        });
        if (ok) toggle.mutate({ discount, isActive: false });
      } else {
        toast.error(errorMessage(err));
      }
    },
  });

  async function askDelete(discount: DiscountCode) {
    const ok = await confirm({
      title: `حذف کد ${discount.code}؟`,
      description: "کد برای همیشه حذف می‌شود. اگر قبلاً در سفارشی استفاده شده باشد، فقط می‌توانید آن را غیرفعال کنید.",
      confirmLabel: "حذف کد",
    });
    if (ok) remove.mutate(discount);
  }

  return (
    <>
      <PageHeader
        title="کدهای تخفیف"
        description="کدهای درصدی یا مبلغ ثابت با سقف، حداقل سفارش و تاریخ انقضا"
        actions={
          <Button onClick={() => setDialog({})}>
            <Plus />
            کد جدید
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isPending ? (
          <TableSkeleton rows={5} columns={6} />
        ) : isError ? (
          <QueryError error={error} onRetry={() => void refetch()} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<TicketPercent />}
            title="هنوز کد تخفیفی نساخته‌اید"
            description="با یک کد تخفیف، مشتری‌های جدید را به اولین سفارش تشویق کنید."
            action={
              <Button onClick={() => setDialog({})}>
                <Plus />
                ساخت کد تخفیف
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60 text-right text-xs text-stone-500">
                  <th className="px-5 py-3 font-medium">کد</th>
                  <th className="px-3 py-3 font-medium">مقدار تخفیف</th>
                  <th className="px-3 py-3 font-medium">حداقل سفارش</th>
                  <th className="px-3 py-3 font-medium">استفاده</th>
                  <th className="px-3 py-3 font-medium">انقضا</th>
                  <th className="px-3 py-3 font-medium">وضعیت</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">عملیات</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((discount) => {
                  const state = discountState(discount, now);
                  return (
                    <tr key={discount.id} className="transition-colors hover:bg-stone-50/60">
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard?.writeText(discount.code).then(() => toast.success("کد کپی شد."))}
                          className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-brand-200 bg-brand-50/60 px-2.5 py-1 font-mono text-[13px] font-bold tracking-wider text-brand-700"
                          title="کپی کد"
                          dir="ltr"
                        >
                          {discount.code}
                          <Copy className="size-3 opacity-40 group-hover:opacity-100" />
                        </button>
                        {discount.description && <p className="mt-1 max-w-56 truncate text-xs text-stone-500">{discount.description}</p>}
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge tone={discount.type === "PERCENT" ? "violet" : "blue"} className="mb-1">
                          {discount.type === "PERCENT" ? "درصدی" : "مبلغ ثابت"}
                        </Badge>
                        <div className="tabular font-medium text-stone-700">{describeValue(discount)}</div>
                      </td>
                      <td className="tabular px-3 py-3.5 text-stone-600">{discount.minOrder ? toman(discount.minOrder) : "ندارد"}</td>
                      <td className="px-3 py-3.5">
                        <UsageMeter used={discount.usedCount} limit={discount.usageLimit} />
                      </td>
                      <td className="px-3 py-3.5">
                        {discount.expiresAt ? (
                          <span className={cn("tabular inline-flex items-center gap-1.5", state === "expired" ? "text-red-600" : "text-stone-600")}>
                            <CalendarClock className="size-3.5 opacity-60" />
                            {formatDate(discount.expiresAt)}
                          </span>
                        ) : (
                          <span className="text-stone-400">بدون انقضا</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            size="sm"
                            checked={discount.isActive}
                            onCheckedChange={(isActive) => toggle.mutate({ discount, isActive })}
                            label={`فعال بودن ${discount.code}`}
                          />
                          <Badge tone={DISCOUNT_STATE[state].tone} dot>
                            {DISCOUNT_STATE[state].label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setDialog({ discount })} aria-label={`ویرایش ${discount.code}`} title="ویرایش">
                            <Pencil />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => void askDelete(discount)}
                            className="hover:bg-red-50 hover:text-red-600"
                            aria-label={`حذف ${discount.code}`}
                            title="حذف"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <DiscountDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        discount={dialog?.discount}
        onSubmit={(input) => save.mutateAsync({ discount: dialog?.discount, input })}
      />
    </>
  );
}

function UsageMeter({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) {
    return (
      <span className="tabular text-stone-600">
        {faNumber(used)} بار <span className="text-xs text-stone-400">· نامحدود</span>
      </span>
    );
  }
  const ratio = Math.min(1, used / limit);
  return (
    <div className="w-28">
      <div className="tabular mb-1 flex justify-between text-xs">
        <span className="font-medium text-stone-700">{faNumber(used)}</span>
        <span className="text-stone-400">از {faNumber(limit)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className={cn("h-full rounded-full", ratio >= 1 ? "bg-saffron-500" : "bg-brand-500")}
          style={{ width: `${Math.max(ratio * 100, used ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}
