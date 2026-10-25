import { CakeSlice, Coffee, CookingPot, EggFried, Fish, Hamburger, Pizza, Salad, Utensils, type LucideIcon } from "lucide-react";

/** The API's cuisine `icon` keys mapped to lucide icons. */
const ICONS: Record<string, LucideIcon> = {
  iranian: CookingPot,
  burger: Hamburger,
  pizza: Pizza,
  coffee: Coffee,
  cake: CakeSlice,
  salad: Salad,
  breakfast: EggFried,
  fish: Fish,
};

export function CuisineIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Utensils;
  return <Icon className={className} aria-hidden />;
}
