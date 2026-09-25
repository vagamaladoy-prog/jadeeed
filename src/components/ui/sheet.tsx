"use client";
// Bottom sheet / side drawer on top of vaul (MIT). Swipe down (or right) closes it.
// Phone: every popup is a bottom sheet (DESIGN.md §5, ТЗ 7.3). Desktop may use side="right".
import { Drawer } from "vaul";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** visually hide the title (still read by screen readers) */
  hideTitle?: boolean;
  side?: "bottom" | "right";
  /** bottom sheet taking the whole screen height */
  full?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Sheet({ open, onOpenChange, title, hideTitle, side = "bottom", full, children, footer, className }: Props) {
  const t = useTranslations("nav");
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={side}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Drawer.Content
          data-lenis-prevent
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col bg-paper text-ink outline-none",
            side === "bottom" &&
              cn(
                "inset-x-0 bottom-0 rounded-t-sheet pb-[max(var(--safe-bottom),var(--tg-content-bottom))]",
                full ? "h-[calc(100dvh-var(--safe-top)-var(--tg-content-top)-12px)]" : "max-h-[88dvh]",
              ),
            side === "right" && "inset-y-0 right-0 h-dvh w-full max-w-md border-l border-line",
            className,
          )}
        >
          {side === "bottom" && <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-pill bg-line" />}
          <div className="flex shrink-0 items-center justify-between gap-4 px-gutter pb-2 pt-3">
            <Drawer.Title className={cn("font-display text-heading font-light tracking-tight", hideTitle && "sr-only")}>
              {title}
            </Drawer.Title>
            <Drawer.Close
              aria-label={t("close")}
              className="-mr-2 grid size-11 place-items-center rounded text-ink transition-colors duration-[var(--dur-hover)] hover:bg-paper-2"
            >
              <X className="size-5" />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-gutter pb-4">{children}</div>
          {footer && <div className="shrink-0 border-t border-line bg-paper px-gutter py-3">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
