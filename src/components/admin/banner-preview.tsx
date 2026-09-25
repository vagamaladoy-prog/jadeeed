import { Thumb } from "./ui";
import { cn } from "@/lib/cn";

/**
 * How the banner will look: desktop full-screen (16:9 shown) and phone full-screen (9:16, 360px mock).
 * Both use object-cover with a centred crop, exactly like the storefront.
 */
export function BannerPreview({
  desktop,
  mobile,
  alt,
  tone,
}: {
  desktop: string;
  mobile: string;
  alt: string;
  tone: "LIGHT" | "DARK";
}) {
  // LIGHT picture → dark header text; DARK picture → light header text
  const headerText = tone === "LIGHT" ? "text-ink" : "text-white";
  const phoneSrc = mobile || desktop;

  return (
    <div className="flex flex-col gap-6">
      <figure>
        <figcaption className="mb-2 text-body-sm text-muted">ПК — на весь экран (пример 16:9)</figcaption>
        <div className="relative aspect-video w-full overflow-hidden rounded border border-line bg-paper-2">
          {desktop ? (
            <Thumb src={desktop} alt={alt} className="absolute inset-0 size-full" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-body-sm text-muted">Нет картинки для ПК</span>
          )}
          <div className={cn("absolute inset-x-0 top-0 flex items-center justify-between px-[3%] py-[2%] text-micro font-medium", headerText)}>
            <span className="text-body-sm font-semibold tracking-tight">Jadeeed</span>
            <span className="hidden gap-4 sm:flex">
              <span>Katalog</span>
              <span>Savat</span>
            </span>
          </div>
        </div>
      </figure>

      <figure>
        <figcaption className="mb-2 text-body-sm text-muted">
          Телефон — весь экран (9:16){!mobile && desktop ? " (показана ПК-версия с обрезкой по центру)" : ""}
        </figcaption>
        <div className="w-full max-w-[360px] overflow-hidden rounded border border-line bg-white">
          <div className="relative aspect-9/16 w-full bg-paper-2">
            {phoneSrc ? (
              <Thumb src={phoneSrc} alt={alt} className="absolute inset-0 size-full" />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-body-sm text-muted">Нет картинки</span>
            )}
            <div className={cn("absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3", headerText)}>
              <span className="text-body-sm font-semibold tracking-tight">Jadeeed</span>
              <span className="text-micro">uz | ru</span>
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}
