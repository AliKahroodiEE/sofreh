import { LayoutDashboard, ReceiptText, Store, TicketPercent, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show the live "new orders" counter on this item. */
  liveBadge?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard },
  { href: "/orders", label: "سفارش‌ها", icon: ReceiptText, liveBadge: true },
  { href: "/restaurants", label: "رستوران‌ها", icon: Store },
  { href: "/discounts", label: "کدهای تخفیف", icon: TicketPercent },
  { href: "/users", label: "کاربران", icon: Users },
];

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
