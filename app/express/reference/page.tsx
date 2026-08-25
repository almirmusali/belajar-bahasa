import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Phrase } from "@/components/phrase";
import { SpeakButton } from "@/components/speak-button";
import { getParticles, getRoots } from "@/lib/express";
import type { ParticleFunction } from "@/lib/express-types";

export const metadata = { title: "Экспресс — справочник" };

const POSITION_RU: Record<ParticleFunction["position"], string> = {
  initial: "начало",
  final: "конец",
  after_topic: "после темы",
  standalone: "отдельно",
  after_adjective: "после прилагательного",
  suffix: "суффикс",
};

export default function ReferencePage() {
  const { particles, ru_bridge_table, chunks, minimal_pairs } = getParticles();
  const { roots, register_pairs, in_pairs, men_rules, ktsp } = getRoots();

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/express"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Экспресс
        </Link>

        <header className="mt-4 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Справочник</h1>
          <p className="mt-2 text-muted-foreground">
            Всё, что в модуле разбиралось по юнитам, — одной страницей. Сюда
            заглядывают, когда нужно свериться, а не учиться.
          </p>
        </header>

        <Section title="Карта частиц" note="Приоритет 1 — учить первыми, 4 — сначала пассивно.">
          <Table head={["Частица", "Ход", "Позиция", "Приоритет"]}>
            {particles.map((p) => (
              <tr key={p.id} className="align-top">
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <SpeakButton text={p.id.replace("-", "")} />
                    <b>{p.id}</b>
                  </span>
                </Td>
                <Td>{p.move_ru}</Td>
                <Td className="text-muted-foreground">
                  {[...new Set(p.functions.map((f) => POSITION_RU[f.position]))].join(" / ")}
                </Td>
                <Td>{p.bonus ? "сверх модуля" : p.priority}</Td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section
          title="Мост из русского"
          note="Русское «же» уходит в три разные частицы. Различает не слово, а ход."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {ru_bridge_table.map((row) => (
              <Phrase key={row.id} id={row.id} ru={row.ru} note={row.particle} />
            ))}
          </div>
        </Section>

        <Section title="Связки" note="Учатся целиком, не разбираются на части.">
          <div className="grid gap-2 sm:grid-cols-2">
            {chunks.map((c) => (
              <Phrase key={c.id} id={c.id} ru={c.ru} />
            ))}
          </div>
        </Section>

        <Section title="Минимальные пары" note="Одна фраза, разные частицы — разные ситуации.">
          <div className="space-y-4">
            {minimal_pairs.map((pair) => (
              <div key={pair.base} className="rounded-xl border bg-card p-4">
                <div className="mb-3 text-sm font-medium">
                  {pair.base} — {pair.ru}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {pair.variants.map((v) => (
                    <Phrase key={v.id} id={v.id} ru={v.scene_ru} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Ошибки русскоязычного">
          <Table head={["Ошибка", "Правильно", "Причина"]}>
            {particles.flatMap((p) =>
              p.common_errors.map((e) => (
                <tr key={p.id + e.wrong} className="align-top">
                  <Td className="text-red-600 line-through decoration-red-600/40">
                    {e.wrong}
                  </Td>
                  <Td className="font-medium">{e.right}</Td>
                  <Td className="text-muted-foreground">{e.why_ru}</Td>
                </tr>
              )),
            )}
          </Table>
        </Section>

        <Section
          title="Механика meN-"
          note="Форма префикса по первому звуку корня, плюс правило выпадения KTSP."
        >
          <Table head={["Начало корня", "Форма", "Пример"]}>
            {men_rules.map((r) => (
              <tr key={r.start}>
                <Td>{r.start}</Td>
                <Td><b>{r.form}</b></Td>
                <Td className="font-mono text-xs">{r.example}</Td>
              </tr>
            ))}
          </Table>
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="text-sm font-medium text-primary">
              KTSP — k, t, s, p исчезают
            </div>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {ktsp.map((k) => (
                <div key={k.root} className="text-sm">
                  <span className="font-mono">{k.root}</span> →{" "}
                  <span className="font-mono font-semibold">{k.result}</span>{" "}
                  <span className="text-muted-foreground">· {k.note}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section
          title="Книжное ↔ разговорное"
          note="Левое узнавать, правое произносить."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <RegisterTable title="Сброс meN-" rows={register_pairs} />
            <RegisterTable title="Суффикс -in" rows={in_pairs} />
          </div>
        </Section>

        <Section
          title="Двадцать четыре корня"
          note="Отсортированы по продуктивности. Разверни корень — увидишь семью."
        >
          <div className="space-y-2">
            {[...roots]
              .sort((a, b) => b.productivity - a.productivity)
              .map((r) => (
                <details key={r.root} className="rounded-xl border bg-card p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="font-medium">
                      {r.root}{" "}
                      <span className="text-muted-foreground">— {r.gloss_ru}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.family.length} форм
                    </span>
                  </summary>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {r.family.map((f) => (
                      <Phrase
                        key={f.form}
                        id={f.example_id}
                        ru={f.example_ru}
                        note={`${f.form} · ${f.affix} · ${f.ru}${
                          f.colloquial ? ` · разг. ${f.colloquial}` : ""
                        }`}
                      />
                    ))}
                  </div>
                </details>
              ))}
          </div>
        </Section>
      </main>
    </>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-secondary/50">
            {head.map((h) => (
              <th key={h} className="border-b px-3 py-2 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`border-b px-3 py-2 ${className ?? ""}`}>{children}</td>;
}

function RegisterTable({
  title,
  rows,
}: {
  title: string;
  rows: { baku: string; colloquial: string; ru: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-secondary/50 px-3 py-2 text-sm font-semibold">
        {title}
      </div>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.baku + r.colloquial}>
              <td className="border-b px-3 py-2 text-muted-foreground">{r.baku}</td>
              <td className="border-b px-3 py-2 font-medium">{r.colloquial}</td>
              <td className="border-b px-3 py-2 text-xs text-muted-foreground">
                {r.ru}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
