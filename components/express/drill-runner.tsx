"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { speak } from "@/lib/speak";
import { useExpressProgress } from "@/lib/use-express-progress";
import {
  DRILL_TITLE,
  isCorrect,
  type Drill,
} from "@/lib/express-types";

// Порядок вариантов перемешивается детерминированно — от id дрилла и номера
// захода. Иначе правильный ответ стоит там же, где его записали в данные,
// и через десяток вопросов выбор идёт по позиции, а не по смыслу.
function shuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  const next = () => {
    h = (h * 16807 + 12345) % 2147483647;
    return h / 2147483647;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Verdict = { ok: boolean; perField?: boolean[] };

export function DrillRunner({
  unitId,
  drills,
  passScore,
  isExam = false,
  title,
}: {
  unitId: string;
  drills: Drill[];
  passScore?: number;
  isExam?: boolean;
  title?: string;
}) {
  const { finishUnit, recordDrill, recordMen } = useExpressProgress();

  const [round, setRound] = useState(0);
  const [queue, setQueue] = useState<Drill[]>(drills);
  const [pos, setPos] = useState(0);
  const [given, setGiven] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState<number | null>(null);
  const startedAt = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const drill = queue[pos];
  const total = drills.length;
  const answered = Object.keys(firstTry).length;
  const score = Object.values(firstTry).filter(Boolean).length;
  const finished = pos >= queue.length;

  const options = useMemo(
    () => (drill?.options ? shuffle(drill.options, `${drill.id}:${round}`) : []),
    [drill, round],
  );

  // Сброс состояния карточки при переходе к следующему дриллу.
  useEffect(() => {
    if (!drill) return;
    setGiven("");
    setFields(new Array(drill.fields?.length ?? 0).fill(""));
    setVerdict(null);
    setRevealed(false);
    setLeft(drill.time_limit_sec ?? null);
    startedAt.current = Date.now();
    if (drill.mode === "input" || drill.mode === "fields") {
      // Фокус в поле, но без прокрутки: на телефоне иначе прыгает экран.
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [drill]);

  const commit = useCallback(
    (ok: boolean, perField?: boolean[]) => {
      if (!drill || verdict) return;
      setVerdict({ ok, perField });
      setFirstTry((prev) => (drill.id in prev ? prev : { ...prev, [drill.id]: ok }));
      recordDrill(drill.id, ok);
      if (drill.type === "men_drill") {
        recordMen(ok, Date.now() - startedAt.current);
      }
    },
    [drill, verdict, recordDrill, recordMen],
  );

  // Таймер механических дриллов. Истёк — засчитывается промах: смысл
  // упражнения в скорости, медленный правильный ответ здесь не считается.
  useEffect(() => {
    if (left === null || verdict || !drill) return;
    if (left <= 0) {
      commit(false);
      return;
    }
    const t = setTimeout(() => setLeft((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [left, verdict, drill, commit]);

  const check = () => {
    if (!drill || verdict) return;
    if (drill.mode === "fields") {
      const per = (drill.fields ?? []).map((f, i) =>
        isCorrect(fields[i] ?? "", f.answer, f.accept),
      );
      commit(per.every(Boolean), per);
    } else {
      commit(isCorrect(given, drill.answer ?? "", drill.accept));
    }
  };

  const next = () => {
    if (!drill) return;
    // Ошибся — дрилл уходит в конец очереди и вернётся. В счёт идёт
    // первый ответ, так что повтор не «дорисовывает» балл, а закрепляет.
    const wrong = verdict && !verdict.ok;
    setQueue((q) => (wrong ? [...q, drill] : q));
    setPos((p) => p + 1);
  };

  const restart = (onlyWrong: boolean) => {
    const base = onlyWrong ? drills.filter((d) => firstTry[d.id] === false) : drills;
    setQueue(base.length ? base : drills);
    setPos(0);
    setFirstTry({});
    setRound((r) => r + 1);
  };

  const passed = passScore ? score >= passScore : score >= Math.ceil(total * 0.8);
  const wrongCount = Object.values(firstTry).filter((v) => !v).length;

  // Итог фиксируется один раз, когда очередь опустела.
  const savedRef = useRef(false);
  useEffect(() => {
    if (finished && !savedRef.current && answered > 0) {
      savedRef.current = true;
      finishUnit(unitId, score, total, passed);
    }
    if (!finished) savedRef.current = false;
  }, [finished, answered, score, total, passed, unitId, finishUnit]);

  if (finished) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <div className="text-sm text-muted-foreground">
          {isExam ? "Зачёт пройден до конца" : "Дриллы пройдены"}
        </div>
        <div className="mt-2 text-4xl font-bold tabular-nums">
          {score} <span className="text-2xl text-muted-foreground">из {total}</span>
        </div>
        <div
          className={cn(
            "mt-2 text-sm font-medium",
            passed ? "text-emerald-600" : "text-amber-600",
          )}
        >
          {passScore
            ? passed
              ? `Порог ${passScore} взят`
              : `Порог ${passScore} не взят — стоит повторить`
            : passed
              ? "Уверенно"
              : "Есть что подтянуть"}
        </div>
        <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">
          Считается первый ответ на каждое задание. Те, где ошибся, возвращались
          в конец очереди, пока не были закрыты.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => restart(false)}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" /> Ещё раз
          </button>
          {wrongCount > 0 && (
            <button
              onClick={() => restart(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Только ошибки ({wrongCount})
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!drill) return null;

  const material = drill.audio ?? (drill.mode === "choice" ? drill.answer : undefined);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <span className="truncate">
          {title ? `${title} · ` : ""}
          {DRILL_TITLE[drill.type]}
        </span>
        <span className="shrink-0 tabular-nums">
          {answered} / {total}
          {queue.length > total && ` · +${queue.length - total} на повтор`}
        </span>
      </div>

      {left !== null && !verdict && (
        <div className="h-1 w-full bg-secondary">
          <div
            className={cn(
              "h-full transition-all duration-1000 ease-linear",
              left <= 2 ? "bg-red-500" : "bg-primary",
            )}
            style={{
              width: `${(left / (drill.time_limit_sec || 1)) * 100}%`,
            }}
          />
        </div>
      )}

      <div className="space-y-4 p-4 sm:p-5">
        {drill.prompt_ru && (
          <p className="text-[15px] leading-snug">{drill.prompt_ru}</p>
        )}
        {drill.prompt && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-4 py-3">
            <span className="font-mono text-lg font-semibold">{drill.prompt}</span>
            {left !== null && !verdict && (
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {left} с
              </span>
            )}
          </div>
        )}
        {drill.hint_ru && (
          <p className="text-xs text-muted-foreground">{drill.hint_ru}</p>
        )}

        {drill.mode === "choice" && (
          <div className="grid gap-2">
            {options.map((opt) => {
              const isAnswer = opt === drill.answer;
              const chosen = given === opt;
              return (
                <button
                  key={opt}
                  disabled={Boolean(verdict)}
                  onClick={() => {
                    setGiven(opt);
                    commit(opt === drill.answer);
                    if (opt === drill.answer && /^[A-Za-z]/.test(opt)) speak(opt);
                  }}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left text-[15px] transition",
                    !verdict && "hover:border-primary hover:bg-secondary/50",
                    verdict && isAnswer && "border-emerald-500 bg-emerald-500/10",
                    verdict && chosen && !isAnswer && "border-red-500 bg-red-500/10",
                    verdict && !isAnswer && !chosen && "opacity-50",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {drill.mode === "input" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={given}
              onChange={(e) => setGiven(e.target.value)}
              disabled={Boolean(verdict)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="ответ"
              className="min-w-0 flex-1 rounded-lg border bg-background px-4 py-3 text-[15px] outline-none focus:border-primary disabled:opacity-70"
            />
            {!verdict && (
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Проверить
              </button>
            )}
          </form>
        )}

        {drill.mode === "fields" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
            className="space-y-2"
          >
            {(drill.fields ?? []).map((f, i) => (
              <div key={f.label_ru} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-muted-foreground sm:w-44">
                  {f.label_ru}
                </span>
                <input
                  ref={i === 0 ? inputRef : undefined}
                  value={fields[i] ?? ""}
                  onChange={(e) =>
                    setFields((prev) => {
                      const n = [...prev];
                      n[i] = e.target.value;
                      return n;
                    })
                  }
                  disabled={Boolean(verdict)}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className={cn(
                    "min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-[15px] outline-none focus:border-primary disabled:opacity-70",
                    verdict?.perField?.[i] === true && "border-emerald-500",
                    verdict?.perField?.[i] === false && "border-red-500",
                  )}
                />
                {verdict && verdict.perField?.[i] === false && (
                  <span className="shrink-0 text-sm font-medium text-emerald-600">
                    {f.answer}
                  </span>
                )}
              </div>
            ))}
            {!verdict && (
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Проверить
              </button>
            )}
          </form>
        )}

        {drill.mode === "selfcheck" && (
          <div className="space-y-3">
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="w-full rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-secondary/50"
              >
                Сказал вслух — показать образец
              </button>
            ) : (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => speak(drill.answer ?? "")}
                    aria-label="Прослушать образец"
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <div className="font-medium">{drill.answer}</div>
                </div>
              </div>
            )}
            {revealed && !verdict && (
              <div className="flex gap-2">
                <button
                  onClick={() => commit(true)}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Сказал так же
                </button>
                <button
                  onClick={() => commit(false)}
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  Не получилось
                </button>
              </div>
            )}
          </div>
        )}

        {verdict && (
          <div className="space-y-3 border-t pt-4">
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                verdict.ok ? "text-emerald-600" : "text-red-600",
              )}
            >
              {verdict.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {verdict.ok
                ? "Верно"
                : left === 0
                  ? "Время вышло"
                  : "Мимо — вернётся в конце"}
            </div>

            {!verdict.ok && drill.mode !== "fields" && drill.answer && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
                <span className="text-sm text-muted-foreground">Правильно:</span>
                <span className="font-medium">{drill.answer}</span>
              </div>
            )}

            {drill.explain_ru && (
              <p className="text-sm text-muted-foreground">{drill.explain_ru}</p>
            )}

            {drill.speak_aloud && (
              <p className="text-xs text-muted-foreground">
                Произнеси вслух, прежде чем идти дальше — кнопка этого не заменит.
              </p>
            )}

            <div className="flex items-center gap-2">
              {material && /^[A-Za-z]/.test(material) && (
                <button
                  type="button"
                  onClick={() => speak(material)}
                  aria-label="Прослушать"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={next}
                autoFocus
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Дальше
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
