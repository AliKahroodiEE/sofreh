import type { Metadata } from "next";
import { Suspense } from "react";
import { RestaurantsView } from "@/components/restaurants/restaurants-view";

// Content renders only in the browser once a session exists (see PanelShell),
// so the server cannot validate instant navigation for this segment.
export const instant = false;

export const metadata: Metadata = { title: "رستوران‌ها" };

export default function RestaurantsPage() {
  return (
    <Suspense>
      <RestaurantsView />
    </Suspense>
  );
}
