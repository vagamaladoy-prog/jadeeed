"use client";
import { useLocale, useTranslations } from "next-intl";
import { Sheet } from "@/components/ui/sheet";
import { ExternalLink } from "@/components/contact/external-link";
import { useDesktop } from "@/hooks/use-media";
import { tr, type SizeChartDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

export function SizeChartSheet({
  open,
  onOpenChange,
  chart,
  supportUrl,
  highlight,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  chart: SizeChartDTO | null;
  supportUrl: string;
  highlight?: string | null;
}) {
  const t = useTranslations("sizeChart");
  const locale = useLocale();
  const desktop = useDesktop();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("title")} side={desktop ? "right" : "bottom"}>
      {chart && chart.rows.length > 0 ? (
        <div className="flex flex-col gap-4">
          <table className="w-full border-collapse text-left text-body-sm tabular-nums">
            <caption className="sr-only">{t("title")}</caption>
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="py-3 pr-2 font-medium">{t("size")}</th>
                <th scope="col" className="py-3 pr-2 font-medium">{t("width")}, {t("unit")}</th>
                <th scope="col" className="py-3 pr-2 font-medium">{t("length")}, {t("unit")}</th>
                <th scope="col" className="py-3 font-medium">{t("sleeve")}, {t("unit")}</th>
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((r) => (
                <tr key={r.size} className={cn("border-b border-line", highlight === r.size && "bg-navy text-white")}>
                  <th scope="row" className="py-3 pl-2 pr-2 font-medium">{r.size}</th>
                  <td className="py-3 pr-2">{r.width ?? "—"}</td>
                  <td className="py-3 pr-2">{r.length ?? "—"}</td>
                  <td className="py-3 pr-2">{r.sleeve ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {chart.note && <p className="text-body-sm text-muted">{tr(chart.note, locale)}</p>}
        </div>
      ) : (
        <p className="py-6 text-body text-muted">{t("empty")}</p>
      )}
      <ExternalLink href={supportUrl} className="mt-6 flex min-h-11 items-center text-body-sm text-navy underline underline-offset-4">
        {t("notFit")}
      </ExternalLink>
    </Sheet>
  );
}
