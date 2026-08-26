"use client";

import { useCallback, useEffect, useState } from "react";

// Прогресс «Экспресса» живёт в localStorage этого устройства — как свои наборы
// карточек. В Supabase не уходит: таблица lesson_progress хранит числовой
// lesson_id, а тут строковые юниты, и лезть в схему базы ради этого не стоит.

const KEY = "belajar:express:v1";
const EVENT = "belajar:express-changed";

export type UnitResult = {
  done: boolean;
  score: number;
  total: number;
  ts: number;
};

export type ExpressProgress = {
  units: Record<string, UnitResult>;
  // Отдельно от юнитов: по ним собирается режим «работа над ошибками».
  drills: Record<string, { right: number; wrong: number; ts: number }>;
  men: { attempts: number; hits: number; totalMs: number };
};

const EMPTY: ExpressProgress = { units: {}, drills: {}, men: { attempts: 0, hits: 0, totalMs: 0 } };

function read(): ExpressProgress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<ExpressProgress>;
    return {
      units: p.units ?? {},
      drills: p.drills ?? {},
      men: p.men ?? { attempts: 0, hits: 0, totalMs: 0 },
    };
  } catch {
    return EMPTY;
  }
}

function write(next: ExpressProgress) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function useExpressProgress() {
  const [progress, setProgress] = useState<ExpressProgress>(EMPTY);

  useEffect(() => {
    setProgress(read());
    const sync = () => setProgress(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const finishUnit = useCallback(
    (unitId: string, score: number, total: number, passed: boolean) => {
      const cur = read();
      const prev = cur.units[unitId];
      // Лучший результат не затирается более слабым повтором.
      const best = prev && prev.score >= score ? prev : { score, total, ts: Date.now(), done: false };
      cur.units[unitId] = { ...best, done: (prev?.done ?? false) || passed };
      write(cur);
    },
    [],
  );

  const recordDrill = useCallback((drillId: string, ok: boolean) => {
    const cur = read();
    const d = cur.drills[drillId] ?? { right: 0, wrong: 0, ts: 0 };
    if (ok) d.right += 1;
    else d.wrong += 1;
    d.ts = Date.now();
    cur.drills[drillId] = d;
    write(cur);
  }, []);

  const recordMen = useCallback((ok: boolean, ms: number) => {
    const cur = read();
    cur.men.attempts += 1;
    if (ok) {
      cur.men.hits += 1;
      cur.men.totalMs += ms;
    }
    write(cur);
  }, []);

  const reset = useCallback(() => write(EMPTY), []);

  // Дриллы, где ошибок больше, чем верных ответов, — материал для повторения.
  const weakDrillIds = useCallback(
    () =>
      Object.entries(progress.drills)
        .filter(([, s]) => s.wrong > 0 && s.wrong >= s.right)
        .sort((a, b) => b[1].wrong - a[1].wrong)
        .map(([id]) => id),
    [progress],
  );

  return { progress, finishUnit, recordDrill, recordMen, reset, weakDrillIds };
}
