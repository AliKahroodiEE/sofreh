"use client";

/* eslint-disable @next/next/no-img-element -- see components/ui/thumb.tsx */
import { useId, useRef, useState, type DragEvent } from "react";
import { ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/config";

const MAX_BYTES = 8 * 1024 * 1024;

interface ImageUploadProps {
  /** Relative upload path from the API, e.g. `/uploads/123.webp`. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** `square` for logos and dishes, `wide` for covers. */
  shape?: "square" | "wide";
  label?: string;
  className?: string;
}

/**
 * Picks an image, uploads it to POST /admin/uploads (field `file`) right away
 * and reports the returned URL. Supports drag & drop.
 */
export function ImageUpload({ value, onChange, shape = "square", label = "تصویر", className }: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const url = mediaUrl(value);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("یک فایل تصویری انتخاب کنید.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("حجم تصویر باید کمتر از ۸ مگابایت باشد.");
      return;
    }
    setUploading(true);
    try {
      const { url: uploaded } = await adminApi.upload(file);
      onChange(uploaded);
      toast.success("تصویر بارگذاری شد.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files[0]);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed transition",
          shape === "wide" ? "aspect-[16/7]" : "aspect-square",
          dragging ? "border-brand-400 bg-brand-50" : url ? "border-transparent" : "border-stone-200 bg-stone-50 hover:border-stone-300",
        )}
      >
        {url ? (
          <>
            <img src={url} alt={label} className="size-full object-cover" />
            <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-stone-900/60 via-transparent p-3 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
              <label
                htmlFor={inputId}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-stone-800 shadow hover:bg-white"
              >
                <RefreshCw className="size-3.5" />
                تغییر
              </label>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-red-600 shadow hover:bg-white"
              >
                <Trash2 className="size-3.5" />
                حذف
              </button>
            </div>
          </>
        ) : (
          <label htmlFor={inputId} className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 p-3 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-stone-500 shadow-card transition group-hover:text-brand-600">
              <ImagePlus className="size-5" />
            </span>
            <span className="text-xs font-medium text-stone-600">{label}</span>
            <span className="text-[11px] text-stone-400">کلیک کنید یا تصویر را بکشید</span>
          </label>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-white/75 backdrop-blur-sm">
            <span className="flex items-center gap-2 text-xs font-medium text-stone-600">
              <LoaderCircle className="size-4 animate-spin text-brand-600" />
              در حال بارگذاری…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
