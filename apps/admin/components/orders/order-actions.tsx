"use client";

import { Ban, Bike, ChefHat, CircleCheck, PackageCheck } from "lucide-react";
import type { OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { faDigits } from "@/lib/format";
import { useOrderStatusMutation } from "@/lib/hooks/use-order-status";
import { NEXT_ACTIONS } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";

const ICONS: Partial<Record<OrderStatus, typeof Ban>> = {
  CONFIRMED: CircleCheck,
  PREPARING: ChefHat,
  DELIVERING: Bike,
  DELIVERED: PackageCheck,
  CANCELLED: Ban,
};

interface OrderActionsProps {
  order: { id: number; code: string; status: OrderStatus };
  size?: "sm" | "md";
  className?: string;
}

/** Buttons for the next allowed statuses (PENDING → CONFIRMED/CANCELLED, …). */
export function OrderActions({ order, size = "sm", className }: OrderActionsProps) {
  const confirm = useConfirm();
  const mutation = useOrderStatusMutation();
  const actions = NEXT_ACTIONS[order.status];
  if (actions.length === 0) return null;

  async function run(to: OrderStatus, destructive?: boolean) {
    if (destructive) {
      const ok = await confirm({
        title: `لغو سفارش ${faDigits(order.code)}؟`,
        description: "سفارش لغو می‌شود و مشتری بلافاصله در اپ مطلع می‌شود. اگر کد تخفیف استفاده شده باشد، سهمیه‌ی آن برمی‌گردد.",
        confirmLabel: "لغو سفارش",
        cancelLabel: "منصرف شدم",
      });
      if (!ok) return;
    }
    mutation.mutate({ id: order.id, to });
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)} onClick={(event) => event.stopPropagation()}>
      {actions.map((action) => {
        const Icon = ICONS[action.to];
        const pending = mutation.isPending && mutation.variables?.to === action.to;
        return (
          <Button
            key={action.to}
            size={size}
            variant={action.destructive ? "ghost" : "primary"}
            loading={pending}
            disabled={mutation.isPending}
            onClick={() => void run(action.to, action.destructive)}
            className={cn(action.destructive && "text-red-600 hover:bg-red-50 hover:text-red-700")}
          >
            {!pending && Icon && <Icon />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
