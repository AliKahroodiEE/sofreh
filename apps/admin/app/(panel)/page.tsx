import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

// Content renders only in the browser once a session exists (see PanelShell),
// so the server cannot validate instant navigation for this segment.
export const instant = false;

export const metadata: Metadata = { title: "داشبورد" };

export default function DashboardPage() {
  return <DashboardView />;
}
