"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { OrderStatus } from "@/lib/api/types";
import { faNumber, faPercent } from "@/lib/format";
import { ORDER_STATUSES, STATUS_META } from "@/lib/orders";

/** Chart colours for each status (match the badge tones). */
export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "#f4a300",
  CONFIRMED: "#0ea5e9",
  PREPARING: "#8b5cf6",
  DELIVERING: "#df3b50",
  DELIVERED: "#10b981",
  CANCELLED: "#a8a29e",
};

export function StatusBreakdown({ counts }: { counts: Partial<Record<OrderStatus, number>> }) {
  const rows = ORDER_STATUSES.map((status) => ({ status, value: counts[status] ?? 0 }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div>
      <div dir="ltr" className="relative mx-auto h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows.filter((row) => row.value > 0)}
              dataKey="value"
              nameKey="status"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {rows
                .filter((row) => row.value > 0)
                .map((row) => (
                  <Cell key={row.status} fill={STATUS_COLORS[row.status]} />
                ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="tabular text-2xl font-extrabold text-stone-900">{faNumber(total)}</p>
            <p className="text-xs text-stone-500">کل سفارش‌ها</p>
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {rows.map(({ status, value }) => (
          <li key={status} className="flex items-center gap-2.5 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLORS[status] }} />
            <span className="text-stone-600">{STATUS_META[status].short}</span>
            <span className="ms-auto tabular font-semibold text-stone-800">{faNumber(value)}</span>
            <span className="tabular w-10 text-left text-xs text-stone-400">{total ? faPercent(value / total) : "۰٪"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
