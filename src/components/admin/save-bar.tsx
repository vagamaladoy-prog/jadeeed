import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Form footer with the submit button. Phone: pinned to the bottom, right above the tab bar
 * (the tab bar already pads for env(safe-area-inset-bottom)); desktop: a regular row at the end of the form.
 */
export function SaveBar({
  pending,
  label = "Сохранить",
  children,
  dirty,
}: {
  pending?: boolean;
  label?: string;
  children?: ReactNode;
  /** shows a quiet "unsaved changes" note */
  dirty?: boolean;
}) {
  return (
    <>
      {/* reserves room so the fixed bar never covers the last field on phones */}
      <div aria-hidden className="h-20 lg:hidden" />
      <div className="fixed inset-x-0 bottom-tabbar z-30 border-t border-line bg-white px-4 py-3 lg:static lg:mt-2 lg:border-t-0 lg:bg-transparent lg:p-0">
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} className="min-w-40 flex-1 lg:flex-none">
            {pending && <Loader2 className="animate-spin" />}
            {label}
          </Button>
          {children}
          {dirty && !pending && <span className="hidden text-body-sm text-muted sm:inline">Есть несохранённые изменения</span>}
        </div>
      </div>
    </>
  );
}
