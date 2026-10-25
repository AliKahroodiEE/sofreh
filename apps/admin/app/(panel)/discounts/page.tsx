import type { Metadata } from "next";
import { DiscountsView } from "@/components/discounts/discounts-view";

// Content renders only in the browser once a session exists (see PanelShell),
// so the server cannot validate instant navigation for this segment.
export const instant = false;

export const metadata: Metadata = { title: "کدهای تخفیف" };

export default function DiscountsPage() {
  return <DiscountsView />;
}
