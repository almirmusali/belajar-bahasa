import Link from "next/link";
import { CheckCircle2, Library } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VocabProgress } from "@/components/vocab-progress";
import { getAllVocabSets } from "@/lib/vocab";

export default function VocabIndexPage() {
  const sets = getAllVocabSets();

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <section className="text-center">
          <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            Словарь
          </span>
          <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight">
            Карточки со словами
          </h1>
          <p className="mt-3 text-balance text-muted-foreground">
            Quizlet-стиль: выбери набор, нажми «Авто» и слова сами листаются с
            озвучкой. Скорость и направление настраиваются.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              href="/vocab/learned"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm hover:bg-secondary"
            >
              <CheckCircle2 className="h-4 w-4 text-primary" /> Выученные слова
            </Link>
          </div>
        </section>

        {sets.length === 0 ? (
          <div className="mt-10 rounded-xl border bg-card p-10 text-center">
            <Library className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Нет ни одного набора</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Добавь папку в <code className="rounded bg-secondary px-1">data/vocab/</code> —
              формат описан в README.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {sets.map((s) => (
              <Link
                key={s.slug}
                href={`/vocab/${s.slug}`}
                className="group rounded-xl border bg-card p-5 transition hover:border-primary hover:shadow-sm"
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {s.words.length} {pluralize(s.words.length, ["слово", "слова", "слов"])}
                </div>
                <h2 className="mt-1 text-lg font-semibold group-hover:text-primary">
                  {s.title}
                </h2>
                {s.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                )}
                <VocabProgress slug={s.slug} total={s.words.length} />
              </Link>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Хочешь добавить свой набор?{" "}
          <a
            href="https://github.com/almirmusali/belajar-bahasa/blob/main/data/vocab/README.md"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            Инструкция в репозитории
          </a>
        </p>
      </main>
    </>
  );
}

function pluralize(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
