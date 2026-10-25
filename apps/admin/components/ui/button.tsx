import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft" | "saffron";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-900/10 hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500/40",
  secondary:
    "bg-white text-stone-700 border border-stone-200 shadow-card hover:bg-stone-50 hover:border-stone-300 focus-visible:ring-stone-400/30",
  ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-stone-400/30",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500/40",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-500/30",
  saffron: "bg-saffron-500 text-stone-900 shadow-sm hover:bg-saffron-400 focus-visible:ring-saffron-500/40",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-6 text-base",
  icon: "size-10 rounded-xl",
  "icon-sm": "size-8 rounded-lg",
};

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

/** Shared button styles, also used by links via `buttonClass()`. */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap transition-colors duration-150",
    "outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-55",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
