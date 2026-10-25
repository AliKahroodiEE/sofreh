"use client";

import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { DailyPoint } from "@/lib/api/types";
import { compactNumber, faNumber, formatDayMonth, formatFullDate, formatWeekday, tehranDay, toman } from "@/lib/format";

const BRAND = "#d7263d";
const SAFFRON = "#ffb820";

interface ChartPoint extends DailyPoint {
  label: string;
}

/**
 * Revenue (area, right axis) and order count (bars, left axis) per day.
 * Time runs right-to-left to match the RTL reading direction.
 */
export function RevenueChart({ series }: { series: DailyPoint[] }) {
  const short = series.length <= 7;
  const data: ChartPoint[] = series.map((point) => ({
    ...point,
    label: short ? formatWeekday(tehranDay(point.date)) : formatDayMonth(tehranDay(point.date)),
  }));

  return (
    <div dir="ltr" className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.22} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e7e5e4" strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            reversed
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#78716c", fontSize: 12 }}
            tickMargin={10}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            yAxisId="revenue"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fill: "#a8a29e", fontSize: 11 }}
            tickFormatter={(value: number) => compactNumber(value)}
          />
          <YAxis
            yAxisId="orders"
            orientation="left"
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
            tick={{ fill: "#a8a29e", fontSize: 11 }}
            tickFormatter={(value: number) => faNumber(value)}
          />
          <Tooltip content={(props) => <ChartTooltip {...props} />} cursor={{ fill: "#f5f5f4" }} />
          <Bar yAxisId="orders" dataKey="orders" fill={SAFFRON} radius={[6, 6, 0, 0]} maxBarSize={short ? 26 : 14} />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke={BRAND}
            strokeWidth={2.5}
            fill="url(#revenue-fill)"
            dot={{ r: 3, fill: "#fff", stroke: BRAND, strokeWidth: 2 }}
            activeDot={{ r: 5, fill: BRAND, stroke: "#fff", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as ChartPoint | undefined;
  if (!active || !point) return null;
  return (
    <div dir="rtl" className="min-w-44 rounded-xl border border-stone-200 bg-white/95 p-3 text-xs shadow-pop backdrop-blur">
      <p className="mb-2 font-bold text-stone-800">{formatFullDate(tehranDay(point.date))}</p>
      <p className="flex items-center justify-between gap-4 py-0.5">
        <span className="flex items-center gap-1.5 text-stone-500">
          <span className="size-2 rounded-full" style={{ background: BRAND }} />
          درآمد
        </span>
        <span className="tabular font-semibold text-stone-800">{toman(point.revenue)}</span>
      </p>
      <p className="flex items-center justify-between gap-4 py-0.5">
        <span className="flex items-center gap-1.5 text-stone-500">
          <span className="size-2 rounded-full" style={{ background: SAFFRON }} />
          سفارش
        </span>
        <span className="tabular font-semibold text-stone-800">{faNumber(point.orders)}</span>
      </p>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-stone-500">
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-3 rounded-full" style={{ background: BRAND }} />
        درآمد (تومان)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm" style={{ background: SAFFRON }} />
        تعداد سفارش
      </span>
    </div>
  );
}
