"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "./button";
import { Modal } from "./modal";

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions (default true). */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based confirmation dialog:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "حذف شود؟" })) { … }
 */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const settle = useCallback(
    (value: boolean) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending],
  );

  const destructive = pending?.destructive ?? true;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!pending}
        onClose={() => settle(false)}
        size="sm"
        title={
          <span className="flex items-center gap-2.5">
            {destructive && (
              <span className="grid size-9 place-items-center rounded-xl bg-red-50 text-red-600">
                <TriangleAlert className="size-5" />
              </span>
            )}
            {pending?.title}
          </span>
        }
        footer={
          <>
            {/* Destructive dialogs focus "cancel" so Enter never deletes by accident. */}
            <Button variant="secondary" onClick={() => settle(false)} data-autofocus={destructive || undefined}>
              {pending?.cancelLabel ?? "انصراف"}
            </Button>
            <Button variant={destructive ? "danger" : "primary"} onClick={() => settle(true)} data-autofocus={!destructive || undefined}>
              {pending?.confirmLabel ?? "تأیید"}
            </Button>
          </>
        }
      >
        {pending?.description && <div className="text-sm leading-7 text-stone-600">{pending.description}</div>}
      </Modal>
    </ConfirmContext.Provider>
  );
}
