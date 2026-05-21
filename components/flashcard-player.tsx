"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Pause,
  Play,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Word } from "@/lib/vocab";
import { cn } from "@/lib/utils";

type Direction = "id-to-ru" | "ru-to-id";
const SPEED_PRESETS = [
  { label: "1.5 c", value: 1.5 },
  { label: "3 c", value: 3 },
  { label: "5 c", value: 5 },
  { label: "8 c", value: 8 },
];

export function FlashcardPlayer({ words }: { words: Word[] }) {
  const [order, setOrder] = useState<number[]>(() => words.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [side, setSide] = useState<0 | 1>(0);
  const [direction, setDirection] = useState<Direction>("id-to-ru");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [audioOn, setAudioOn] = useState(true);

  const current = words[order[pos]];

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
    const idVoice = voices.find((v) => v.lang === "id-ID" || v.lang.startsWith("id"));
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
    setPos((p) => (p + 1) % order.length);
  }, [order.length]);
  const prev = useCallback(() => {
    setSide(0);
    setPos((p) => (p - 1 + order.length) % order.length);
  }, [order.length]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (side === 0) setSide(1);
      else {
        setSide(0);
        setPos((p) => (p + 1) % order.length);
      }
    }, speed * 1000);
    return () => clearTimeout(t);
  }, [playing, side, pos, speed, order.length]);

  const timerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = timerRef.current;
    if (!el) return;
    el.style.animation = "none";
    el.offsetHeight;
    if (playing) {
      el.style.animation = `flashcard-tick ${speed}s linear forwards`;
    } else {
      el.style.animation = "none";
    }
  }, [playing, side, pos, speed]);

  const shuffle = () => {
    const next = [...order];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
    setPos(0);
    setSide(0);
  };

  const restart = () => {
    setOrder(words.map((_, i) => i));
    setPos(0);
    setSide(0);
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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, next, prev]);

  if (!current) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        В этом наборе нет слов.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <style>{`@keyframes flashcard-tick { from { width: 0% } to { width: 100% } }`}</style>

      <button
        type="button"
        onClick={flip}
        className="group relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl border bg-card p-8 text-center shadow-sm transition hover:border-primary sm:min-h-[320px]"
      >
        <div className="absolute left-4 top-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {sideContent.lang === "id" ? "Индонезийский" : "Русский"}
        </div>
        <div className="absolute right-4 top-3 text-xs text-muted-foreground">
          {pos + 1} / {order.length}
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
            style={{ width: playing ? "0%" : "0%" }}
          />
        </div>
        <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-wider text-muted-foreground/70 opacity-0 transition group-hover:opacity-100">
          клик для переворота · пробел
        </div>
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
        <IconButton onClick={flip} title="Перевернуть (пробел)">
          <RotateCw className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={shuffle} title="Перемешать">
          <Shuffle className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={restart} title="Сбросить порядок">
          <RotateCw className="h-4 w-4 rotate-180" />
        </IconButton>
        <IconButton
          onClick={() => speak(current.id)}
          title="Произнести индонезийское слово"
        >
          <Volume2 className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
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
            {speed.toFixed(1)} c на каждую сторону
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
            Какую сторону показывать первой
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
                <Volume2 className="h-4 w-4" /> Включена
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" /> Выключена
              </>
            )}
          </button>
          <div className="text-xs text-muted-foreground">
            Авто-произношение индонезийских слов
          </div>
        </Field>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Горячие клавиши: <kbd className="rounded border px-1">Space</kbd> — переворот,
        <kbd className="ml-1 rounded border px-1">←</kbd>{" "}
        <kbd className="rounded border px-1">→</kbd> — между карточками,{" "}
        <kbd className="rounded border px-1">P</kbd> — пауза / плей
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
