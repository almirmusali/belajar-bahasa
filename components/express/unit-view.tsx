"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Sparkles } from "lucide-react";
import { Phrase } from "@/components/phrase";
import { DrillRunner } from "@/components/express/drill-runner";
import { useExpressProgress } from "@/lib/use-express-progress";
import { TRACK_TITLE, type Unit } from "@/lib/express-types";
import { cn } from "@/lib/utils";

export type MaterialGroup = {
  title: string;
  items: { id: string; ru: string; note?: string }[];
};

export function UnitView({
  unit,
  theoryHtml,
  material,
  prev,
  next,
}: {
  unit: Unit;
  theoryHtml: string;
  material: MaterialGroup[];
  prev?: { id: string; title_ru: string };
  next?: { id: string; title_ru: string };
}) {
  const { progress } = useExpressProgress();
  const [checked, setChecked] = useState<boolean[]>(
    new Array(unit.checklist.length).fill(false),
  );
  const result = progress.units[unit.id];
  const isExam = unit.kind === "exam";

  return (
    <>
      <Link
        href="/express"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Все юниты
      </Link>

      <header className="mt-4 border-b pb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 font-medium uppercase tracking-wider",
              unit.track === "particles"
                ? "bg-primary/10 text-primary"
                : "bg-amber-500/10 text-amber-600",
            )}
          >
            {TRACK_TITLE[unit.track]}
          </span>
          <span className="text-muted-foreground">
            {unit.id} · неделя {unit.week}, день {unit.day}
          </span>
          {isExam && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium uppercase tracking-wider text-emerald-600">
              Зачёт
            </span>
          )}
          {unit.bonus && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" /> сверх модуля
            </span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {unit.title_ru}
        </h1>
        {unit.subtitle_ru && (
          <p className="mt-2 text-muted-foreground">{unit.subtitle_ru}</p>
        )}
        {result && (
          <p className="mt-3 text-sm text-muted-foreground">
            Лучший результат: <b className="text-foreground">{result.score}</b> из{" "}
            {result.total}
            {result.done && " · зачтено"}
          </p>
        )}
      </header>

      <article
        className="prose-zinc mt-8 space-y-3 leading-relaxed [&_code]:font-mono [&_p]:text-[15px]"
        dangerouslySetInnerHTML={{ __html: theoryHtml }}
      />

      {material.length > 0 && (
        <section className="mt-10 space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Материал</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Каждую фразу можно прослушать. Сцена под переводом — ситуация, в
              которой она уместна.
            </p>
          </div>
          {material.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {group.title}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.items.map((it) => (
                  <Phrase key={it.id + it.ru} id={it.id} ru={it.ru} note={it.note} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="mt-10 space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {isExam ? "Зачёт" : "Тренажёр"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isExam
              ? `${unit.drills.length} заданий, порог — ${unit.pass_score}. Ошибка возвращает задание в конец очереди, в счёт идёт первый ответ.`
              : `${unit.drills.length} заданий. Ошибся — задание вернётся в конце, пока не закроешь.`}
          </p>
        </div>
        <DrillRunner
          unitId={unit.id}
          drills={unit.drills}
          passScore={unit.pass_score}
          isExam={isExam}
        />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Чеклист</h2>
        <p className="text-sm text-muted-foreground">
          Юнит закрыт, когда это делается само — без подглядывания в таблицу.
        </p>
        <div className="space-y-2">
          {unit.checklist.map((line, i) => (
            <label
              key={line}
              className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={checked[i] ?? false}
                onChange={(e) =>
                  setChecked((prev) => {
                    const n = [...prev];
                    n[i] = e.target.checked;
                    return n;
                  })
                }
                className="mt-0.5 h-4 w-4 shrink-0 accent-current"
              />
              <span className={cn(checked[i] && "text-muted-foreground line-through")}>
                {line}
              </span>
            </label>
          ))}
        </div>
      </section>

      <nav className="mt-12 flex items-center justify-between gap-4 border-t pt-6 text-sm">
        {prev ? (
          <Link
            href={`/express/${prev.id}`}
            className="text-muted-foreground hover:text-foreground"
          >
            ← {prev.id}. {prev.title_ru}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/express/${next.id}`}
            className="text-right text-muted-foreground hover:text-foreground"
          >
            {next.id}. {next.title_ru} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
