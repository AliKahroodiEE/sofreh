"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchX, ShieldCheck, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/endpoints";
import type { AdminUser, Paginated, Role } from "@/lib/api/types";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { faNumber, formatDate, formatPhone, toLatinDigits } from "@/lib/format";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { queryKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { SearchInput } from "@/components/ui/search-input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

const PAGE_SIZE = 15;

export const ROLE_LABEL: Record<Role, string> = { ADMIN: "مدیر", CUSTOMER: "مشتری" };

type UserPatch = { role?: Role; isActive?: boolean };

export function UsersView() {
  const [params, setParams] = useUrlState();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const pushSearch = useDebouncedCallback((value: string) => setParams({ q: value.trim(), page: null }), 400);

  const me = useSession()?.user;
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const query = { search: search ? toLatinDigits(search) : undefined, page, limit: PAGE_SIZE };
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuery({
    queryKey: queryKeys.userList(query),
    queryFn: () => adminApi.users(query),
    placeholderData: keepPreviousData,
  });

  const update = useMutation({
    mutationFn: ({ user, patch }: { user: AdminUser; patch: UserPatch }) => adminApi.updateUser(user.id, patch),
    onSuccess: (updated) => {
      // Patch the row in place, then refresh lists and counters in the background.
      queryClient.setQueriesData<Paginated<AdminUser>>({ queryKey: queryKeys.userLists }, (current) =>
        current && { ...current, items: current.items.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)) },
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.usersAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statsAll });
    },
  });

  async function changeRole(user: AdminUser, role: Role) {
    const ok = await confirm({
      title: `نقش ${user.name ?? formatPhone(user.phone)} به «${ROLE_LABEL[role]}» تغییر کند؟`,
      description:
        role === "ADMIN"
          ? "این کاربر به همه‌ی بخش‌های پنل مدیریت دسترسی پیدا می‌کند. تغییر نقش حداکثر تا ۱۵ دقیقه روی نشست فعلی او اعمال می‌شود."
          : "دسترسی این کاربر به پنل مدیریت گرفته می‌شود (حداکثر تا ۱۵ دقیقه روی نشست فعلی).",
      confirmLabel: "تغییر نقش",
      destructive: role === "CUSTOMER",
    });
    if (!ok) return;
    update.mutate(
      { user, patch: { role } },
      { onSuccess: () => toast.success(`نقش کاربر به «${ROLE_LABEL[role]}» تغییر کرد.`) },
    );
  }

  async function toggleActive(user: AdminUser, isActive: boolean) {
    if (!isActive) {
      const ok = await confirm({
        title: `غیرفعال کردن ${user.name ?? formatPhone(user.phone)}؟`,
        description: "کاربر غیرفعال نمی‌تواند وارد شود یا نشستش را تمدید کند.",
        confirmLabel: "غیرفعال کن",
      });
      if (!ok) return;
    }
    update.mutate(
      { user, patch: { isActive } },
      { onSuccess: () => toast.success(isActive ? "کاربر فعال شد." : "کاربر غیرفعال شد.") },
    );
  }

  return (
    <>
      <PageHeader
        title="کاربران"
        description={data ? `${faNumber(data.total)} کاربر ثبت‌نام کرده‌اند` : "مشتریان و مدیران سامانه"}
      />

      <Card className="overflow-hidden">
        <div className="border-b border-stone-100 p-4">
          <SearchInput
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              pushSearch(value);
            }}
            placeholder="جستجوی نام یا شماره موبایل"
            className="sm:w-80"
          />
        </div>

        {isPending ? (
          <TableSkeleton rows={8} columns={5} />
        ) : isError ? (
          <QueryError error={error} onRetry={() => void refetch()} />
        ) : data.items.length === 0 ? (
          search ? (
            <EmptyState icon={<SearchX />} title="کاربری پیدا نشد" description={`نتیجه‌ای برای «${search}» نبود.`} />
          ) : (
            <EmptyState icon={<Users />} title="هنوز کاربری ثبت‌نام نکرده" />
          )
        ) : (
          <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/60 text-right text-xs text-stone-500">
                    <th className="px-5 py-3 font-medium">کاربر</th>
                    <th className="px-3 py-3 font-medium">نقش</th>
                    <th className="px-3 py-3 font-medium">سفارش‌ها</th>
                    <th className="px-3 py-3 font-medium">تاریخ عضویت</th>
                    <th className="px-5 py-3 font-medium">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.items.map((user) => {
                    const self = user.id === me?.id;
                    const busy = update.isPending && update.variables?.user.id === user.id;
                    return (
                      <tr key={user.id} className={cn("transition-colors hover:bg-stone-50/60", !user.isActive && "bg-stone-50/50")}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                                user.role === "ADMIN" ? "bg-brand-50 text-brand-600" : "bg-stone-100 text-stone-500",
                              )}
                            >
                              {user.name ? user.name.charAt(0) : <UserRound className="size-4" />}
                            </span>
                            <div>
                              <div className={cn("font-medium", user.name ? "text-stone-800" : "text-stone-400")}>
                                {user.name ?? "بدون نام"}
                                {self && <span className="ms-1.5 text-xs font-normal text-brand-600">(شما)</span>}
                              </div>
                              <div className="tabular text-xs text-stone-500">
                                <span dir="ltr">{formatPhone(user.phone)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Badge tone={user.role === "ADMIN" ? "brand" : "neutral"}>
                              {user.role === "ADMIN" && <ShieldCheck />}
                              {ROLE_LABEL[user.role]}
                            </Badge>
                            <Select
                              aria-label={`تغییر نقش ${user.name ?? user.phone}`}
                              value={user.role}
                              disabled={self || busy}
                              onChange={(e) => void changeRole(user, e.target.value as Role)}
                              className="h-8 w-28 rounded-lg text-xs"
                              title={self ? "نقش حساب خودتان را نمی‌توانید تغییر دهید." : undefined}
                            >
                              <option value="CUSTOMER">مشتری</option>
                              <option value="ADMIN">مدیر</option>
                            </Select>
                          </div>
                        </td>
                        <td className="tabular px-3 py-3 text-stone-700">{faNumber(user._count.orders)}</td>
                        <td className="tabular px-3 py-3 text-stone-500">{formatDate(user.createdAt)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Switch
                              size="sm"
                              checked={user.isActive}
                              disabled={self || busy}
                              onCheckedChange={(value) => void toggleActive(user, value)}
                              label={`فعال بودن ${user.name ?? user.phone}`}
                            />
                            <span className={cn("text-xs", user.isActive ? "text-emerald-700" : "text-stone-400")}>
                              {user.isActive ? "فعال" : "غیرفعال"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-stone-100">
              <Pagination
                page={data.page}
                limit={data.limit}
                total={data.total}
                onPageChange={(next) => setParams({ page: next === 1 ? null : next })}
              />
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
