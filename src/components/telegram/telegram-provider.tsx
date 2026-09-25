"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

// Minimal typings for the parts of telegram-web-app.js we use.
type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type Inset = { top: number; bottom: number; left: number; right: number };
type TgButton = {
  setText(t: string): TgButton;
  show(): TgButton;
  hide(): TgButton;
  enable(): TgButton;
  disable(): TgButton;
  showProgress(leaveActive?: boolean): TgButton;
  hideProgress(): TgButton;
  setParams(p: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }): TgButton;
  onClick(cb: () => void): TgButton;
  offClick(cb: () => void): TgButton;
};
export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name?: string; last_name?: string; username?: string } };
  platform: string;
  version: string;
  ready(): void;
  expand(): void;
  disableVerticalSwipes?: () => void;
  setHeaderColor(c: string): void;
  setBackgroundColor(c: string): void;
  setBottomBarColor?: (c: string) => void;
  openTelegramLink(url: string): void;
  openLink(url: string): void;
  requestContact?: (cb?: (ok: boolean, res?: { responseUnsafe?: { contact?: { phone_number?: string } } }) => void) => void;
  onEvent(e: string, cb: (...a: unknown[]) => void): void;
  offEvent(e: string, cb: (...a: unknown[]) => void): void;
  safeAreaInset?: Inset;
  contentSafeAreaInset?: Inset;
  MainButton: TgButton;
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void };
  HapticFeedback: {
    impactOccurred(s: HapticStyle): void;
    notificationOccurred(t: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };
  isVersionAtLeast(v: string): boolean;
};
declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

type Ctx = {
  /** true only when opened inside Telegram with valid-looking initData */
  isMiniApp: boolean;
  webApp: TelegramWebApp | null;
  haptic: (kind?: "select" | "success" | "light") => void;
  /** opens t.me links inside Telegram in the Mini App, otherwise a new tab */
  openLink: (url: string) => void;
};

const TelegramContext = createContext<Ctx>({
  isMiniApp: false,
  webApp: null,
  haptic: () => {},
  openLink: (url) => window.open(url, "_blank", "noopener,noreferrer"),
});

export const useTelegram = () => useContext(TelegramContext);

const SDK = "https://telegram.org/js/telegram-web-app.js";
const FLAG = "jd-tg";
const INK = "#0B0B0C";
const PAPER = "#F5F3EE";

function launchedInTelegram() {
  try {
    return window.location.hash.includes("tgWebAppData") || sessionStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}

function loadSdk(): Promise<TelegramWebApp | null> {
  if (window.Telegram?.WebApp) return Promise.resolve(window.Telegram.WebApp);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = SDK;
    s.async = true;
    s.onload = () => resolve(window.Telegram?.WebApp ?? null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

function applyInsets(wa: TelegramWebApp) {
  const root = document.documentElement.style;
  const safe = wa.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const content = wa.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
  root.setProperty("--tg-content-top", `${safe.top + content.top}px`);
  root.setProperty("--tg-content-bottom", `${safe.bottom + content.bottom}px`);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    if (!launchedInTelegram()) return;
    let cancelled = false;
    loadSdk().then((wa) => {
      if (cancelled || !wa || !wa.initData) return;
      try {
        sessionStorage.setItem(FLAG, "1");
      } catch {}
      document.documentElement.dataset.tg = "1";
      wa.ready();
      wa.expand();
      wa.disableVerticalSwipes?.();
      wa.setHeaderColor(PAPER);
      wa.setBackgroundColor(PAPER);
      wa.setBottomBarColor?.(PAPER);
      applyInsets(wa);
      const onInsets = () => applyInsets(wa);
      wa.onEvent("safeAreaChanged", onInsets);
      wa.onEvent("contentSafeAreaChanged", onInsets);
      setWebApp(wa);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const haptic = useCallback(
    (kind: "select" | "success" | "light" = "select") => {
      const h = webApp?.HapticFeedback;
      if (!h) return;
      if (kind === "select") h.selectionChanged();
      else if (kind === "success") h.notificationOccurred("success");
      else h.impactOccurred("light");
    },
    [webApp],
  );

  const openLink = useCallback(
    (url: string) => {
      if (webApp && /^https:\/\/t\.me\//.test(url)) webApp.openTelegramLink(url);
      else if (webApp) webApp.openLink(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    },
    [webApp],
  );

  const value = useMemo(() => ({ isMiniApp: !!webApp, webApp, haptic, openLink }), [webApp, haptic, openLink]);

  return (
    <TelegramContext.Provider value={value}>
      {children}
      {webApp && <TelegramBackButton webApp={webApp} />}
    </TelegramContext.Provider>
  );
}

/** System BackButton: visible everywhere except the home page, goes to the previous page. */
function TelegramBackButton({ webApp }: { webApp: TelegramWebApp }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const onBack = () => (window.history.length > 1 ? router.back() : router.push("/"));
    if (pathname === "/") webApp.BackButton.hide();
    else webApp.BackButton.show();
    webApp.BackButton.onClick(onBack);
    return () => webApp.BackButton.offClick(onBack);
  }, [pathname, router, webApp]);
  return null;
}

/**
 * Drives Telegram's MainButton (used on cart + checkout instead of our sticky button).
 * Returns true when the MainButton is in charge, so the page can hide its own button.
 */
export function useMainButton(opts: { text: string; onClick: () => void; enabled?: boolean; loading?: boolean; visible?: boolean }) {
  const { webApp } = useTelegram();
  const cb = useRef(opts.onClick);
  useEffect(() => {
    cb.current = opts.onClick;
  });
  const { text, enabled = true, loading = false, visible = true } = opts;

  useEffect(() => {
    if (!webApp) return;
    const mb = webApp.MainButton;
    const handler = () => cb.current();
    mb.onClick(handler);
    return () => {
      mb.offClick(handler);
      mb.hide();
    };
  }, [webApp]);

  useEffect(() => {
    if (!webApp) return;
    const mb = webApp.MainButton;
    mb.setParams({ text, color: INK, text_color: "#FFFFFF", is_active: enabled && !loading, is_visible: visible });
    if (loading) mb.showProgress(false);
    else mb.hideProgress();
  }, [webApp, text, enabled, loading, visible]);

  return !!webApp;
}
