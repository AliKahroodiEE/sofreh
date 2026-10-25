import { Badge } from "@/components/ui/badge";

export function RestaurantBadges({ isOpen, isActive }: { isOpen: boolean; isActive: boolean }) {
  return (
    <>
      {isActive ? (
        <Badge tone={isOpen ? "green" : "neutral"} dot>
          {isOpen ? "باز" : "بسته"}
        </Badge>
      ) : (
        <Badge tone="red" dot>
          غیرفعال
        </Badge>
      )}
    </>
  );
}
