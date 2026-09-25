export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Absolute URL of a localized page ("/" + uz default, "/ru/..." for Russian). */
export function localeUrl(locale: string, path: string) {
  const p = path === "/" ? "" : path;
  return `${siteUrl()}${locale === "uz" ? p || "/" : `/ru${p}`}`;
}

/** hreflang alternates for a path (both languages + x-default). */
export function alternates(locale: string, path: string) {
  const p = path === "/" ? "" : path;
  return {
    canonical: locale === "uz" ? p || "/" : `/ru${p}`,
    languages: { uz: p || "/", ru: `/ru${p}`, "x-default": p || "/" },
  };
}
