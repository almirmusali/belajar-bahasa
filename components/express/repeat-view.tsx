"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { DrillRunner } from "@/components/express/drill-runner";
import { useExpressProgress } from "@/lib/use-express-progress";
import type { Drill } from "@/lib/express-types";

const LIMIT = 25;

export function RepeatView({ drills }: { drills: Drill[] }) {
  const { progress, weakDrillIds } = useExpressProgress();
  const weak = weakDrillIds();

  // Порядок — от самых частых ошибок к редким; за один заход не больше
  // двадцати пяти, иначе повторение превращается в наказание.
  const queue = useMemo(() => {
    const byId = new Map(drills.map((d) => [d.id, d]));
    return weak
      .map((id) => byId.get(id))
      .filter((d): d is Drill => Boolean(d))
      .slice(0, LIMIT);
  }, [drills, weak]);

  const touched = Object.keys(progress.drills).length;

  return (
    <>
      <Link
        href="/express"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Экспресс
      </Link>

      <header className="mt-4 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Работа над ошибками
        </h1>
        <p className="mt-2 text-muted-foreground">
          Задания со всего модуля, где ошибок больше, чем верных ответов.
          Собираются сами по мере прохождения юнитов.
        </p>
      </header>

      <div className="mt-8">
        {queue.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Накопилось {weak.length}
              {weak.length > LIMIT && ` · берём первые ${LIMIT}`}. Ответишь верно
              — задание перестанет всплывать здесь.
            </p>
            <DrillRunner unitId="repeat" drills={queue} title="Повторение" />
          </>
        ) : (
          <div className="rounded-xl border bg-card p-10 text-center">
            <p className="text-lg font-medium">
              {touched ? "Ошибок не накопилось" : "Здесь пока пусто"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {touched
                ? "Всё, что решалось с ошибкой, уже закрыто верным ответом. Возвращайся после следующих юнитов."
                : "Пройди пару юнитов — сюда попадут задания, на которых споткнёшься."}
            </p>
            <Link
              href="/express"
              className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              К юнитам
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
