// shadcn/ui Button, re-skinned to DESIGN.md §5.
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded font-sans font-medium transition-[background-color,color,border-color,opacity,transform] duration-[var(--dur-hover)] ease-out active:scale-98 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-white hover:bg-navy",
        navy: "bg-navy text-white hover:bg-ink",
        outline: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
        "outline-light": "border border-white/70 bg-transparent text-white hover:bg-white hover:text-ink",
        light: "bg-white text-ink hover:bg-paper",
        ghost: "bg-transparent text-ink hover:bg-paper-2",
        link: "h-auto px-0 text-navy underline decoration-1 underline-offset-4 hover:decoration-2",
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
