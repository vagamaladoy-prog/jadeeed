"use client";
import { useId, useRef } from "react";
import { ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import { UPLOAD_ACCEPT } from "@/lib/admin/labels";
import { uploadAdminImage } from "@/lib/admin/actions/upload";
import { useUpload } from "./use-upload";
import { Thumb } from "./ui";
import { cn } from "@/lib/cn";

/** One image: upload / replace / remove. `aspect` is a Tailwind aspect class for the preview box. */
export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  aspect = "aspect-[4/5]",
  invalid,
  describedBy,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: "banners" | "categories" | "products";
  label: string;
  aspect?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, pending } = useUpload(uploadAdminImage, { folder });

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const [url] = await upload([files[0]]);
    if (inputRef.current) inputRef.current.value = "";
    if (url) onChange(url);
  };

  return (
    <div className="rounded has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-navy">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={UPLOAD_ACCEPT}
        className="sr-only"
        aria-describedby={describedBy}
        onChange={(e) => onFiles(e.target.files)}
      />
      {value ? (
        <div className="relative">
          <Thumb src={value} alt={label} className={cn("w-full rounded border border-line", aspect)} />
          {pending > 0 && (
            <div className="absolute inset-0 grid place-items-center bg-overlay text-white">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <span className="sr-only">Загрузка…</span>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <label
              htmlFor={id}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded border border-ink px-4 text-body-sm font-medium transition-colors duration-150 hover:bg-ink hover:text-white"
            >
              <RefreshCw className="size-4" aria-hidden />
              Заменить
            </label>
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex h-11 items-center gap-2 rounded px-4 text-body-sm text-muted transition-colors duration-150 hover:bg-paper-2 hover:text-ink"
            >
              <X className="size-4" aria-hidden />
              Убрать
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed bg-white p-4 text-center text-body-sm text-muted transition-colors duration-150 hover:border-ink hover:text-ink",
            invalid ? "border-ink" : "border-muted",
            aspect,
          )}
        >
          {pending > 0 ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <ImagePlus className="size-6" aria-hidden />}
          {pending > 0 ? "Загрузка…" : `Загрузить: ${label}`}
        </label>
      )}
    </div>
  );
}
