"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Pause,
  Play,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import type { Word } from "@/lib/vocab";
import { useLearned, useMounted } from "@/lib/use-learned";
import { useActivity } from "@/lib/use-activity";
import { useSetState, readSetState } from "@/lib/use-set-state";
import { useLocale } from "@/lib/use-locale";
import { t, tf } from "@/lib/i18n";
import { audioUrl } from "@/lib/audio-url";
import {
  SILENCE_URL,
  playUrl,
  setMediaSessionHandlers,
  setMediaSessionMetadata,
  setMediaSessionPlaying,
  stopAudioElement,
  unlockAudio,
} from "@/lib/audio-element";
import { cn } from "@/lib/utils";

type Direction = "target-first" | "translation-first";
type SideKind = "target" | "translation";
type Lang = "id" | "en" | "ru";

const SPEED_PRESETS = [
  { label: "1.5", value: 1.5 },
  { label: "3", value: 3 },
  { label: "5", value: 5 },
  { label: "8", value: 8 },
];

const LANG_META: Record<Lang, { label: string; locale: string }> = {
  id: { label: "ID", locale: "id-ID" },
  en: { label: "EN", locale: "en-US" },
  ru: { label: "RU", locale: "ru-RU" },
};

function textFor(word: Word, lang: Lang): string | undefined {
  if (lang === "id") return word.id;
  if (lang === "en") return word.en;
  return word.ru;
}

export function FlashcardPlayer({
  words,
  slug,
}: {
  words: Word[];
  slug: string;
}) {
  const mounted = useMounted();
  const { locale } = useLocale();
  const { isLearned, mark, unmark, learnedForSet, clearSet } = useLearned();
  const { addCard } = useActivity();
  const { touch, setLastWord } = useSetState();

  // Какой язык - целевой (изучаемый), какой - родной (помощник)
  const target: Lang = locale === "ru" ? "id" : "ru";
  const native: Lang = locale === "ru" ? "ru" : "id";

  const [baseOrder, setBaseOrder] = useState<number[]>(() =>
    words.map((_, i) => i),
  );
  // Инициализируем pos значением, восстановленным из localStorage синхронно,
  // чтобы избежать вспышки «карточка 1 → потом прыжок на сохранённую»
  const [pos, setPos] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const store = readSetState();
      const lastWordId = store[slug]?.lastWordId;
      if (!lastWordId) return 0;
      const idx = words.findIndex((w) => w.id === lastWordId);
      return idx >= 0 ? idx : 0;
    } catch {
      return 0;
    }
  });
  const [side, setSide] = useState<0 | 1>(0);
  const [direction, setDirection] = useState<Direction>("target-first");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  // По умолчанию озвучиваются все три языка: на стороне цели — сама цель,
  // на стороне перевода — оба перевода (английский и родной). Раньше родной
  // язык был выключен, и перевод звучал только по-английски.
  const [langs, setLangs] = useState<Lang[]>(() =>
    locale === "ru" ? ["id", "en", "ru"] : ["ru", "en", "id"],
  );
  const [hideLearned, setHideLearned] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [swipeDx, setSwipeDx] = useState(0);
  const [swipeDy, setSwipeDy] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  const pointerStart = useRef<{ x: number; y: number; id: number } | null>(
    null,
  );
  const swipedRef = useRef(false);

  // При переключении языка интерфейса обновляем дефолтные чипы озвучки
  useEffect(() => {
    setLangs(locale === "ru" ? ["id", "en", "ru"] : ["ru", "en", "id"]);
    setSide(0);
  }, [locale]);

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

  // Считаем просмотры карточек и сохраняем последнее открытое слово
  const seenIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (current?.id && current.id !== seenIdRef.current) {
      seenIdRef.current = current.id;
      addCard();
      setLastWord(slug, current.id);
    }
  }, [current?.id, addCard, setLastWord, slug]);

  // Touch lastOpenedAt при монтировании (даже если пользователь не двигал карточки)
  useEffect(() => {
    touch(slug);
  }, [slug, touch]);

  const learnedIds = learnedForSet(slug);
  const learnedCount = mounted ? learnedIds.length : 0;
  const totalCount = words.length;
  const currentIsLearned = current ? isLearned(slug, current.id) : false;

  const sideKind: SideKind = useMemo(() => {
    if (direction === "target-first")
      return side === 0 ? "target" : "translation";
    return side === 0 ? "translation" : "target";
  }, [side, direction]);

  const chainTokenRef = useRef(0);
  // Асинхронные обработчики озвучки живут дольше рендера, поэтому актуальные
  // значения читаются через ref, а не из замыкания.
  const playingRef = useRef(false);
  const sideRef = useRef(0);

  // Снимок всего, что нужно озвучке. Фоновая петля (см. runHiddenLoop) живёт
  // вне ререндера, поэтому читает данные отсюда, а не из замыкания.
  const cfgRef = useRef({
    words,
    order: effectiveOrder,
    langs,
    target,
    native,
    direction,
  });
  useEffect(() => {
    cfgRef.current = {
      words,
      order: effectiveOrder,
      langs,
      target,
      native,
      direction,
    };
  }, [words, effectiveOrder, langs, target, native, direction]);

  const stateRef = useRef<{ pos: number; side: 0 | 1 }>({ pos, side });
  const loopTokenRef = useRef(0);
  const loopActiveRef = useRef(false);
  useEffect(() => {
    // Пока идёт фоновая петля, позиция ведётся ею: ререндер в фоне может
    // прийти с опозданием и откатить ref назад.
    if (!loopActiveRef.current) stateRef.current = { pos, side };
  }, [pos, side]);

  // Что звучит на такой-то карточке и стороне. Одна и та же логика нужна и
  // эффекту (страница на экране), и фоновой петле.
  function itemsAt(p: number, s: 0 | 1): Array<{ text: string; lang: Lang }> {
    const cfg = cfgRef.current;
    const word = cfg.words[cfg.order[p]];
    if (!word) return [];
    const kind: SideKind =
      cfg.direction === "target-first"
        ? s === 0
          ? "target"
          : "translation"
        : s === 0
          ? "translation"
          : "target";
    const set = new Set(cfg.langs);
    const items: Array<{ text: string; lang: Lang }> = [];
    if (kind === "target") {
      if (set.has(cfg.target)) {
        const text = textFor(word, cfg.target);
        if (text) items.push({ text, lang: cfg.target });
      }
    } else {
      if (set.has("en") && word.en) items.push({ text: word.en, lang: "en" });
      if (set.has(cfg.native)) {
        const text = textFor(word, cfg.native);
        if (text) items.push({ text, lang: cfg.native });
      }
    }
    return items;
  }

  function stopAllPlayback() {
    stopAudioElement();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Играет на общем переиспользуемом элементе (см. lib/audio-element.ts) —
  // только он сохраняет право звучать, когда приложение уходит в фон.
  async function tryRemoteAudio(
    text: string,
    lang: Lang,
    isCurrent: () => boolean,
  ): Promise<boolean> {
    const url = audioUrl(text, lang);
    if (!url) return false;
    const outcome = await playUrl(url, isCurrent);
    // "error" = файла нет, ниже отработает системный голос.
    // "cancelled" = нас прервали; сообщаем «сыграло», чтобы не читать повторно.
    return outcome !== "error";
  }

  function playWebSpeech(text: string, lang: Lang): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return resolve();
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG_META[lang].locale;
      u.rate = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const prefix = LANG_META[lang].locale.slice(0, 2);
      const voice = voices.find(
        (v) => v.lang === LANG_META[lang].locale || v.lang.startsWith(prefix),
      );
      if (voice) u.voice = voice;
      let resolved = false;
      let guard = 0;
      const done = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(guard);
          resolve();
        }
      };
      u.onend = done;
      u.onerror = done;
      // Системный голос умеет промолчать вообще без событий (нет голоса на
      // язык, страница ушла в фон). Без страховки цепочка встанет навсегда.
      guard = window.setTimeout(done, 2000 + text.length * 120);
      window.speechSynthesis.speak(u);
    });
  }

  // Возвращает true, если цепочка доиграла целиком и её не прервали —
  // по этому признаку в фоне двигаем карточку дальше.
  const speakChain = useCallback(
    async (items: Array<{ text: string; lang: Lang }>) => {
      if (typeof window === "undefined") return false;
      const myToken = ++chainTokenRef.current;
      const isCurrent = () => chainTokenRef.current === myToken;
      stopAllPlayback();
      if (items.length === 0) return false;

      for (const item of items) {
        if (!isCurrent()) return false;
        const ok = await tryRemoteAudio(item.text, item.lang, isCurrent);
        if (!isCurrent()) return false;
        if (!ok) {
          await playWebSpeech(item.text, item.lang);
          if (!isCurrent()) return false;
        }
      }
      return true;
    },
    [],
  );

  const speakOne = useCallback(
    (text: string, lang: Lang) => speakChain([{ text, lang }]),
    [speakChain],
  );

  // Шаг очереди в фоне: сначала переворот, потом следующее слово. Меняет и
  // ref (по нему идёт петля), и состояние React (по нему рисуется карточка).
  function stepHidden() {
    const cfg = cfgRef.current;
    const cur = stateRef.current;
    const next: { pos: number; side: 0 | 1 } =
      cur.side === 0
        ? { pos: cur.pos, side: 1 }
        : {
            pos: cfg.order.length === 0 ? 0 : (cur.pos + 1) % cfg.order.length,
            side: 0,
          };
    stateRef.current = next;
    sideRef.current = next.side;
    setSide(next.side);
    setPos(next.pos);
    // Экран блокировки должен показывать то, что звучит. Эффект с метаданными
    // ждёт ререндера, а его в фоне может не быть — обновляем здесь же.
    const word = cfg.words[cfg.order[next.pos]];
    if (word) {
      setMediaSessionMetadata(
        textFor(word, cfg.target) ?? word.id,
        textFor(word, cfg.native) ?? "",
      );
    }
  }

  /**
   * Фоновая петля озвучки.
   *
   * Пока страница скрыта (погас экран, ушли в другое приложение), iOS
   * придушивает таймеры, а ререндер React может не случиться вовсе. Поэтому
   * очередь здесь двигает сама озвучка: следующий src ставится прямо из
   * обработчика `ended`, без ожидания эффектов. Всё нужное читается из ref'ов,
   * состояние React обновляется следом — только чтобы нарисовать карточку.
   */
  async function runHiddenLoop() {
    if (loopActiveRef.current) return;
    const myToken = ++loopTokenRef.current;
    loopActiveRef.current = true;
    // Элемент один: цепочку, начатую видимой страницей, забираем себе.
    chainTokenRef.current++;
    const alive = () =>
      loopTokenRef.current === myToken && playingRef.current && document.hidden;
    try {
      while (alive()) {
        const { pos: p, side: s } = stateRef.current;
        for (const item of itemsAt(p, s)) {
          if (!alive()) return;
          const url = audioUrl(item.text, item.lang);
          const outcome = url ? await playUrl(url, alive) : "error";
          if (outcome === "cancelled") return;
          // Системный голос в фоне молчит и не присылает событий — ждать его
          // нельзя, петля встанет навсегда. Вместо него держим паузу тишиной.
          if (outcome === "error") {
            if ((await playUrl(SILENCE_URL, alive)) === "cancelled") return;
          }
        }
        if (!alive()) return;
        // Пауза между сторонами. Сделана звуком намеренно: setTimeout в фоне
        // не срабатывает, а ещё пустой элемент теряет право играть дальше.
        if ((await playUrl(SILENCE_URL, alive)) === "cancelled") return;
        if (!alive()) return;
        stepHidden();
      }
    } finally {
      if (loopTokenRef.current === myToken) loopActiveRef.current = false;
    }
  }

  useEffect(() => {
    if (langSet.size === 0 || !current) return;
    // В фоне очередь ведёт runHiddenLoop, здесь бы мы только перебили ей звук.
    if (loopActiveRef.current) return;
    // Озвучка синхронна со стороной карточки: на target-стороне звучит target;
    // на стороне перевода — выбранные помощники (EN и/или native).
    speakChain(itemsAt(pos, side));
  }, [
    pos,
    side,
    sideKind,
    langSet,
    current,
    target,
    native,
    speakChain,
  ]);

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

  // На самой быстрой скорости сторона перевода не успевает: там звучат два
  // языка подряд (английский и родной), 1.5 с на оба не хватает.
  const sideSeconds = useMemo(
    () => (speed === 1.5 && sideKind !== "target" ? speed + 1 : speed),
    [speed, sideKind],
  );

  // Один шаг автопрокрутки таймером, пока страница на экране.
  // В фоне то же самое делает stepHidden, но по событиям озвучки.
  const advance = useCallback(() => {
    if (effectiveOrder.length === 0) return;
    if (sideRef.current === 0) setSide(1);
    else {
      setSide(0);
      setPos((p) => (p + 1) % effectiveOrder.length);
    }
  }, [effectiveOrder.length]);

  useEffect(() => {
    playingRef.current = playing;
    sideRef.current = side;
  }, [playing, side]);

  // Слушатель visibilitychange вешается один раз и живёт с первым замыканием,
  // поэтому в петлю ходим через ref — так вызывается свежая версия.
  const runHiddenLoopRef = useRef(runHiddenLoop);
  runHiddenLoopRef.current = runHiddenLoop;

  // Пуск и остановка автопрокрутки. playingRef ставится сразу, не дожидаясь
  // ререндера: на нём завязана фоновая петля, и она может стартовать раньше.
  const setPlayingNow = useCallback((next: boolean) => {
    playingRef.current = next;
    setPlaying(next);
    if (next && typeof document !== "undefined" && document.hidden) {
      void runHiddenLoopRef.current();
    }
  }, []);
  const togglePlaying = useCallback(
    () => setPlayingNow(!playingRef.current),
    [setPlayingNow],
  );

  // Возврат из фона должен снова запустить таймер: эффект автопрокрутки
  // читает document.hidden, поэтому ему нужен повод пересчитаться.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const sync = () => {
      setHidden(document.hidden);
      if (document.hidden) {
        // Уходим в фон — дальше очередь ведёт озвучка, а не таймер.
        if (playingRef.current) void runHiddenLoopRef.current();
      } else {
        // Вернулись на экран — петля больше не нужна, снова работает таймер.
        loopTokenRef.current++;
        loopActiveRef.current = false;
      }
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // Экран блокировки и кнопки на наушниках.
  useEffect(() => {
    setMediaSessionHandlers({
      play: () => setPlayingNow(true),
      pause: () => setPlayingNow(false),
      nexttrack: () => next(),
      previoustrack: () => prev(),
    });
  }, [next, prev, setPlayingNow]);

  useEffect(() => {
    setMediaSessionPlaying(playing);
  }, [playing]);

  useEffect(() => {
    if (!current) return;
    const title = textFor(current, target) ?? current.id;
    const subtitle = textFor(current, native) ?? "";
    setMediaSessionMetadata(title, subtitle);
  }, [current, target, native]);

  useEffect(() => {
    if (!playing || effectiveOrder.length === 0) return;
    // В фоне сторону двигает озвучка (см. эффект цепочки), таймер там всё
    // равно не сработает — не дублируем.
    if (hidden) return;
    const t = setTimeout(advance, sideSeconds * 1000);
    return () => clearTimeout(t);
  }, [playing, side, pos, sideSeconds, effectiveOrder.length, advance, hidden]);

  const timerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = timerRef.current;
    if (!el) return;
    el.style.animation = "none";
    el.offsetHeight;
    if (playing) {
      // Полоса-таймер должна идти ровно столько, сколько живёт сторона.
      el.style.animation = `flashcard-tick ${sideSeconds}s linear forwards`;
    }
  }, [playing, side, pos, sideSeconds]);

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

  const handleKnow = () => {
    if (!current) return;
    mark(slug, current.id);
    setSide(0);
  };
  const handleUnknow = () => {
    if (!current) return;
    unmark(slug, current.id);
  };

  const SWIPE_THRESHOLD = 50;

  const onCardPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "touch") return;
    pointerStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    swipedRef.current = false;
    setSwipeDx(0);
    setSwipeDy(0);
  };

  const onCardPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = pointerStart.current;
    if (!s || e.pointerId !== s.id) return;
    setSwipeDx(e.clientX - s.x);
    setSwipeDy(e.clientY - s.y);
  };

  const onCardPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = pointerStart.current;
    if (!s || e.pointerId !== s.id) return;
    pointerStart.current = null;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    setSwipeDx(0);
    setSwipeDy(0);
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return; // tap
    swipedRef.current = true;
    if (absX > absY) {
      if (dx < 0) next();
      else prev();
    } else {
      if (dy < 0) handleKnow();
      else if (currentIsLearned) handleUnknow();
    }
  };

  const onCardPointerCancel = () => {
    pointerStart.current = null;
    setSwipeDx(0);
    setSwipeDy(0);
  };

  const handleCardClick = () => {
    // Разрешение на звук выдаётся только из обработчика касания. Берём его
    // при любом касании карточки, чтобы потом озвучка работала и в фоне.
    unlockAudio();
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    flip();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        flip();
      } else if (e.code === "ArrowRight") next();
      else if (e.code === "ArrowLeft") prev();
      else if (e.code === "KeyP") togglePlaying();
      else if (e.code === "KeyK") handleKnow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, next, prev]); // eslint-disable-line react-hooks/exhaustive-deps

  if (totalCount === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        {t(locale, "fc_empty")}
      </div>
    );
  }

  if (effectiveOrder.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-xl font-semibold">
            {t(locale, "fc_all_done_title")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} / {totalCount} {t(locale, "fc_all_done_marked")}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => clearSet(slug)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RotateCw className="h-4 w-4" /> {t(locale, "fc_study_again")}
            </button>
            <button
              type="button"
              onClick={() => setHideLearned(false)}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-secondary"
            >
              <Eye className="h-4 w-4" /> {t(locale, "fc_show_learned")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Текст и метка стороны
  const targetText = textFor(current, target) ?? "";
  const nativeText = textFor(current, native) ?? "";
  const sideLabel =
    sideKind === "target"
      ? t(locale, "fc_side_target")
      : t(locale, "fc_side_translation");

  return (
    <div className="flex flex-col gap-4">
      <style>{`@keyframes flashcard-tick { from { width: 0% } to { width: 100% } }`}</style>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {t(locale, "fc_progress")}{" "}
          <span className="font-semibold text-foreground">
            {learnedCount} / {totalCount}
          </span>{" "}
          {t(locale, "fc_learned")}
        </span>
        <div className="flex items-center gap-3">
          <div className="hidden h-1.5 w-32 overflow-hidden rounded bg-secondary sm:block">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(learnedCount / totalCount) * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setStudyMode((s) => !s)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition",
              studyMode
                ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
                : "hover:bg-secondary",
            )}
          >
            {studyMode ? (
              <>
                <X className="h-4 w-4" /> {t(locale, "fc_exit_study")}
              </>
            ) : (
              <>
                <GraduationCap className="h-4 w-4" /> {t(locale, "fc_study")}
              </>
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCardClick}
        onPointerDown={onCardPointerDown}
        onPointerMove={onCardPointerMove}
        onPointerUp={onCardPointerUp}
        onPointerCancel={onCardPointerCancel}
        style={{
          transform:
            swipeDx || swipeDy
              ? `translate(${swipeDx * 0.85}px, ${swipeDy * 0.85}px) rotate(${swipeDx * 0.05}deg)`
              : undefined,
          transition: swipeDx || swipeDy ? "none" : "transform 200ms ease-out",
          touchAction: "none",
        }}
        className={cn(
          "group relative flex select-none flex-col overflow-hidden rounded-2xl border bg-card p-8 pb-6 text-center shadow-sm transition-colors hover:border-primary",
          studyMode
            ? "min-h-[60vh] sm:min-h-[70vh]"
            : "min-h-[260px] sm:min-h-[320px]",
          currentIsLearned && "border-emerald-500/50 bg-emerald-500/5",
        )}
      >
        <div className="absolute left-4 top-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {sideLabel}
        </div>
        <div className="absolute right-4 top-3 text-xs text-muted-foreground">
          {pos + 1} / {effectiveOrder.length}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          {sideKind === "target" ? (
            <div
              className={cn(
                "w-full text-balance text-center font-semibold leading-tight text-primary",
                studyMode
                  ? "text-5xl sm:text-7xl"
                  : "text-3xl sm:text-4xl",
              )}
            >
              {targetText}
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-2 text-center">
              {current.en ? (
                <div
                  className={cn(
                    "w-full text-balance text-center font-semibold leading-tight",
                    studyMode
                      ? "text-4xl sm:text-6xl"
                      : "text-2xl sm:text-3xl",
                  )}
                >
                  {current.en}
                </div>
              ) : null}
              <div
                className={cn(
                  "w-full text-balance text-center leading-tight",
                  current.en
                    ? cn(
                        "text-muted-foreground",
                        studyMode ? "text-xl sm:text-3xl" : "text-base sm:text-lg",
                      )
                    : cn(
                        "font-semibold text-foreground",
                        studyMode
                          ? "text-4xl sm:text-6xl"
                          : "text-2xl sm:text-3xl",
                      ),
                )}
              >
                {nativeText}
              </div>
              {current.note && (
                <div className="text-center text-xs italic text-muted-foreground/80">
                  {current.note}
                </div>
              )}
            </div>
          )}
        </div>

        {current.examples && current.examples.length > 0 && (
          <div className="mt-4 w-full">
            <div className="mx-auto max-w-md border-t pt-3 text-center">
              <ul className="space-y-2.5 text-balance text-center">
                {current.examples.slice(0, 3).map((ex, i) => (
                  <li key={i} className="text-center leading-snug">
                    {sideKind === "target" ? (
                      <ExampleLine
                        text={locale === "ru" ? ex.id : ex.ru}
                        lang={locale === "ru" ? "id" : "ru"}
                        onSpeak={speakOne}
                        className={cn(
                          "text-muted-foreground",
                          studyMode ? "text-base sm:text-lg" : "text-sm",
                        )}
                      />
                    ) : (
                      <>
                        <ExampleLine
                          text={ex.id}
                          lang="id"
                          onSpeak={speakOne}
                          className={cn(
                            "text-muted-foreground",
                            studyMode ? "text-base sm:text-lg" : "text-sm",
                          )}
                        />
                        <ExampleLine
                          text={ex.ru}
                          lang="ru"
                          onSpeak={speakOne}
                          className={cn(
                            "text-muted-foreground/70",
                            studyMode ? "text-sm sm:text-base" : "text-xs",
                          )}
                        />
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1 bg-secondary">
          <div
            ref={timerRef}
            className="h-full bg-primary"
            style={{ width: "0%" }}
          />
        </div>

        {currentIsLearned && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="h-3 w-3" /> {t(locale, "fc_learned")}
          </div>
        )}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <IconButton onClick={prev} title={t(locale, "fc_back")}>
          <SkipBack className="h-4 w-4" />
        </IconButton>
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            togglePlaying();
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          {playing ? (
            <>
              <Pause className="h-4 w-4" /> {t(locale, "fc_pause")}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> {t(locale, "fc_auto")}
            </>
          )}
        </button>
        <IconButton onClick={next} title={t(locale, "fc_forward")}>
          <SkipForward className="h-4 w-4" />
        </IconButton>
        {currentIsLearned ? (
          <button
            type="button"
            onClick={handleUnknow}
            title={t(locale, "fc_unknow")}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            <Undo2 className="h-4 w-4" /> {t(locale, "fc_unknow")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleKnow}
            title={t(locale, "fc_know")}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-400"
          >
            <Check className="h-4 w-4" /> {t(locale, "fc_know")}
          </button>
        )}
        <IconButton onClick={flip} title={t(locale, "fc_flip")}>
          <RotateCw className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={shuffle} title={t(locale, "fc_shuffle")}>
          <Shuffle className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={() => speakOne(current.id, "id")}
          highlight={langSet.has("id")}
          title={
            locale === "ru"
              ? t(locale, "fc_speak_target")
              : t(locale, "fc_speak_native")
          }
        >
          <span className="text-[10px] font-semibold">ID</span>
        </IconButton>
        {current.en && (
          <IconButton
            onClick={() => speakOne(current.en!, "en")}
            highlight={langSet.has("en")}
            title={t(locale, "fc_speak_en")}
          >
            <span className="text-[10px] font-semibold">EN</span>
          </IconButton>
        )}
        <IconButton
          onClick={() => speakOne(current.ru, "ru")}
          highlight={langSet.has("ru")}
          title={
            locale === "ru"
              ? t(locale, "fc_speak_native")
              : t(locale, "fc_speak_target")
          }
        >
          <span className="text-[10px] font-semibold">RU</span>
        </IconButton>
      </div>

      {!studyMode && (
      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t(locale, "fc_settings_speed")}>
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
            {speed.toFixed(1)} {t(locale, "fc_settings_speed_unit")}
          </div>
        </Field>

        <Field label={t(locale, "fc_settings_direction")}>
          <button
            type="button"
            onClick={() => {
              setDirection((d) =>
                d === "target-first" ? "translation-first" : "target-first",
              );
              setSide(0);
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {direction === "target-first"
              ? t(locale, "fc_settings_direction_target_first")
              : t(locale, "fc_settings_direction_translation_first")}
          </button>
          <div className="text-xs text-muted-foreground">
            {t(locale, "fc_settings_direction_hint")}
          </div>
        </Field>

        <Field label={t(locale, "fc_settings_audio")}>
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
              {t(locale, "fc_settings_audio_all")}
            </button>
            <button
              type="button"
              onClick={() => setLangs([])}
              className="text-muted-foreground hover:text-foreground"
            >
              {t(locale, "fc_settings_audio_off")}
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            {langSet.size === 0
              ? t(locale, "fc_settings_audio_state_off")
              : tf(locale, "fc_settings_audio_state", {
                  langs: langs.map((l) => LANG_META[l].label).join(" · "),
                })}
          </div>
        </Field>

        <Field label={t(locale, "fc_settings_learned")}>
          <button
            type="button"
            onClick={() => setHideLearned((h) => !h)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            {hideLearned ? (
              <>
                <EyeOff className="h-4 w-4" />{" "}
                {t(locale, "fc_settings_learned_hidden")}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />{" "}
                {t(locale, "fc_settings_learned_shown")}
              </>
            )}
          </button>
          {learnedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm(t(locale, "learned_clear_all_confirm"))) {
                  clearSet(slug);
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" />{" "}
              {t(locale, "fc_settings_learned_reset")} ({learnedCount})
            </button>
          )}
        </Field>
      </div>
      )}

      {!studyMode && (
        <div className="text-center text-xs text-muted-foreground">
          {isTouch ? t(locale, "fc_swipe_hint") : t(locale, "fc_kbd_hint")}
        </div>
      )}
    </div>
  );
}

/**
 * Строка примера под карточкой — кликабельна, чтобы прослушать фразу.
 *
 * Не <button>: сама карточка уже кнопка (переворот по клику), а кнопка внутри
 * кнопки — невалидный HTML и ошибка гидрации. Поэтому div с onClick; слово
 * целиком по-прежнему доступно с клавиатуры через кнопки ID/EN/RU под карточкой.
 * stopPropagation обязателен, иначе клик долетит до карточки и перевернёт её.
 */
function ExampleLine({
  text,
  lang,
  onSpeak,
  className,
}: {
  text: string;
  lang: Lang;
  onSpeak: (text: string, lang: Lang) => void;
  className?: string;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSpeak(text, lang);
      }}
      title="Прослушать"
      className={cn(
        "cursor-pointer text-balance text-center transition hover:text-foreground",
        className,
      )}
    >
      {text}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  highlight = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background transition",
        highlight
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "hover:bg-secondary",
      )}
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
