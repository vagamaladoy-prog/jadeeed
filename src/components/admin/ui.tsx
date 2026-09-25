// Admin primitives: strict black & white, hairlines, no shadows, no decorative motion.
import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { FieldError, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export function PageTitle({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="text-heading font-medium tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-body-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded border border-line bg-white", className)} {...props} />;
}

export function Section({
  title,
  description,
  children,
  className,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <Panel className={cn("p-4 sm:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-subheading font-medium">{title}</h2>
          {description && <p className="mt-1 text-body-sm text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </Panel>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-body-sm text-muted">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function Hint({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-body-sm text-muted", className)} {...props} />;
}

/** Native select styled as Input (best on phones: the OS picker). */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-12 w-full appearance-none rounded border border-line bg-white pl-4 pr-10 text-body text-ink outline-none transition-colors duration-150 focus-visible:border-navy focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy aria-[invalid=true]:border-ink disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4.5 -translate-y-1/2 text-muted" />
    </div>
  );
}

/** Checkbox with a 44px tall hit area. */
export function Checkbox({
  label,
  description,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-start gap-3 py-2.5", className)}>
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 cursor-pointer accent-ink" {...props} />
      <span className="min-w-0 text-body-sm leading-5">
        <span className="block text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-muted">{description}</span>}
      </span>
    </label>
  );
}

/** On/off switch (role="switch"). Controlled. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
  hideLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex min-h-11 items-center gap-3 rounded text-left text-body-sm text-ink disabled:opacity-40",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 items-center rounded-pill border transition-colors duration-150",
          checked ? "border-ink bg-ink" : "border-line bg-paper-2",
        )}
      >
        <span
          className={cn(
            "absolute size-4.5 rounded-pill bg-white transition-transform duration-150",
            checked ? "translate-x-[19px]" : "translate-x-[2px] border border-line",
          )}
        />
      </span>
      {!hideLabel && <span>{label}</span>}
    </button>
  );
}

export function Badge({
  children,
  tone = "outline",
  className,
}: {
  children: ReactNode;
  tone?: "solid" | "outline" | "muted" | "navy";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center whitespace-nowrap rounded-pill px-2.5 text-micro font-medium",
        tone === "solid" && "bg-ink text-white",
        tone === "navy" && "bg-navy text-white",
        tone === "outline" && "border border-ink text-ink",
        tone === "muted" && "border border-line bg-paper text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <Panel className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-body font-medium">{title}</p>
      {children && <div className="text-body-sm text-muted">{children}</div>}
    </Panel>
  );
}

/** Plain <img> — admin previews show uploaded files as-is (no optimizer, any host). */
export function Thumb({ src, alt = "", className }: { src: string | null | undefined; alt?: string; className?: string }) {
  if (!src) return <span aria-hidden className={cn("block bg-paper-2", className)} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={cn("block bg-paper-2 object-cover", className)} />;
}

/** Visually-hidden text for screen readers. */
export function Sr({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
