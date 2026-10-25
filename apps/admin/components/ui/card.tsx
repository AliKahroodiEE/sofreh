import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-stone-200/80 bg-white shadow-card", className)} {...props} />;
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, icon, actions, className }: CardHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600 [&_svg]:size-[18px]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-stone-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-5 text-stone-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
