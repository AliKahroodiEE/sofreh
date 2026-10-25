"use client";

import { cn } from "@/lib/cn";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Accessible name when there is no visible label. */
  label?: string;
  id?: string;
  size?: "sm" | "md";
  className?: string;
}

/** Accessible on/off toggle (role="switch"). Laid out for RTL. */
export function Switch({ checked, onCheckedChange, disabled, label, id, size = "md", className }: SwitchProps) {
  const small = size === "sm";
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        "outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50",
        small ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-emerald-500" : "bg-stone-300",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 right-0.5 rounded-full bg-white shadow-sm transition-transform duration-200",
          small ? "size-4" : "size-5",
          // RTL: "on" slides the knob towards the left (end) side.
          checked && (small ? "-translate-x-4" : "-translate-x-5"),
        )}
      />
    </button>
  );
}

interface SwitchFieldProps extends Omit<SwitchProps, "label"> {
  title: string;
  description?: string;
}

/** A switch with a title and description, for forms. */
export function SwitchField({ title, description, className, ...props }: SwitchFieldProps) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-stone-200 p-3.5 transition hover:bg-stone-50/60", className)}>
      <span>
        <span className="block text-sm font-medium text-stone-800">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-5 text-stone-500">{description}</span>}
      </span>
      <Switch {...props} label={title} />
    </label>
  );
}
