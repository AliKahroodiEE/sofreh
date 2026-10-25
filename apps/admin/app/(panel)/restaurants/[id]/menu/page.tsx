import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuView } from "@/components/menu/menu-view";

// Content renders only in the browser once a session exists (see PanelShell),
// so the server cannot validate instant navigation for this segment.
export const instant = false;

export const metadata: Metadata = { title: "مدیریت منو" };

export default function RestaurantMenuPage() {
  return (
    <Suspense>
      <MenuView />
    </Suspense>
  );
}
