/* eslint-disable @next/next/no-img-element --
 * Images come from the API origin, which differs per environment (and is not
 * reachable from inside the Docker container as "localhost"), so the Next.js
 * image optimizer is not used; the API already serves resized WebP files.
 */
import type { ReactNode } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/config";

interface ThumbProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Rendered when there is no image. */
  fallback?: ReactNode;
}

/** Rounded image with a neutral placeholder when the image is missing. */
export function Thumb({ src, alt, className, fallback }: ThumbProps) {
  const url = mediaUrl(src);
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-stone-100", className)}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-stone-300">{fallback ?? <ImageOff className="size-1/3 max-w-8" />}</div>
      )}
    </div>
  );
}
