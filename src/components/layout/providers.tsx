"use client";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { TelegramProvider } from "@/components/telegram/telegram-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    // reducedMotion="user": every Motion animation respects prefers-reduced-motion
    <MotionConfig reducedMotion="user">
      <TelegramProvider>{children}</TelegramProvider>
    </MotionConfig>
  );
}
