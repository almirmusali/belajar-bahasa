"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Check, RotateCcw } from "lucide-react";
import {
  bookPercent,
  chapterFraction,
  clearBook,
  useBookProgress,
} from "@/lib/use-reading-progress";
import { cn } from "@/lib/utils";

// Прогресс чтения на страницах-обложках: полоса на карточке в библиотеке,
// полоса и кнопка «продолжить» на странице книги, отметки в оглавлении.
//
// Все три компонента рисуют одно и то же хранилище (lib/use-reading-progress)
// и до монтирования показывают «книга не начата»: localStorage на сервере нет,
// а расхождение разметки React ругался бы.

/** Тонкая полоса прогресса. */
function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-secondary", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Прочитано"
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
  );
}

/** Полоса на карточке книги в библиотеке. Не начата — ничего не рисуем. */
export function BookCardProgress({
  slug,
  weights,
}: {
  slug: string;
  weights: number[];
}) {
  const { progress, mounted } = useBookProgress(slug);
  const pct = bookPercent(progress, weights);
  if (!mounted || pct === 0) return null;

  return (
    <div className="mt-2.5 w-full">
      <Bar value={pct} />
      <p className="mt-1 text-[11px] text-muted-foreground">
        {pct >= 100
          ? "Дочитана"
          : `Прочитано ${pct}% · глава ${(progress?.chapter ?? 0) + 1}`}
      </p>
    </div>
  );
}

/** Кнопка «продолжить» и полоса прогресса на странице книги. */
export function ResumeReading({
  slug,
  chapters,
  weights,
}: {
  slug: string;
  chapters: number;
  weights: number[];
}) {
  const { progress, mounted } = useBookProgress(slug);
  const [confirmReset, setConfirmReset] = useState(false);
  const pct = bookPercent(progress, weights);
  const started = mounted && progress !== null;

  // Куда ведёт кнопка. Дочитанная глава — значит дальше следующая: возвращать
  // читателя в конец уже прочитанного бессмысленно.
  const last = started ? Math.min(Math.max(progress!.chapter, 0), chapters - 1) : 0;
  const done = chapterFraction(progress, last) >= 1;
  const at = pct >= 100 ? 0 : done && last + 1 < chapters ? last + 1 : last;
  const label = !started
    ? "Начать читать"
    : pct >= 100
      ? "Перечитать с начала"
      : `Продолжить — глава ${at + 1}`;

  return (
    <div className="mt-6">
      {started && pct > 0 && (
        <div className="mb-4 max-w-xs">
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span>{pct >= 100 ? "Книга дочитана" : "Прочитано"}</span>
            <span className="tabular-nums font-medium text-foreground">{pct}%</span>
          </div>
          <Bar value={pct} className="mt-1.5" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/reading/${slug}/${at}`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <BookOpen className="h-4 w-4" />
          {label}
        </Link>

        {started && pct > 0 && (
          <button
            type="button"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                return;
              }
              clearBook(slug);
              setConfirmReset(false);
            }}
            onBlur={() => setConfirmReset(false)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {confirmReset ? "Точно сбросить?" : "Сбросить прогресс"}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Отметка главы в оглавлении: галочка у дочитанной, полоса у начатой,
 * подпись «вы здесь» у той, где стоит закладка.
 */
export function ChapterMark({ slug, chapter }: { slug: string; chapter: number }) {
  const { progress, mounted } = useBookProgress(slug);
  if (!mounted || !progress) return null;

  const frac = chapterFraction(progress, chapter);
  // «Вы здесь» — только у главы, к которой стоит вернуться. У дочитанной
  // хватает галочки, иначе метка спорила бы с кнопкой «продолжить».
  const here = progress.chapter === chapter && frac < 1;
  if (frac === 0 && !here) return null;

  return (
    <span className="flex shrink-0 items-center gap-2">
      {here && (
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
          вы здесь
        </span>
      )}
      {frac >= 1 ? (
        <Check className="h-4 w-4 text-primary" aria-label="Глава дочитана" />
      ) : frac > 0 ? (
        <span className="w-8" title={`Прочитано ${Math.round(frac * 100)}%`}>
          <Bar value={Math.round(frac * 100)} />
        </span>
      ) : null}
    </span>
  );
}
