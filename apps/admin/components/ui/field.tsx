"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { faNumber, parseInteger } from "@/lib/format";

/** Base styles shared by text inputs, textareas and selects. */
export const controlClass = cn(
  "w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm text-stone-800 shadow-card transition",
  "placeholder:text-stone-400 outline-none hover:border-stone-300",
  "focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10",
  "disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400",
  "aria-invalid:border-red-400 aria-invalid:focus:ring-red-500/10",
);

interface FieldProps {
  label: ReactNode;
  /** Pass the generated id to the control: `{(id) => <Input id={id} />}`. */
  children: (id: string) => ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
}

/** Label + control + hint/error, wired up with ids for accessibility. */
export function Field({ label, children, hint, error, required, className }: FieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-stone-700">
        {label}
        {required && <span className="ms-0.5 text-brand-600">*</span>}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs leading-5 text-stone-500">{hint}</p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-24 resize-y py-2.5 leading-6", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        controlClass,
        "h-10 cursor-pointer appearance-none bg-[length:16px] bg-[left_0.75rem_center] bg-no-repeat pe-3.5 ps-9",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

interface NumberInputProps extends Omit<ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Text shown inside the input on the end side, e.g. «تومان» or «٪». */
  suffix?: string;
}

/**
 * Integer input that accepts Persian or Latin digits and shows thousands
 * separators («۲۵٬۰۰۰»). Emits a number, or null when empty.
 */
export function NumberInput({ value, onValueChange, suffix, className, ...props }: NumberInputProps) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        dir="ltr"
        autoComplete="off"
        value={value === null ? "" : faNumber(value)}
        onChange={(event) => onValueChange(parseInteger(event.target.value))}
        className={cn(controlClass, "tabular h-10 text-right", suffix && "pl-14", className)}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-xs text-stone-400">
          {suffix}
        </span>
      )}
    </div>
  );
}
