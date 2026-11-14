// shadcn/ui Button, re-skinned to DESIGN.md §5.
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded font-sans font-medium transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-[var(--dur-hover)] ease-out active:scale-98 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "glass-gloss bg-anor text-white hover:bg-ink",
        ink: "glass-gloss bg-ink text-white hover:bg-anor",
        anor: "glass-gloss bg-anor text-white hover:bg-ink",
        outline: "glass border border-ink/25 text-ink hover:border-ink/50",
        "outline-light": "glass-dark text-white hover:bg-white/15",
        light: "glass text-ink hover:bg-white/40",
        ghost: "bg-transparent text-ink hover:bg-paper-2",
        link: "h-auto px-0 text-anor underline decoration-1 underline-offset-4 hover:decoration-2",
      },
      size: {
        sm: "h-11 px-4 text-body-sm",
        md: "h-12 px-6 text-body",
        lg: "h-14 px-8 text-body",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
