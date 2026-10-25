import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-brand-100/50 blur-xl" aria-hidden />
        <span className="relative grid size-14 place-items-center rounded-2xl border border-stone-200 bg-white text-brand-600 shadow-card [&_svg]:size-6">
          {icon}
        </span>
      </div>
      <h3 className="text-base font-bold text-stone-800">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-6 text-stone-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
