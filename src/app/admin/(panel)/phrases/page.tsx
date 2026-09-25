import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_PHRASES } from "@/lib/data";
import { PHRASE_SLOT_LABELS, PHRASE_SLOTS } from "@/lib/admin/labels";
import { PageTitle, Panel } from "@/components/admin/ui";
import { PhrasesEditor } from "@/components/admin/phrases-editor";

export default async function PhrasesPage() {
  await requireAdmin();
  const phrases = await db.brandPhrase.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });

  // same rule as the storefront: for each slot, the first phrase (by sortOrder) that has it
  const summary = PHRASE_SLOTS.map((slot) => {
    const hit = phrases.find((p) => p.slots.includes(slot));
    return { slot, text: hit?.text ?? DEFAULT_PHRASES[slot], isDefault: !hit };
  });
  const marquee = phrases.filter((p) => p.inMarquee).map((p) => p.text);

  return (
    <>
      <PageTitle
        title="Фразы бренда"
        description="Фразы никогда не переводятся — одинаковые на обоих языках сайта. Если слот не занят, показывается фраза по умолчанию."
      />

      <Panel className="mb-6">
        <h2 className="border-b border-line px-4 py-3 text-subheading font-medium sm:px-6">Где какая фраза показывается</h2>
        <dl>
          {summary.map((s) => (
            <div key={s.slot} className="flex flex-col gap-1 border-b border-line px-4 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6 sm:px-6">
              <dt className="text-body-sm text-muted sm:w-80 sm:shrink-0">{PHRASE_SLOT_LABELS[s.slot]}</dt>
              <dd className="flex flex-wrap items-baseline gap-2">
                <span className="phrase text-subheading">{s.text}</span>
                {s.isDefault && <span className="text-micro text-muted">по умолчанию</span>}
              </dd>
            </div>
          ))}
          <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-6 sm:px-6">
            <dt className="text-body-sm text-muted sm:w-80 sm:shrink-0">Бегущая строка</dt>
            <dd className="phrase text-body">
              {marquee.length ? marquee.join("  ✦  ") : <span className="font-sans text-body-sm text-muted">все фразы по умолчанию</span>}
            </dd>
          </div>
        </dl>
      </Panel>

      <PhrasesEditor
        phrases={phrases.map((p) => ({
          id: p.id,
          values: { text: p.text, slots: p.slots, inMarquee: p.inMarquee, sortOrder: p.sortOrder },
          updatedAt: p.updatedAt.toISOString(),
        }))}
        nextSortOrder={(phrases.at(-1)?.sortOrder ?? -1) + 1}
      />
    </>
  );
}
