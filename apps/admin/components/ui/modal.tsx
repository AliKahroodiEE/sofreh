"use client";

import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Shared behaviour for overlays: Escape closes, the page behind does not
 * scroll, focus moves into the panel and returns to the opener afterwards.
 */
function useOverlay(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("[data-autofocus], input:not([type=hidden]), textarea, select");
    (first ?? panel)?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => handleKey(event);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  return panelRef;
}

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Sticky footer, usually the action buttons. */
  footer?: ReactNode;
  className?: string;
}

interface ModalProps extends OverlayProps {
  size?: "sm" | "md" | "lg";
}

const modalSizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

/** Centered dialog. Renders nothing while closed, so its form state resets on reopen. */
export function Modal(props: ModalProps) {
  if (!props.open) return null;
  return createPortal(<ModalPanel {...props} />, document.body);
}

function ModalPanel({ onClose, title, description, children, footer, size = "md", className }: ModalProps) {
  const panelRef = useOverlay(onClose);
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="animate-fade-in absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "animate-scale-in relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-pop outline-none sm:rounded-3xl",
          modalSizes[size],
          className,
        )}
      >
        <OverlayHeader titleId={titleId} title={title} description={description} onClose={onClose} />
        <div className="scroll-thin flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** Side panel that slides in from the end (left in RTL). */
export function Drawer(props: OverlayProps) {
  if (!props.open) return null;
  return createPortal(<DrawerPanel {...props} />, document.body);
}

function DrawerPanel({ onClose, title, description, children, footer, className }: OverlayProps) {
  const panelRef = useOverlay(onClose);
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "animate-slide-in-left absolute inset-y-0 left-0 flex w-full max-w-xl flex-col bg-canvas shadow-pop outline-none",
          className,
        )}
      >
        <OverlayHeader
          titleId={titleId}
          title={title}
          description={description}
          onClose={onClose}
          className="border-b border-stone-200/80 bg-white pb-4"
        />
        <div className="scroll-thin flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex flex-wrap gap-2 border-t border-stone-200/80 bg-white px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

function OverlayHeader({
  titleId,
  title,
  description,
  onClose,
  className,
}: {
  titleId: string;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-6 pt-5 pb-4", className)}>
      <div className="min-w-0">
        <h2 id={titleId} className="text-lg font-bold text-stone-900">
          {title}
        </h2>
        {description && <div className="mt-1 text-sm leading-6 text-stone-500">{description}</div>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="-me-2 grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        aria-label="بستن"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
