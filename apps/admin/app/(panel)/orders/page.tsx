import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersView } from "@/components/orders/orders-view";

// Content renders only in the browser once a session exists (see PanelShell),
// so the server cannot validate instant navigation for this segment.
export const instant = false;

export const metadata: Metadata = { title: "سفارش‌ها" };

export default function OrdersPage() {
  return (
    // OrdersView keeps its filters in the URL (useSearchParams → Suspense).
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
