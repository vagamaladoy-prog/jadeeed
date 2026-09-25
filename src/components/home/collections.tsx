"use client";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { tr, type CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Categories from the admin as large editorial photo tiles; the caption sits on a solid ink plate. */
export function Collections({ categories }: { categories: CategoryDTO[] }) {
  const locale = useLocale();
  const t = useTranslations("home");
  return (
    <Stagger className={cn("grid gap-3 md:gap-4", categories.length > 1 && "md:grid-cols-2", categories.length > 2 && "lg:grid-cols-3")}>
      {categories.map((c) => (
        <StaggerItem key={c.id}>
          <Link
            href={{ pathname: "/catalog", query: { category: c.slug } }}
            className="group relative block aspect-4/5 overflow-hidden rounded bg-ink-2 lg:aspect-square"
          >
            {c.image && (
              <Image
                src={c.image}
                alt=""
                fill
                unoptimized={c.image.endsWith(".svg")}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-[50%_20%] transition-transform duration-[var(--dur-scene)] ease-out group-hover:scale-104"
              />
            )}
            <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-4 rounded bg-ink px-5 py-4 text-white md:inset-x-4 md:bottom-4">
              <div>
                <p className="label text-on-ink-muted">Jadeeed / 26</p>
                <h3 className="mt-1 font-display text-heading font-light tracking-tight md:text-heading-lg">{tr(c.name, locale)}</h3>
                <p className="mt-1 text-body-sm text-on-ink-muted">{t("items", { count: c.productCount })}</p>
              </div>
              <ArrowUpRight className="mb-1 size-6 shrink-0 transition-transform duration-[var(--dur-hover)] group-hover:-translate-y-1 group-hover:translate-x-1" />
            </div>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
