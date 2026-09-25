import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// teach tailwind-merge about our custom type-scale utilities so `text-body text-white` don't collide
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["micro", "wordmark", "label", "body-sm", "body", "subheading", "heading", "heading-lg", "display", "display-xl"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
