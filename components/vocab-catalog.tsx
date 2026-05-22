"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, Library } from "lucide-react";
import { VocabProgress } from "@/components/vocab-progress";
import type { VocabSet } from "@/lib/vocab";
import { useLocale } from "@/lib/use-locale";
import { useLearned, useMounted } from "@/lib/use-learned";
import { useSetState } from "@/lib/use-set-state";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function pluralizeRu(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export function VocabCatalog({ sets }: { sets: VocabSet[] }) {
  const { locale } = useLocale();
  const mounted = useMounted();
  const { data: learned } = useLearned();
  const { data: setStateData } = useSetState();

  const wordsLabel = (n: number) =>
    locale === "ru"
      ? pluralizeRu(n, ["слово", "слова", "слов"])
      : t(locale, "vocab_words");

  // Сортировка: недавно открытые сверху, выученные на 100% — вниз
  const sortedSets = useMemo(() => {
    if (!mounted) return sets;
    return [...sets].sort((a, b) => {
      const aLearned = (learned[a.slug] ?? []).length;
      const bLearned = (learned[b.slug] ?? []).length;
      const aDone = aLearned >= a.words.length && a.words.length > 0;
      const bDone = bLearned >= b.words.length && b.words.length > 0;
      // Полностью выученные — в конец
      if (aDone !== bDone) return aDone ? 1 : -1;
      // Недавно открытые — наверх (большее lastOpenedAt раньше)
      const aOpened = setStateData[a.slug]?.lastOpenedAt ?? 0;
      const bOpened = setStateData[b.slug]?.lastOpenedAt ?? 0;
      if (aOpened !== bOpened) return bOpened - aOpened;
      // Иначе по заголовку
      return a.title.localeCompare(b.title, locale === "ru" ? "ru" : "id");
    });
  }, [sets, learned, setStateData, mounted, locale]);

  const firstNotOpenedIndex = useMemo(() => {
    if (!mounted) return -1;
    return sortedSets.findIndex(
      (s) => (setStateData[s.slug]?.lastOpenedAt ?? 0) === 0,
    );
  }, [sortedSets, setStateData, mounted]);

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
          {sortedSets.map((s, i) => {
            const title = (locale === "id" && s.titleId) || s.title;
            const description =
              (locale === "id" && s.descriptionId) || s.description;
            const lastOpened = setStateData[s.slug]?.lastOpenedAt ?? 0;
            const learnedCount = (learned[s.slug] ?? []).length;
            const isActive =
              mounted && lastOpened > 0 && learnedCount < s.words.length;
            return (
              <Link
                key={s.slug}
                href={`/vocab/${s.slug}`}
                className={cn(
                  "group rounded-xl border bg-card p-5 transition hover:shadow-sm",
                  isActive
                    ? "border-primary/40 hover:border-primary"
                    : "hover:border-primary",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    {s.words.length} {wordsLabel(s.words.length)}
                  </div>
                  {isActive && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                      {locale === "ru" ? "продолжить" : "lanjutkan"}
                    </span>
                  )}
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
