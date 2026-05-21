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
} from "lucide-react";
import type { Word } from "@/lib/vocab";
import { useLearned, useMounted } from "@/lib/use-learned";
import { cn } from "@/lib/utils";

type Direction = "id-to-tr" | "tr-to-id";
type SideKind = "id" | "tr";
type Lang = "id" | "en" | "ru";

const SPEED_PRESETS = [
  { label: "1.5 c", value: 1.5 },
  { label: "3 c", value: 3 },
  { label: "5 c", value: 5 },
  { label: "8 c", value: 8 },
];

const LANG_META: Record<Lang, { label: string; locale: string }> = {
  id: { label: "ID", locale: "id-ID" },
  en: { label: "EN", locale: "en-US" },
  ru: { label: "RU", locale: "ru-RU" },
};

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
  const [direction, setDirection] = useState<Direction>("id-to-tr");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [langs, setLangs] = useState<Lang[]>(["id", "en"]);
  const [hideLearned, setHideLearned] = useState(true);

  const langSet = useMemo(() => new Set(langs), [langs]);
  const toggleLang = (l: Lang) =>
    setLangs((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
    );

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

  const sideKind: SideKind = useMemo(() => {
    if (direction === "id-to-tr") return side === 0 ? "id" : "tr";
    return side === 0 ? "tr" : "id";
  }, [side, direction]);

  const speakChain = useCallback(
    (items: Array<{ text: string; locale: string }>) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;
      window.speechSynthesis.cancel();
      if (items.length === 0) return;
      const voices = window.speechSynthesis.getVoices();
      const queue = [...items];
      const playNext = () => {
        const item = queue.shift();
        if (!item) return;
        const u = new SpeechSynthesisUtterance(item.text);
        u.lang = item.locale;
        u.rate = 0.95;
        const prefix = item.locale.slice(0, 2);
        const voice = voices.find(
          (v) => v.lang === item.locale || v.lang.startsWith(prefix),
        );
        if (voice) u.voice = voice;
        u.onend = playNext;
        window.speechSynthesis.speak(u);
      };
      playNext();
    },
    [],
  );

  const speakOne = useCallback(
    (text: string, lang: Lang) => speakChain([{ text, locale: LANG_META[lang].locale }]),
    [speakChain],
  );

  useEffect(() => {
    if (langSet.size === 0 || !current) return;
    const chain: Array<{ text: string; locale: string }> = [];
    if (sideKind === "id") {
      if (langSet.has("id"))
        chain.push({ text: current.id, locale: LANG_META.id.locale });
    } else {
      if (langSet.has("en") && current.en)
        chain.push({ text: current.en, locale: LANG_META.en.locale });
      if (langSet.has("ru"))
        chain.push({ text: current.ru, locale: LANG_META.ru.locale });
    }
    speakChain(chain);
  }, [pos, side, direction, langSet, sideKind, current, speakChain]);

  const flip = useCallback(() => setSide((s) => (s === 0 ? 1 : 0)), []);
  const next = useCallback(() => {
    setSide(0);
    setPos((p) =>
      effectiveOrder.length === 0 ? 0 : (p + 1) % effectiveOrder.length,
    );
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
          {sideKind === "id" ? "Индонезийский" : "Перевод"}
        </div>
        <div className="absolute right-4 top-3 text-xs text-muted-foreground">
          {pos + 1} / {effectiveOrder.length}
        </div>

        <div className="flex flex-col items-center gap-2 px-4">
          {sideKind === "id" ? (
            <div className="text-balance text-3xl font-semibold leading-tight text-primary sm:text-4xl">
              {current.id}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {current.en ? (
                <div className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
                  {current.en}
                </div>
              ) : null}
              <div
                className={cn(
                  "text-balance leading-tight text-muted-foreground",
                  current.en
                    ? "text-base sm:text-lg"
                    : "text-2xl font-semibold text-foreground sm:text-3xl",
                )}
              >
                {current.ru}
              </div>
              {current.note && (
                <div className="text-xs italic text-muted-foreground/80">
                  {current.note}
                </div>
              )}
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
        <IconButton
          onClick={() => speakOne(current.id, "id")}
          title="Произнести по-индонезийски"
        >
          <span className="text-[10px] font-semibold">ID</span>
        </IconButton>
        {current.en && (
          <IconButton
            onClick={() => speakOne(current.en!, "en")}
            title="Произнести по-английски"
          >
            <span className="text-[10px] font-semibold">EN</span>
          </IconButton>
        )}
        <IconButton
          onClick={() => speakOne(current.ru, "ru")}
          title="Произнести по-русски"
        >
          <span className="text-[10px] font-semibold">RU</span>
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
              setDirection((d) => (d === "id-to-tr" ? "tr-to-id" : "id-to-tr"));
              setSide(0);
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {direction === "id-to-tr" ? "ID → перевод" : "перевод → ID"}
          </button>
          <div className="text-xs text-muted-foreground">
            Какая сторона первой
          </div>
        </Field>

        <Field label="Озвучка">
          <div className="flex flex-wrap gap-1">
            {(["id", "en", "ru"] as Lang[]).map((l) => {
              const active = langSet.has(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLang(l)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs font-semibold transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-secondary",
                  )}
                  title={LANG_META[l].locale}
                >
                  {LANG_META[l].label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setLangs(["id", "en", "ru"])}
              className="text-muted-foreground hover:text-foreground"
            >
              все
            </button>
            <button
              type="button"
              onClick={() => setLangs([])}
              className="text-muted-foreground hover:text-foreground"
            >
              выкл
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            {langSet.size === 0
              ? "Без авто-озвучки"
              : `Авто: ${langs.map((l) => LANG_META[l].label).join(" · ")}`}
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
