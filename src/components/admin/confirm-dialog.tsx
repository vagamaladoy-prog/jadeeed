"use client";
import { AlertDialog } from "radix-ui";
import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Confirmation for destructive actions. `onConfirm` may be async; the dialog stays open
 * (with a spinner) until it resolves, and closes afterwards unless it returns false.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Удалить",
  onConfirm,
}: {
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<boolean | void> | boolean | void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const res = await onConfirm();
      if (res !== false) setOpen(false);
    });

  return (
    <AlertDialog.Root open={open} onOpenChange={(v) => !pending && setOpen(v)}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <AlertDialog.Content className="fixed inset-x-4 bottom-[max(16px,var(--safe-bottom))] z-50 mx-auto max-w-md rounded border border-line bg-white p-5 text-ink outline-none sm:inset-x-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:p-6">
          <AlertDialog.Title className="text-subheading font-medium">{title}</AlertDialog.Title>
          {description ? (
            <AlertDialog.Description className="mt-2 text-body-sm text-muted">{description}</AlertDialog.Description>
          ) : (
            <AlertDialog.Description className="sr-only">Подтвердите действие</AlertDialog.Description>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" size="sm" disabled={pending}>
                Отмена
              </Button>
            </AlertDialog.Cancel>
            <Button
              size="sm"
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                confirm();
              }}
            >
              {pending && <Loader2 className="animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
