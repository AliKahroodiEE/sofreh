import type { OrderStatus } from "@/lib/api/types";
import { STATUS_META } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status, short = false, className }: { status: OrderStatus; short?: boolean; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot className={className}>
      {short ? meta.short : meta.label}
    </Badge>
  );
}
