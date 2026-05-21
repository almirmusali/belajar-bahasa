"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Pause,
  Play,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Word } from "@/lib/vocab";
import { useLearned, useMounted } from "@/lib/use-learned";
import { cn } from "@/lib/utils";

type Direction = "id-to-ru" | "ru-to-id";
const SPEED_PRESETS = [
  { label: "1.5 c", value: 1.5 },
  { label: "3 c", value: 3 },
  { label: "5 c", value: 5 },
  { label: "8 c", value: 8 },
];

export function FlashcardPlayer({
  words,
  slug,
}: {
  words: Word[];
  slug: string;
}) {
  const mounted = useMounted();
  const { isLearned, mark, unmark, learnedForSet, clearSet } = useLearned();

  const [baseOrder, setBaseOrder] = useState<number[]>(() =>
    words.map((_, i) => i),
  );
  const [pos, setPos] = useState(0);
  const [side, setSide] = useState<0 | 1>(0);
  const [direction, setDirection] = useState<Direction>("id-to-ru");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [audioOn, setAudioOn] = useState(true);
  const [hideLearned, setHideLearned] = useState(true);

  const effectiveOrder = useMemo(() => {
    if (!mounted || !hideLearned) return baseOrder;
    return baseOrder.filter((i) => !isLearned(slug, words[i].id));
  }, [mounted, hideLearned, baseOrder, isLearned, slug, words]);

  useEffect(() => {
    if (effectiveOrder.length === 0) return;
    if (pos >= effectiveOrder.length) {
      setPos(0);
      setSide(0);
    }
  }, [effectiveOrder.length, pos]);

  const current = words[effectiveOrder[pos]];
  const learnedIds = learnedForSet(slug);
  const learnedCount = mounted ? learnedIds.length : 0;
  const totalCount = words.length;
  const currentIsLearned = current ? isLearned(slug, current.id) : false;

  const sideContent = useMemo(() => {
    if (!current) return { text: "", lang: "id" as const };
    if (direction === "id-to-ru") {
      return side === 0
        ? { text: current.id, lang: "id" as const, note: undefined }
        : { text: current.ru, lang: "ru" as const, note: current.note };
    }
    return side === 0
      ? { text: current.ru, lang: "ru" as const, note: current.note }
      : { text: current.id, lang: "id" as const, note: undefined };
  }, [current, side, direction]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(
      (v) => v.lang === "id-ID" || v.lang.startsWith("id"),
    );
    if (idVoice) u.voice = idVoice;
    window.speechSynthesis.speak(u);
  }, []);

  useEffect(() => {
    if (audioOn && sideContent.lang === "id" && sideContent.text) {
      speak(sideContent.text);
    }
  }, [pos, side, direction, audioOn, sideContent.lang, sideContent.text, speak]);

  const flip = useCallback(() => setSide((s) => (s === 0 ? 1 : 0)), []);
  const next = useCallback(() => {
    setSide(0);
    setPos((p) => (effectiveOrder.length === 0 ? 0 : (p + 1) % effectiveOrder.length));
  }, [effectiveOrder.length]);
  const prev = useCallback(() => {
    setSide(0);
    setPos((p) =>
      effectiveOrder.length === 0
        ? 0
        : (p - 1 + effectiveOrder.length) % effectiveOrder.length,
    );
  }, [effectiveOrder.length]);

  useEffect(() => {
    if (!playing || effectiveOrder.length === 0) return;
    const t = setTimeout(() => {
      if (side === 0) setSide(1);
      else {
        setSide(0);
        setPos((p) => (p + 1) % effectiveOrder.length);
      }
    }, speed * 1000);
    return () => clearTimeout(t);
  }, [playing, side, pos, speed, effectiveOrder.length]);

  const timerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = timerRef.current;
    if (!el) return;
    el.style.animation = "none";
    el.offsetHeight;
    if (playing) {
      el.style.animation = `flashcard-tick ${speed}s linear forwards`;
    }
  }, [playing, side, pos, speed]);

  const shuffle = () => {
    const next = [...baseOrder];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setBaseOrder(next);
    setPos(0);
    setSide(0);
  };

  const restart = () => {
    setBaseOrder(words.map((_, i) => i));
    setPos(0);
    setSide(0);
  };

  const handleKnow = () => {
    if (!current) return;
    mark(slug, current.id);
    setSide(0);
    if (hideLearned) {
      // current word disappears from filter; pos stays => next word slides in
      // useEffect clamps pos if it overflowed
    } else {
      next();
    }
  };

  const handleUnknow = () => {
    if (!current) return;
    unmark(slug, current.id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        flip();
      } else if (e.code === "ArrowRight") next();
      else if (e.code === "ArrowLeft") prev();
      else if (e.code === "KeyP") setPlaying((p) => !p);
      else if (e.code === "KeyK") handleKnow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, next, prev]); // eslint-disable-line react-hooks/exhaustive-deps

  if (totalCount === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        В этом наборе нет слов.
      </div>
    );
  }

  if (effectiveOrder.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-xl font-semibold">Все слова выучены!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} / {totalCount} помечены как «знаю».
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => clearSet(slug)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RotateCw className="h-4 w-4" /> Изучать снова
            </button>
            <button
              type="button"
              onClick={() => setHideLearned(false)}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-secondary"
            >
              <Eye className="h-4 w-4" /> Показать выученные
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <style>{`@keyframes flashcard-tick { from { width: 0% } to { width: 100% } }`}</style>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Прогресс:{" "}
          <span className="font-semibold text-foreground">
            {learnedCount} / {totalCount}
          </span>{" "}
          выучено
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded bg-secondary">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(learnedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={flip}
        className={cn(
          "group relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl border bg-card p-8 text-center shadow-sm transition hover:border-primary sm:min-h-[320px]",
          currentIsLearned && "border-emerald-500/50 bg-emerald-500/5",
        )}
      >
        <div className="absolute left-4 top-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {sideContent.lang === "id" ? "Индонезийский" : "Русский"}
        </div>
        <div className="absolute right-4 top-3 text-xs text-muted-foreground">
          {pos + 1} / {effectiveOrder.length}
        </div>

        <div className="flex flex-col items-center gap-2 px-4">
          <div
            className={cn(
              "text-balance text-3xl font-semibold leading-tight sm:text-4xl",
              sideContent.lang === "id" && "text-primary",
            )}
          >
            {sideContent.text}
          </div>
          {sideContent.note && (
            <div className="text-sm italic text-muted-foreground">
              {sideContent.note}
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-secondary">
          <div
            ref={timerRef}
            className="h-full bg-primary"
            style={{ width: "0%" }}
          />
        </div>

        {currentIsLearned && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="h-3 w-3" /> выучено
          </div>
        )}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <IconButton onClick={prev} title="Назад (←)">
          <SkipBack className="h-4 w-4" />
        </IconButton>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          {playing ? (
            <>
              <Pause className="h-4 w-4" /> Пауза
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Авто
            </>
          )}
        </button>
        <IconButton onClick={next} title="Вперёд (→)">
          <SkipForward className="h-4 w-4" />
        </IconButton>
        {currentIsLearned ? (
          <button
            type="button"
            onClick={handleUnknow}
            title="Убрать из выученных (K)"
            className="inline-flex items-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            <Undo2 className="h-4 w-4" /> Вернуть в учёбу
          </button>
        ) : (
          <button
            type="button"
            onClick={handleKnow}
            title="Я знаю это слово (K)"
            className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-400"
          >
            <Check className="h-4 w-4" /> Знаю
          </button>
        )}
        <IconButton onClick={flip} title="Перевернуть (пробел)">
          <RotateCw className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={shuffle} title="Перемешать">
          <Shuffle className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={() => speak(current.id)} title="Произнести">
          <Volume2 className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Скорость">
          <div className="flex flex-wrap gap-1">
            {SPEED_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setSpeed(p.value)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs transition",
                  speed === p.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-secondary",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={1}
            max={15}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <div className="text-xs text-muted-foreground">
            {speed.toFixed(1)} c на сторону
          </div>
        </Field>

        <Field label="Направление">
          <button
            type="button"
            onClick={() => {
              setDirection((d) => (d === "id-to-ru" ? "ru-to-id" : "id-to-ru"));
              setSide(0);
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {direction === "id-to-ru" ? "ID → RU" : "RU → ID"}
          </button>
          <div className="text-xs text-muted-foreground">
            Какая сторона первой
          </div>
        </Field>

        <Field label="Озвучка">
          <button
            type="button"
            onClick={() => setAudioOn((a) => !a)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            {audioOn ? (
              <>
                <Volume2 className="h-4 w-4" /> Вкл
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" /> Выкл
              </>
            )}
          </button>
          <div className="text-xs text-muted-foreground">
            Авто-произношение ID
          </div>
        </Field>

        <Field label="Выученные">
          <button
            type="button"
            onClick={() => setHideLearned((h) => !h)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            {hideLearned ? (
              <>
                <EyeOff className="h-4 w-4" /> Скрыты
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" /> Показаны
              </>
            )}
          </button>
          {learnedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Очистить «выучено» для этого набора? Прогресс сбросится.",
                  )
                ) {
                  clearSet(slug);
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" /> Сбросить ({learnedCount})
            </button>
          )}
        </Field>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <kbd className="rounded border px-1">Space</kbd> — переворот ·{" "}
        <kbd className="rounded border px-1">←</kbd>{" "}
        <kbd className="rounded border px-1">→</kbd> — между карточками ·{" "}
        <kbd className="rounded border px-1">P</kbd> — пауза ·{" "}
        <kbd className="rounded border px-1">K</kbd> — знаю
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background transition hover:bg-secondary"
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
