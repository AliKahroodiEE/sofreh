import { PanelShell } from "@/components/layout/panel-shell";

/** Every page in this group requires an admin session (see PanelShell). */
export default function PanelLayout({ children }: LayoutProps<"/">) {
  return <PanelShell>{children}</PanelShell>;
}
