"use client";

import Link from "next/link";
import { BookOpen, Check, Play, RotateCcw, Sparkles, Timer } from "lucide-react";
import { useExpressProgress } from "@/lib/use-express-progress";
import { TRACK_TITLE, type Track } from "@/lib/express-types";
import { cn } from "@/lib/utils";

export type UnitCard = {
  id: string;
  track: Track;
  kind: "unit" | "exam";
  week: number;
  day: number;
  order: number;
  title_ru: string;
  subtitle_ru?: string;
  bonus?: boolean;
  drills: number;
  pass_score?: number;
};

export function ExpressOverview({ units }: { units: UnitCard[] }) {
  const { progress } = useExpressProgress();

  const doneCount = units.filter((u) => progress.units[u.id]?.done).length;
  const started = units.filter((u) => progress.units[u.id]).length;
  const next = units.find((u) => !progress.units[u.id]?.done) ?? units[0];
  const men = progress.men;
  const menAvg = men.hits > 0 ? Math.round(men.totalMs / men.hits / 100) / 10 : null;

  const tracks: Track[] = ["particles", "affixes"];

  return (
    <>
      <section className="mx-auto max-w-2xl text-center">
        <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Экспресс · модуль 1
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Частицы и аффиксы
        </h1>
        <p className="mt-3 text-balance text-muted-foreground">
          Два блока с наибольшей отдачей во всём индонезийском. Частицы дают
          эффект «звучу как местный» быстрее, чем любые пятьсот слов. Аффиксы
          умножают словарь: один корень — от пяти до десяти слов.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/express/${next.id}`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Play className="h-4 w-4" />
            {started ? `Продолжить: ${next.id}` : "Начать с P1"}
          </Link>
          <Link
            href="/express/repeat"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" /> Работа над ошибками
          </Link>
          <Link
            href="/express/reference"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            <BookOpen className="h-4 w-4" /> Справочник
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={`${doneCount}`} label={`из ${units.length} юнитов закрыто`} />
        <Stat value={`${units.reduce((s, u) => s + u.drills, 0)}`} label="заданий в модуле" />
        <Stat
          value={menAvg ? `${menAvg} с` : "—"}
          label="средняя скорость meN-"
          icon={<Timer className="h-3.5 w-3.5" />}
        />
        <Stat
          value={men.attempts ? `${Math.round((men.hits / men.attempts) * 100)}%` : "—"}
          label="попаданий в механике"
        />
      </section>

      {tracks.map((track) => {
        const list = units.filter((u) => u.track === track);
        const weeks = [...new Set(list.map((u) => u.week))].sort((a, b) => a - b);
        return (
          <section key={track} className="mx-auto mt-12 max-w-4xl">
            <div className="flex items-baseline justify-between gap-4 border-b pb-3">
              <h2 className="text-xl font-semibold tracking-tight">
                {TRACK_TITLE[track]}
              </h2>
              <span className="text-sm text-muted-foreground">
                недели {Math.min(...weeks)}–{Math.max(...weeks)} · {list.length} юнитов
              </span>
            </div>
            {weeks.map((week) => (
              <div key={week} className="mt-6">
                <div className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Неделя {week}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {list
                    .filter((u) => u.week === week)
                    .map((u) => {
                      const r = progress.units[u.id];
                      return (
                        <Link
                          key={u.id}
                          href={`/express/${u.id}`}
                          className={cn(
                            "group rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-sm",
                            r?.done && "border-emerald-500/40",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-mono text-xs text-muted-foreground">
                              {u.id}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {u.bonus && (
                                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              {u.kind === "exam" && (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-600">
                                  зачёт
                                </span>
                              )}
                              {r?.done && (
                                <Check className="h-4 w-4 text-emerald-600" />
                              )}
                            </div>
                          </div>
                          <div className="mt-1 font-medium leading-snug group-hover:text-primary">
                            {u.title_ru}
                          </div>
                          {u.subtitle_ru && (
                            <div className="mt-1 text-sm text-muted-foreground">
                              {u.subtitle_ru}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-muted-foreground">
                            {u.drills} заданий
                            {r && ` · лучший ${r.score}/${r.total}`}
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <div className="flex items-center justify-center gap-1.5 text-2xl font-bold tabular-nums">
        {icon}
        {value}
      </div>
      <div className="mt-1 text-xs leading-tight text-muted-foreground">{label}</div>
    </div>
  );
}
