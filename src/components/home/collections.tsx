"use client";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { tr, type CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Categories from the admin, as large editorial tiles. */
export function Collections({ categories }: { categories: CategoryDTO[] }) {
  const locale = useLocale();
  const t = useTranslations("home");
  return (
    <Stagger className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
      {categories.map((c, i) => (
        <StaggerItem key={c.id} className={cn(categories.length === 3 && i === 0 && "col-span-2 lg:col-span-2")}>
          <Link
            href={{ pathname: "/catalog", query: { category: c.slug } }}
            className="group relative block overflow-hidden rounded bg-paper-2"
          >
            <div className={cn("relative", categories.length === 3 && i === 0 ? "aspect-8/5 lg:aspect-8/5" : "aspect-4/5")}>
              {c.image && (
                <Image
                  src={c.image}
                  alt=""
                  fill
                  unoptimized={c.image.endsWith(".svg")}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-[var(--dur-scene)] ease-out group-hover:scale-104"
                />
              )}
            </div>
            <div className="flex items-end justify-between gap-2 bg-paper px-1 pt-3">
              <div>
                <h3 className="font-display text-subheading font-light tracking-tight md:text-heading">{tr(c.name, locale)}</h3>
                <p className="text-body-sm text-muted">{t("items", { count: c.productCount })}</p>
              </div>
              <span className="mb-1 h-0.5 w-8 origin-left bg-navy transition-transform duration-[var(--dur-in)] ease-out group-hover:scale-x-150" aria-hidden />
            </div>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
