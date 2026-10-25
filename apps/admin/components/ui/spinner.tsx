import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ className, label = "در حال بارگذاری" }: { className?: string; label?: string }) {
  return <LoaderCircle className={cn("size-5 animate-spin text-brand-600", className)} role="status" aria-label={label} />;
}
