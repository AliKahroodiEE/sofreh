"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { controlClass } from "./field";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "جستجو…", className }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute inset-y-0 right-3.5 my-auto size-4 text-stone-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(controlClass, "h-10 pe-9 ps-10 [&::-webkit-search-cancel-button]:hidden")}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 left-2 my-auto grid size-6 cursor-pointer place-items-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          aria-label="پاک کردن جستجو"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
