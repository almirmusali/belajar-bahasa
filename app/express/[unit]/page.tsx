import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { UnitView, type MaterialGroup } from "@/components/express/unit-view";
import { getParticles, getRoots, getUnit, getUnits } from "@/lib/express";
import { renderMarkdown } from "@/lib/markdown";
import type { Unit } from "@/lib/express-types";

export function generateStaticParams() {
  return getUnits().map((u) => ({ unit: u.id }));
}

// Строка аффикса в данных корней записана по-человечески: «meN- (t выпадает)»,
// «ber- → be-», «peN- + -an». Юнит же просит «meN-» или «peN-…-an». Сводим обе
// записи к общему виду, иначе примеры к юниту не подберутся.
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[…\s+]/g, "")
    .trim();

function affixRank(affix: string, wanted: string): number {
  const head = affix.split("→")[0];
  const tokens = head.split("+").map(norm).filter(Boolean);
  if (norm(head) === wanted) return 0;
  if (tokens.length === 1 && tokens[0] === wanted) return 0;
  if (tokens.includes(wanted)) return 1;
  return 99;
}

function buildMaterial(unit: Unit): MaterialGroup[] {
  const groups: MaterialGroup[] = [];

  if (unit.track === "particles") {
    const { particles } = getParticles();
    for (const item of unit.items) {
      const p = particles.find((x) => x.id === item);
      if (!p) continue;
      for (const fn of p.functions) {
        groups.push({
          title: `${p.id} — ${fn.name_ru}`,
          items: fn.examples.map((ex) => ({
            id: ex.id,
            ru: ex.ru,
            note: ex.scene_ru,
          })),
        });
      }
    }
    return groups;
  }

  const { roots } = getRoots();
  for (const item of unit.items) {
    // Юнит про конкретные корни (A1) — показываем их семьи целиком.
    const asRoot = roots.find((r) => r.root === item);
    if (asRoot) {
      groups.push({
        title: `${asRoot.root} — ${asRoot.gloss_ru}`,
        items: asRoot.family.map((f) => ({
          id: f.example_id,
          ru: f.example_ru,
          note: `${f.form} — ${f.ru}${f.colloquial ? ` · разг. ${f.colloquial}` : ""}`,
        })),
      });
      continue;
    }
    // Юнит про аффикс — собираем живые примеры этого аффикса из всех семей.
    const wanted = norm(item);
    const hits = roots
      .flatMap((r) => r.family.map((f) => ({ f, rank: affixRank(f.affix, wanted) })))
      .filter((x) => x.rank < 99)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 8);
    if (hits.length) {
      groups.push({
        title: `${item} в живых примерах`,
        items: hits.map(({ f }) => ({
          id: f.example_id,
          ru: f.example_ru,
          note: `${f.form} — ${f.ru}${f.colloquial ? ` · разг. ${f.colloquial}` : ""}`,
        })),
      });
    }
  }
  return groups;
}

export default async function ExpressUnitPage({
  params,
}: {
  params: Promise<{ unit: string }>;
}) {
  const { unit: id } = await params;
  const unit = getUnit(id);
  if (!unit) notFound();

  const all = getUnits();
  const i = all.findIndex((u) => u.id === unit.id);
  const prev = all[i - 1];
  const next = all[i + 1];

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <UnitView
          unit={unit}
          theoryHtml={renderMarkdown(unit.theory_ru)}
          material={buildMaterial(unit)}
          prev={prev && { id: prev.id, title_ru: prev.title_ru }}
          next={next && { id: next.id, title_ru: next.title_ru }}
        />
      </main>
    </>
  );
}
