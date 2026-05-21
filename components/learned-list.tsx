"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Volume2, X } from "lucide-react";
import { useLearned, useMounted } from "@/lib/use-learned";
import type { VocabSet } from "@/lib/vocab";

export function LearnedList({ sets }: { sets: VocabSet[] }) {
  const mounted = useMounted();
  const { data, unmark, clearAll, clearSet } = useLearned();

  const groups = useMemo(() => {
    if (!mounted) return [];
    return sets
      .map((set) => {
        const ids = data[set.slug] ?? [];
        const words = set.words.filter((w) => ids.includes(w.id));
        return { set, words };
      })
      .filter((g) => g.words.length > 0);
  }, [mounted, sets, data]);

  const totalLearned = groups.reduce((s, g) => s + g.words.length, 0);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  if (!mounted) {
    return (
      <div className="mt-10 rounded-xl border bg-card p-10 text-center text-muted-foreground">
        Загружаем прогресс…
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="mt-10 rounded-xl border bg-card p-10 text-center">
        <p className="text-lg font-medium">Пока пусто</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Открой набор словаря и нажми «Знаю» на карточке — слово попадёт сюда.
        </p>
        <Link
          href="/vocab"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          К наборам
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <div className="text-sm">
            Всего выучено:{" "}
            <span className="font-semibold">{totalLearned}</span> слов в{" "}
            <span className="font-semibold">{groups.length}</span> наборах
          </div>
          <div className="text-xs text-muted-foreground">
            Прогресс хранится в этом браузере
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("Очистить весь прогресс «выучено»?")) clearAll();
          }}
          className="text-sm text-muted-foreground hover:text-destructive"
        >
          Очистить всё
        </button>
      </div>

      {groups.map(({ set, words }) => (
        <section key={set.slug} className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <Link
              href={`/vocab/${set.slug}`}
              className="text-lg font-semibold hover:text-primary"
            >
              {set.title}
            </Link>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{words.length} слов</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Сбросить прогресс «${set.title}»?`))
                    clearSet(set.slug);
                }}
                className="hover:text-destructive"
              >
                сбросить
              </button>
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {words.map((w) => (
              <li
                key={w.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <button
                  type="button"
                  onClick={() => speak(w.id)}
                  title="Произнести"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-secondary"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="font-medium leading-snug">{w.id}</div>
                  {w.en && (
                    <div className="text-sm leading-snug">{w.en}</div>
                  )}
                  <div className="text-sm text-muted-foreground leading-snug">
                    {w.ru}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => unmark(set.slug, w.id)}
                  title="Вернуть в учёбу"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
