// shadcn/ui Input / Textarea / Label, re-skinned to DESIGN.md §5.
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded border border-line bg-white px-4 text-body text-ink placeholder:text-muted/80 transition-colors duration-[var(--dur-hover)] outline-none focus-visible:border-navy focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy aria-[invalid=true]:border-ink disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-24 resize-y py-3", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-2 block text-body-sm font-medium text-ink", className)} {...props} />;
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-2 text-body-sm text-ink">
      <span className="mr-1 inline-block size-1.5 translate-y-[-2px] rounded-pill bg-navy" aria-hidden />
      {children}
    </p>
  );
}
