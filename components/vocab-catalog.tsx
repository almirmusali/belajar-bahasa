"use client";

import Link from "next/link";
import { CheckCircle2, Library } from "lucide-react";
import { VocabProgress } from "@/components/vocab-progress";
import type { VocabSet } from "@/lib/vocab";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

function pluralizeRu(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export function VocabCatalog({ sets }: { sets: VocabSet[] }) {
  const { locale } = useLocale();

  const wordsLabel = (n: number) =>
    locale === "ru"
      ? pluralizeRu(n, ["слово", "слова", "слов"])
      : t(locale, "vocab_words");

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <section className="text-center">
        <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          {t(locale, "vocab_badge")}
        </span>
        <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight">
          {t(locale, "vocab_title")}
        </h1>
        <p className="mt-3 text-balance text-muted-foreground">
          {t(locale, "vocab_subtitle")}
        </p>
        <div className="mt-5 flex justify-center">
          <Link
            href="/vocab/learned"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm hover:bg-secondary"
          >
            <CheckCircle2 className="h-4 w-4 text-primary" />{" "}
            {t(locale, "vocab_learned_link")}
          </Link>
        </div>
      </section>

      {sets.length === 0 ? (
        <div className="mt-10 rounded-xl border bg-card p-10 text-center">
          <Library className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">{t(locale, "vocab_empty_title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(locale, "vocab_empty_subtitle")}
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {sets.map((s) => {
            const title = (locale === "id" && s.titleId) || s.title;
            const description =
              (locale === "id" && s.descriptionId) || s.description;
            return (
              <Link
                key={s.slug}
                href={`/vocab/${s.slug}`}
                className="group rounded-xl border bg-card p-5 transition hover:border-primary hover:shadow-sm"
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {s.words.length} {wordsLabel(s.words.length)}
                </div>
                <h2 className="mt-1 text-lg font-semibold group-hover:text-primary">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
                <VocabProgress slug={s.slug} total={s.words.length} />
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted-foreground">
        {t(locale, "vocab_add_hint")}{" "}
        <a
          href="https://github.com/almirmusali/belajar-bahasa/blob/main/data/vocab/README.md"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          {t(locale, "vocab_add_link")}
        </a>
      </p>
    </main>
  );
}
