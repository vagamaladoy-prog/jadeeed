"use client";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Check, Download, RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { hangerShape } from "@/components/home/wardrobe";
import { WARDROBE_SHOULDERS } from "@/components/home/wardrobe-shoulders";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";

export type TryOnGarment = { key: string; name: string; src: string; ratio: number };

const SHOW = 4;
const MAX_SIDE = 1280; // the photo is shrunk in the browser before upload
const POLL_MS = 3000;
const TIMEOUT_MS = 4 * 60_000;

type Phase =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "done"; url: string }
  | { kind: "error"; reason: "upload" | "failed" | "timeout" | "limit" };

type Photo = { data: string; w: number; h: number };

/** Reads a photo (EXIF rotation applied), shrinks it and returns it as a JPEG data: URL. */
async function shrink(file: File): Promise<Photo> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return { data: canvas.toDataURL("image/jpeg", 0.88), w, h };
}

export function TryOnView({ pool }: { pool: TryOnGarment[] }) {
  const t = useTranslations("tryOn");
  // 4 random shirts from the rail — picked after mount, so server and client HTML agree
  const [items, setItems] = useState<TryOnGarment[]>(() => pool.slice(0, SHOW));
  useEffect(() => {
    const a = [...pool];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one random pick per visit
    setItems(a.slice(0, SHOW));
  }, [pool]);

  const [picked, setPicked] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  const run = useRef(0);
  const garment = items.find((g) => g.key === picked) ?? null;

  useEffect(() => () => void run.current++, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto(await shrink(file));
      setPhase({ kind: "idle" });
    } catch {
      setPhase({ kind: "error", reason: "upload" });
    }
  };

  const start = async () => {
    if (!garment || !photo) return;
    const my = ++run.current;
    setPhase({ kind: "working" });
    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ garment: garment.key, photo: photo.data, width: photo.w, height: photo.h }),
      });
      if (res.status === 429) return setPhase({ kind: "error", reason: "limit" });
      const { id } = (await res.json()) as { id?: string };
      if (!res.ok || !id) throw new Error("start");
      for (let n = 0; n < TIMEOUT_MS / POLL_MS; n++) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (run.current !== my) return;
        const s = (await fetch(`/api/try-on/${id}`, { cache: "no-store" }).then((r) => r.json())) as {
          status: string;
          url?: string;
        };
        if (run.current !== my) return;
        if (s.status === "done" && s.url) return setPhase({ kind: "done", url: s.url });
        if (s.status === "failed") return setPhase({ kind: "error", reason: "failed" });
      }
      setPhase({ kind: "error", reason: "timeout" });
    } catch {
      if (run.current === my) setPhase({ kind: "error", reason: "failed" });
    }
  };

  const reset = () => {
    run.current++;
    setPhase({ kind: "idle" });
  };

  const working = phase.kind === "working";

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      {/* 1 — pick a shirt */}
      <section>
        <h2 className="label mb-5 text-muted">1 · {t("pick")}</h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {items.map((g) => {
            const on = g.key === picked;
            return (
              <button
                key={g.key}
                type="button"
                disabled={working}
                onClick={() => setPicked(g.key)}
                aria-pressed={on}
                className={cn(
                  "group relative flex flex-col items-center rounded-[22px] border px-3 pb-4 pt-3 text-left transition-[border-color,background-color,box-shadow] duration-[var(--dur-hover)]",
                  on ? "border-anor bg-white/70 shadow-[0_14px_30px_-18px_rgb(20_16_18/0.5)]" : "border-ink/10 bg-paper-2/60 hover:border-ink/30",
                )}
              >
                <HangingShirt g={g} />
                <span className="mt-3 w-full truncate text-center text-body-sm font-medium">{g.name}</span>
                <AnimatePresence>
                  {on && (
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-pill bg-anor text-white"
                    >
                      <Check className="size-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2 — your photo, 3 — result */}
      <section className="flex flex-col">
        <h2 className="label mb-5 text-muted">2 · {t("upload")}</h2>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="relative overflow-hidden rounded-[26px] border border-ink/10 bg-paper-2/60">
          {phase.kind === "done" ? (
            <div className="grid grid-cols-2">
              <figure className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL */}
                <img src={photo!.data} alt={t("before")} className="w-full object-cover" style={{ aspectRatio: `${photo!.w} / ${photo!.h}` }} />
                <figcaption className="absolute left-2 top-2 rounded-pill bg-ink/60 px-2.5 py-1 text-caption text-white">{t("before")}</figcaption>
              </figure>
              <figure className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated image on ModelScope's storage */}
                <img src={phase.url} alt={t("after")} className="w-full object-cover" style={{ aspectRatio: `${photo!.w} / ${photo!.h}` }} />
                <figcaption className="absolute left-2 top-2 rounded-pill bg-anor px-2.5 py-1 text-caption text-white">{t("after")}</figcaption>
              </figure>
            </div>
          ) : photo ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL */}
              <img src={photo.data} alt={t("yourPhoto")} className={cn("max-h-[70vh] w-full object-contain transition-[filter] duration-500", working && "blur-[2px] brightness-90")} />
              {working && <Scan label={t("working")} />}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 p-8 text-center text-muted transition-colors hover:text-ink"
            >
              <span className="glass grid size-16 place-items-center rounded-pill text-ink">
                <Camera className="size-7" />
              </span>
              <span className="text-body font-medium text-ink">{t("uploadCta")}</span>
              <span className="max-w-xs text-body-sm">{t("uploadHint")}</span>
            </button>
          )}
        </div>

        {phase.kind === "error" && <p className="mt-4 text-body-sm text-anor">{t(`error.${phase.reason}`)}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          {phase.kind === "done" ? (
            <>
              <Button asChild variant="primary" size="lg">
                <a href={phase.url} target="_blank" rel="noopener noreferrer" download>
                  <Download /> {t("save")}
                </a>
              </Button>
              <Button variant="outline" size="lg" onClick={reset}>
                <RotateCcw /> {t("again")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" size="lg" disabled={!garment || !photo || working} onClick={start} className="flex-1">
                <Sparkles /> {working ? t("working") : garment ? t("go", { name: garment.name }) : t("pickFirst")}
              </Button>
              {photo && (
                <Button variant="outline" size="lg" disabled={working} onClick={() => fileRef.current?.click()}>
                  <Camera /> {t("change")}
                </Button>
              )}
            </>
          )}
        </div>
        <p className="mt-4 text-caption text-muted">{t("privacy")}</p>
      </section>
    </div>
  );
}

/** The front shot on its wooden hanger and steel hook — the same hanger as on the wardrobe rail. */
function HangingShirt({ g }: { g: TryOnGarment }) {
  const id = "th" + useId().replace(/[^\w-]/g, "");
  const H = 170;
  const W = Math.round(H * g.ratio);
  const HOOK = 26;
  const top = WARDROBE_SHOULDERS[g.key];
  const hanger = top ? hangerShape(top, W, H) : null;
  const c = W / 2;
  const s = H / 300;
  const nw = 7 * s;
  return (
    <span className="wardrobe-sway pointer-events-none relative block origin-top" style={{ width: W, height: HOOK + H, animationDuration: "5s" }}>
      <svg aria-hidden width="20" height={HOOK} viewBox={`0 0 20 ${HOOK}`} className="absolute left-1/2 top-0 -translate-x-1/2">
        <path d={`M10 ${HOOK - 4} V10 a5 5 0 1 0 -5 -5`} fill="none" stroke="#6f747b" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="absolute left-0 block" style={{ top: HOOK - 6, width: W, height: H }}>
        {hanger && (
          <svg aria-hidden width={W} height={Math.ceil(hanger.bottom)} viewBox={`0 0 ${W} ${Math.ceil(hanger.bottom)}`} className="absolute left-0 top-0 overflow-visible">
            <defs>
              <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#a8733f" />
                <stop offset="0.55" stopColor="#7d4f2a" />
                <stop offset="1" stopColor="#5a371c" />
              </linearGradient>
            </defs>
            <path d={hanger.shape} fill={`url(#${id}w)`} stroke="#4a2c15" strokeWidth={0.8} strokeLinejoin="round" />
            <path
              d={`M${c - nw} ${-6 * s} H${c + nw} L${c + nw * 1.6} ${10 * s} H${c - nw * 1.6} Z`}
              fill={`url(#${id}w)`}
              stroke="#4a2c15"
              strokeWidth={0.8}
            />
          </svg>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- transparent cut-out, already sized */}
        <img src={g.src} alt="" width={W} height={H} draggable={false} className="absolute left-0 top-0 h-full w-full drop-shadow-[0_10px_14px_rgb(11_11_12/0.18)]" />
      </span>
    </span>
  );
}

/** A soft light sweeping over the photo while the AI works. */
function Scan({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.span
        aria-hidden
        className="absolute inset-x-0 h-1/3 bg-linear-to-b from-transparent via-white/45 to-transparent"
        initial={{ top: "-33%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <span role="status" className="glass-dark relative rounded-pill px-5 py-2.5 text-body-sm font-medium text-white">
        {label}
      </span>
    </div>
  );
}
