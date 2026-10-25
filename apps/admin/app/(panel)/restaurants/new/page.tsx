import type { Metadata } from "next";
import { RestaurantNewView } from "@/components/restaurants/restaurant-new-view";

// Content renders only in the browser once a session exists (see PanelShell),
// so the server cannot validate instant navigation for this segment.
export const instant = false;

export const metadata: Metadata = { title: "رستوران جدید" };

export default function NewRestaurantPage() {
  return <RestaurantNewView />;
}
