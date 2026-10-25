"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { faDigits, toLatinDigits } from "@/lib/format";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
}

/**
 * One box per digit. Accepts Persian/Latin digits, moves focus as you type,
 * supports Backspace/arrow keys and pasting the whole code. Codes read
 * left-to-right, so the row is LTR inside the RTL page.
 */
export function OtpInput({ value, onChange, length = 5, disabled, invalid }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focus = (index: number) => refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();

  function setDigit(index: number, raw: string) {
    const typed = toLatinDigits(raw).replace(/\D/g, "");
    if (!typed) return;
    // Typing several digits at once (autofill on mobile) fills the following boxes.
    const next = (value.slice(0, index) + typed).slice(0, length);
    onChange(next);
    focus(next.length);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) onChange(value.slice(0, index));
      else if (index > 0) {
        onChange(value.slice(0, index - 1));
        focus(index - 1);
      }
    } else if (event.key === "ArrowLeft") focus(index - 1);
    else if (event.key === "ArrowRight") focus(index + 1);
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = toLatinDigits(event.clipboardData.getData("text")).replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      focus(pasted.length);
    }
  }

  return (
    <div dir="ltr" className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit ? faDigits(digit) : ""}
          onChange={(event) => setDigit(index, event.target.value.slice(-length))}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          onFocus={(event) => event.target.select()}
          // Always continue from the first empty box.
          onMouseDown={(event) => {
            if (index > value.length) {
              event.preventDefault();
              focus(value.length);
            }
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          autoFocus={index === 0}
          aria-label={`رقم ${faDigits(index + 1)} کد تأیید`}
          aria-invalid={invalid || undefined}
          className={cn(
            "tabular size-12 rounded-xl border bg-white text-center text-xl font-bold text-stone-900 shadow-card transition outline-none sm:size-14 sm:text-2xl",
            "focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 disabled:opacity-60",
            invalid ? "border-red-300" : digit ? "border-stone-300" : "border-stone-200",
          )}
        />
      ))}
    </div>
  );
}
