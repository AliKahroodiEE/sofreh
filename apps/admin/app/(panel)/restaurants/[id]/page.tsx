import type { Metadata } from "next";
import { Suspense } from "react";
import { RestaurantEditView } from "@/components/restaurants/restaurant-edit-view";

// Content renders only in the browser once a session exists (see PanelShell),
// so the server cannot validate instant navigation for this segment.
export const instant = false;

export const metadata: Metadata = { title: "ویرایش رستوران" };

export default function EditRestaurantPage() {
  return (
    // The id is read on the client with useParams (unknown at build time → Suspense).
    <Suspense>
      <RestaurantEditView />
    </Suspense>
  );
}
