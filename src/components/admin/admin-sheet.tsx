"use client";
// Admin bottom sheet on top of vaul (the storefront Sheet needs next-intl, which admin doesn't have).
import { Drawer } from "vaul";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AdminSheet({ open, onOpenChange, title, children, footer, className }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Drawer.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-sheet bg-white pb-(--safe-bottom) text-ink outline-none",
            className,
          )}
        >
          <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-pill bg-line" />
          <div className="flex shrink-0 items-center justify-between gap-4 px-4 pb-2 pt-3">
            <Drawer.Title className="text-subheading font-medium">{title}</Drawer.Title>
            <Drawer.Close
              aria-label="Закрыть"
              className="-mr-2 grid size-11 place-items-center rounded text-ink transition-colors duration-150 hover:bg-paper-2"
            >
              <X className="size-5" />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
          {footer && <div className="shrink-0 border-t border-line px-4 py-3">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
