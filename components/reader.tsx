"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Bookmark, Languages, Square, Star, Volume2 } from "lucide-react";
import {
  isProse,
  type Block,
  type BookLang,
  type Glossary,
  type GlossaryEntry,
  type Prose,
} from "@/lib/reading-types";
import type { AudioLang } from "@/lib/audio-url";
import { speak } from "@/lib/speak";
import {
  chapterFraction,
  readBook,
  savePosition,
  touchChapter,
} from "@/lib/use-reading-progress";
import { useWordSets } from "@/lib/use-word-sets";
import { cn } from "@/lib/utils";

// Читалка главы. Три взаимодействия, и все три работают на её собственных
// данных, без единого запроса в сеть:
//   1. слово — перевод во всплывашке (наведение мышью, тап на телефоне);
//   2. значок ⇄ в конце абзаца — перевод абзаца целиком, отдельной строкой
//      под ним;
//   2a. звёздочка во всплывашке — слово уходит в «Избранное» и потом учится
//      карточками в разделе «Словарь»;
//   3. значок 🔊 там же — озвучка абзаца: предложения читаются подряд, текущее
//      подсвечивается (MP3 из public/audio, иначе системный Web Speech).
//
// Плюс закладка: читалка следит за прокруткой и запоминает абзац, на котором
// читатель остановился (lib/use-reading-progress). При следующем открытии
// главы страница сама встаёт на это место, абзац помечен линией «здесь вы
// остановились», а в липкой панели тонкой полосой видно, сколько главы позади.
//
// Значки стоят в потоке текста и видны всегда. Плавающая панель, которая
// появлялась по наведению, для этого не годилась: она гасла, стоило увести
// курсор, и в неё нельзя было прицелиться. По паре значков на предложение
// получалось слишком пёстро, поэтому пара одна — на абзац.
//
// Глоссарий и переводы приходят пропсами, уже урезанными до этой главы —
// см. chapterGlossary/chapterTranslations в lib/reading.ts.

type Popup = { word: string; ru: string; lemma?: string; x: number; y: number };

// Размер текста главы. Три ступени, по умолчанию средняя; выбор живёт в
// localStorage и общий для всех книг — глаза у читателя одни.
const FONT_SIZES = [
  "text-[0.9375rem] leading-[1.9] sm:text-base",
  "text-[1.0625rem] leading-[2] sm:text-lg",
  "text-[1.1875rem] leading-[2] sm:text-xl",
] as const;
const FONT_KEY = "belajar:reading:font";

// Подсказку «тапни по слову» достаточно показать до первого тапа: дальше
// читатель уже умеет, а строка в липкой панели — украденная высота экрана.
const HINT_KEY = "belajar:reading:hint-done";

// Строка чтения: px от верха окна, сразу под липкой панелью. Закладка стоит
// на последнем абзаце, который ушёл выше неё. Возврат к закладке ставит абзац
// на эту же строку — иначе закладка при каждом открытии уползала бы назад.
const READ_LINE = 160;

export function Reader({
  slug,
  chapter,
  blocks,
  translations,
  glossary,
  lang = "id",
}: {
  slug: string;
  chapter: number;
  blocks: Block[];
  translations: Record<string, string>;
  glossary: Glossary;
  lang?: BookLang;
}) {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [voice, setVoice] = useState(true);
  const stopRef = useRef<(() => void) | null>(null);
  const queueRef = useRef<string[]>([]);
  const { toggleFavorite, isFavorite } = useWordSets();

  // Закладка: где читатель был в прошлый раз и где он сейчас.
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [at, setAt] = useState(0);

  // На тач-экранах наведения нет: там всплывашка живёт по тапу.
  const [hoverable, setHoverable] = useState(true);
  useEffect(() => {
    setHoverable(window.matchMedia("(hover: hover)").matches);
  }, []);

  // Размер текста и подсказка. До монтирования — значения по умолчанию:
  // localStorage на сервере нет, а разной разметке React не обрадуется.
  // Подсказка по умолчанию скрыта, а не показана: иначе у постоянного
  // читателя панель прыгала бы на каждой главе, пока эффект её прячет.
  const [fontSize, setFontSize] = useState(1);
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    // Именно строка, а не Number(getItem(...)): Number(null) — это 0, и
    // читатель без сохранённого выбора получал бы самый мелкий шрифт.
    const stored = localStorage.getItem(FONT_KEY);
    if (stored === "0" || stored === "2") setFontSize(Number(stored));
    if (!localStorage.getItem(HINT_KEY)) setShowHint(true);
  }, []);

  const cycleFontSize = () => {
    const next = (fontSize + 1) % FONT_SIZES.length;
    setFontSize(next);
    localStorage.setItem(FONT_KEY, String(next));
  };

  // Первая же открывшаяся всплывашка гасит подсказку насовсем.
  useEffect(() => {
    if (!popup || !showHint) return;
    setShowHint(false);
    localStorage.setItem(HINT_KEY, "1");
  }, [popup, showHint]);

  useEffect(() => () => stopRef.current?.(), []);

  // Пока страница не встала на закладку, писать в хранилище нельзя: позиция,
  // измеренная по дороге, затёрла бы её началом главы. Храним не флаг, а
  // время, с которого запись разрешена: флаг сбрасывался бы при повторном
  // прогоне эффекта (в дев-режиме React прогоняет их дважды).
  const saveFrom = useRef(0);

  // Прошлая закладка читается один раз при открытии главы. Дальше она
  // переезжает по прокрутке, но метка в тексте остаётся там, где читатель
  // закончил в прошлый заход, — иначе она убегала бы вниз вместе с ним.
  useEffect(() => {
    touchChapter(slug, chapter);
    const saved = readBook(slug);
    // Дочитанную главу открывают, чтобы перечитать, — тащить читателя в её
    // конец незачем, закладки в ней тоже нет.
    const unfinished = chapterFraction(saved, chapter) < 1;
    if (saved && saved.chapter === chapter && saved.block > 0 && unfinished) {
      setResumeAt(Math.min(saved.block, blocks.length - 1));
    } else {
      // Главу открыли с начала — это уже прогресс, пусть даже читатель не
      // тронет колесо: короткая глава помещается в один экран.
      savePosition(slug, chapter, 0, blocks.length);
      saveFrom.current = Date.now();
    }
  }, [slug, chapter, blocks.length]);

  // Возврат к закладке. Прыгаем, только если она заметно ниже начала главы:
  // ради второго абзаца дёргать страницу незачем.
  const jumped = useRef(false);
  useEffect(() => {
    if (resumeAt === null || jumped.current) return;
    jumped.current = true;

    const el = resumeAt >= 2 ? blockRefs.current[resumeAt] : null;
    if (el) {
      // Абзац встаёт ровно на строку чтения — там же, где его в прошлый раз
      // и засчитали. Чуть выше видна пара строк предыдущего абзаца: с них
      // легче поймать нить, чем с обрыва.
      const top = window.scrollY + el.getBoundingClientRect().top - READ_LINE + 8;
      window.scrollTo({ top: Math.max(0, top) });
    }
    saveFrom.current = Date.now() + 300;
  }, [resumeAt]);

  // Слежение за прокруткой: закладка стоит на последнем абзаце, ушедшем выше
  // строки чтения. В localStorage пишем не на каждый кадр, а после паузы —
  // и обязательно перед уходом со страницы, иначе последний абзац пропадёт.
  useEffect(() => {
    let tick: ReturnType<typeof setTimeout> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pending: { block: number; done: boolean } | null = null;

    const flush = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (!pending) return;
      savePosition(slug, chapter, pending.block, blocks.length, pending.done);
      pending = null;
    };

    const measure = () => {
      const els = blockRefs.current;
      let idx = 0;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el) continue;
        if (el.getBoundingClientRect().top <= READ_LINE) idx = i;
        else break;
      }
      // Докрутили до низа — глава засчитывается целиком: последние абзацы
      // выше строки чтения уже не поднимутся, дальше просто нечего листать.
      const done =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 120;
      if (done) idx = Math.max(idx, els.length - 1);
      setAt(idx);

      if (!saveFrom.current || Date.now() < saveFrom.current) return;
      if (pending && pending.block === idx && pending.done === done) return;
      pending = { block: idx, done };
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 600);
    };

    // Троттлинг таймером, а не requestAnimationFrame: в скрытой вкладке кадры
    // не идут, и замер завис бы вместе с ними.
    const onScroll = () => {
      if (tick) return;
      tick = setTimeout(() => {
        tick = null;
        measure();
      }, 120);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      if (tick) clearTimeout(tick);
      flush();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [slug, chapter, blocks.length]);

  const lookup = useCallback(
    (raw: string) => glossary[raw.toLowerCase()] ?? null,
    [glossary],
  );

  const showWord = useCallback(
    (el: HTMLElement) => {
      const word = el.dataset.w;
      const entry = word ? lookup(word) : null;
      if (!word || !entry) {
        setPopup(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setPopup({
        word,
        ru: entry.ru,
        lemma: entry.lemma,
        x: r.left + r.width / 2,
        y: r.top,
      });
    },
    [lookup],
  );

  // Слов в главе сотни: вешать обработчик на каждый span — лишняя работа и
  // для React, и для памяти. Ловим события на корне и смотрим data-w.
  const onOver = (e: React.MouseEvent) => {
    if (!hoverable) return;
    const target = e.target as HTMLElement;
    // Курсор поехал на саму всплывашку — она нужна живой, там звёздочка.
    if (target.closest("[data-tip]")) return;
    const word = target.closest<HTMLElement>("[data-w]");
    if (word) showWord(word);
    else setPopup(null);
  };

  const onClick = (e: React.MouseEvent) => {
    const word = (e.target as HTMLElement).closest<HTMLElement>("[data-w]");
    if (word) showWord(word);
    else setPopup(null);
  };

  // Тап мимо текста тоже закрывает подсказку: иначе на телефоне она висит
  // над абзацем до следующего тапа по слову и загораживает чтение.
  useEffect(() => {
    if (!popup) return;
    const onDocClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-w]") || el?.closest("[data-tip]")) return;
      setPopup(null);
    };
    const hide = () => setPopup(null);
    document.addEventListener("click", onDocClick);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("click", onDocClick);
      window.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
    };
  }, [popup]);

  // Ключ — индекс абзаца в главе: перевод раскрывается целым абзацем.
  const toggle = (bi: number) =>
    setOpen((prev) => ({ ...prev, [bi]: !(prev[bi] ?? showAll) }));

  const stopSpeaking = () => {
    queueRef.current = [];
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(null);
  };

  // Озвучка идёт очередью: сейчас в ней всегда одно предложение, но очередь
  // оставлена намеренно — из неё же читается несколько подряд, если понадобится.
  const speakQueue = (ids: string[], say: AudioLang) => {
    stopSpeaking();
    queueRef.current = ids.slice();
    const next = () => {
      const id = queueRef.current.shift();
      if (!id) {
        setPlaying(null);
        return;
      }
      setPlaying(id);
      stopRef.current = speak(id, { onEnd: next, lang: say });
    };
    next();
  };

  const chapterPct = blocks.length
    ? Math.min(100, Math.round(((at + 1) / blocks.length) * 100))
    : 0;

  const translated = Object.keys(translations).length;
  const total = blocks.reduce(
    (a, b) => a + (isProse(b) ? b.sent.length : 0),
    0,
  );

  return (
    <div className="relative">
      <div className="sticky top-14 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-background/85 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => {
            setShowAll((v) => !v);
            setOpen({});
          }}
          aria-pressed={showAll}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition",
            showAll
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-secondary",
          )}
        >
          <Languages className="h-3.5 w-3.5" />
          Перевод везде
        </button>
        <button
          type="button"
          onClick={() => {
            if (voice) stopSpeaking();
            setVoice((v) => !v);
          }}
          aria-pressed={voice}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition",
            voice
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-secondary",
          )}
        >
          <Volume2 className="h-3.5 w-3.5" />
          Озвучка
        </button>
        <button
          type="button"
          onClick={cycleFontSize}
          title="Размер текста"
          aria-label="Размер текста"
          className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition hover:bg-secondary"
        >
          <span aria-hidden className="leading-none">
            <span className="text-[10px]">A</span>
            <span className="text-[13px]">a</span>
          </span>
        </button>
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
          {chapterPct}%
        </span>
        {(showHint || translated < total) && (
          <span className="w-full text-[11px] leading-tight text-muted-foreground">
            {showHint && (
              <>{hoverable ? "Наведи на слово" : "Тапни по слову"} — увидишь перевод</>
            )}
            {translated < total && (
              <span className={cn(showHint && "ml-1 opacity-70")}>
                {showHint && "· "}переведено {translated} из {total}
              </span>
            )}
          </span>
        )}

        {/* Прогресс по главе: тонкая линия по нижней кромке панели. */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-primary/70 transition-[width] duration-300"
          style={{ width: `${chapterPct}%` }}
        />
      </div>

      <div
        onMouseOver={onOver}
        onMouseLeave={(e) => {
          const to = e.relatedTarget as HTMLElement | null;
          if (to?.closest?.("[data-tip]")) return;
          setPopup(null);
        }}
        onClick={onClick}
        // touch-manipulation убирает задержку и зум по двойному тапу;
        // select-none на тач-экране — чтобы тап по слову не спорил с
        // выделением текста (случайный двойной тап выделяет слово вместо
        // перевода). Мышиного выделения это не трогает.
        className={cn(
          "space-y-5 touch-manipulation coarse:select-none",
          FONT_SIZES[fontSize],
        )}
      >
        {blocks.map((block, bi) => (
          <div
            key={bi}
            ref={(el) => {
              blockRefs.current[bi] = el;
            }}
            className={cn(
              "scroll-mt-28 rounded-lg",
              bi === resumeAt && "reading-resume-flash -mx-2 px-2",
            )}
          >
            {bi === resumeAt && <BookmarkLine />}
            {block.kind === "t" ? (
              <TableView head={block.head} rows={block.rows} />
            ) : !isProse(block) ? (
              <VocabBoxView title={block.title} items={block.items} />
            ) : (
              <ParagraphView
                block={block}
                translations={translations}
                lookup={lookup}
                playing={playing}
                voice={voice}
                open={open[bi] ?? showAll}
                onToggle={() => toggle(bi)}
                onSpeak={() => {
                  const ids = block.sent.map((x) => x.id);
                  if (ids.some((id) => id === playing)) stopSpeaking();
                  else speakQueue(ids, block.lang ?? lang);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {popup && (
        <WordPopup
          popup={popup}
          starred={isFavorite(popup.word.toLowerCase())}
          onStar={() =>
            toggleFavorite({
              id: popup.word.toLowerCase(),
              ru: popup.ru,
              note: popup.lemma ? `от ${popup.lemma}` : undefined,
            })
          }
        />
      )}
    </div>
  );
}

// Линия закладки над абзацем, на котором читатель закрыл главу в прошлый
// раз. Нужна именно линия, а не подсветка абзаца: подсвеченный абзац читается
// как «важное место в книге», а это отметка читателя, а не автора.
function BookmarkLine() {
  return (
    <div className="mb-3 flex select-none items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium leading-none text-primary">
        <Bookmark className="h-3 w-3 fill-current" />
        здесь вы остановились
      </span>
      <span className="h-px flex-1 bg-primary/25" />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      >
        <ArrowUp className="h-3 w-3" />
        в начало главы
      </button>
    </div>
  );
}

// Абзац: текст, пара значков в конце и — если раскрыт — перевод целиком
// отдельной строкой под ним. Перевод склеивается из переводов предложений:
// разбит он по предложениям только потому, что так надёжнее переводить.
function ParagraphView({
  block,
  translations,
  lookup,
  playing,
  voice,
  open,
  onToggle,
  onSpeak,
}: {
  block: Prose;
  translations: Record<string, string>;
  lookup: (raw: string) => GlossaryEntry | null;
  playing: string | null;
  voice: boolean;
  open: boolean;
  onToggle: () => void;
  onSpeak: () => void;
}) {
  const ru = block.sent
    .map((s) => translations[s.id])
    .filter(Boolean)
    .join(" ");
  const isPlaying = block.sent.some((s) => s.id === playing);

  // Подзаголовок — тот же абзац, только заголовочным тегом: наведение на
  // слово, перевод и озвучка в нём работают ровно так же, как в прозе.
  const Tag = block.kind === "h" ? "h2" : "p";

  return (
    <div className="group/par">
      <Tag
        className={cn(
          block.kind === "q" &&
            "rounded-r-md border-l-2 border-primary/40 bg-secondary/40 py-2 pl-4 pr-3 italic",
          block.kind === "h" &&
            "mt-9 text-[1.05em] font-semibold leading-snug tracking-tight",
        )}
      >
        {block.sent.map((sent, si) => (
          <span key={si}>
            <span
              className={cn(
                "rounded transition-colors",
                playing === sent.id && "bg-primary/[0.08]",
              )}
            >
              {sent.seg.map((seg, gi) => (
                <span
                  key={gi}
                  className={cn(
                    seg.em === "b" && "font-semibold",
                    seg.em === "i" && "italic",
                  )}
                >
                  {seg.tk.map((tk, ti) =>
                    tk.w ? (
                      <span
                        key={ti}
                        data-w={tk.w}
                        className={cn(
                          "-mx-0.5 rounded px-0.5 transition-colors",
                          lookup(tk.w)
                            ? "cursor-help hover:bg-primary/20"
                            : "cursor-default",
                        )}
                      >
                        {tk.w}
                      </span>
                    ) : (
                      <span key={ti}>{tk.s}</span>
                    ),
                  )}
                </span>
              ))}
            </span>
            {si < block.sent.length - 1 && " "}
          </span>
        ))}

        {/* Значки не отрываются от последней строки абзаца при переносе. */}
        <span className="ml-1.5 inline-flex translate-y-[0.15em] items-center gap-0.5 whitespace-nowrap align-baseline not-italic coarse:gap-1.5">
          {voice && (
            <ParagraphAction
              active={isPlaying}
              title={isPlaying ? "Остановить" : "Прослушать абзац"}
              onClick={onSpeak}
            >
              {isPlaying ? (
                <Square className="h-2.5 w-2.5 fill-current" />
              ) : (
                <Volume2 className="h-[15px] w-[15px]" />
              )}
            </ParagraphAction>
          )}
          {ru && (
            <ParagraphAction
              active={open}
              title="Перевод абзаца"
              onClick={onToggle}
            >
              <Languages className="h-[15px] w-[15px]" />
            </ParagraphAction>
          )}
        </span>
      </Tag>

      {open && ru && (
        <p className="mt-1.5 rounded-md border-l-2 border-secondary bg-secondary/50 py-1.5 pl-3 pr-3 text-[0.92em] not-italic leading-relaxed text-muted-foreground">
          {ru}
        </p>
      )}
    </div>
  );
}

// Значок действия в конце абзаца. Приглушён, пока предложение не под
// курсором, — иначе две иконки после каждой фразы забивают полосу текста.
function ParagraphAction({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        // На тач-экране мишень крупнее (32px — почти рекомендованный минимум,
        // строка высотой в leading-[2] её вмещает) и значок не приглушён:
        // наведения, которое бы его проявило, там нет.
        "inline-flex h-5 w-5 items-center justify-center rounded transition coarse:h-8 coarse:w-8",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground/50 group-hover/par:text-muted-foreground hover:!bg-secondary hover:!text-foreground coarse:text-muted-foreground/70",
      )}
    >
      {children}
    </button>
  );
}

// Таблица главы («Key Vocabulary»): двуязычный справочник автора, поэтому —
// как и врезка-словарик — без кнопок и без подсветки слов. На узком экране
// прокручивается вбок сама, не растягивая страницу.
function TableView({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[34rem] border-collapse text-[0.82em] leading-normal">
        <thead>
          <tr>
            {head.map((c, i) => (
              <th
                key={i}
                className="border-b px-3 py-2 text-left font-semibold text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="align-top">
              {row.map((c, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "border-b px-3 py-2",
                    ci === 0 && "font-medium",
                    ci > 0 && "text-muted-foreground",
                  )}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Врезка-словарик автора в конце главы: показываем как есть, без кнопок —
// переводить и озвучивать там нечего, это уже перевод.
function VocabBoxView({
  title,
  items,
}: {
  title: string;
  items: { id: string; ru: string }[];
}) {
  return (
    <aside className="rounded-xl border bg-secondary/40 px-4 py-3 text-base leading-relaxed sm:px-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 text-[0.95rem] leading-snug">
            <dt className="font-medium">{item.id}</dt>
            <dd className="text-muted-foreground">— {item.ru}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function WordPopup({
  popup,
  starred,
  onStar,
}: {
  popup: Popup;
  starred: boolean;
  onStar: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(popup.x);

  // Слово у края экрана — всплывашка уехала бы за границу. Ширину знаем
  // только после рендера, поэтому сдвигаем её эффектом.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const half = el.offsetWidth / 2;
    const pad = 8;
    setLeft(
      Math.min(Math.max(popup.x, half + pad), window.innerWidth - half - pad),
    );
  }, [popup.x, popup.word]);

  // Всплывашка неизбежно накрывает строку выше — в плотном тексте её просто
  // некуда деть. Поэтому она полупрозрачная и с размытием под собой: видно,
  // что это слой поверх текста, а не слипшиеся строки.
  //
  // Нижний отступ обёртки — «мостик»: без него курсор, идущий от слова к
  // звёздочке, проходил бы через пустоту и гасил всплывашку.
  return (
    <div
      ref={ref}
      data-tip
      style={{ left, top: popup.y - 2 }}
      className="fixed z-50 max-w-[min(20rem,92vw)] -translate-x-1/2 -translate-y-full select-none pb-2"
    >
      <div className="flex items-center gap-2 rounded-lg border bg-popover/85 py-1.5 pl-2.5 pr-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-md">
        <div className="min-w-0 text-left">
          <div className="text-sm font-medium leading-tight text-popover-foreground coarse:text-[15px]">
            {popup.ru}
          </div>
          {popup.lemma && (
            <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
              от {popup.lemma}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onStar}
          title={starred ? "Убрать из избранного" : "В избранное"}
          aria-label={starred ? "Убрать из избранного" : "Добавить в избранное"}
          aria-pressed={starred}
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition coarse:h-9 coarse:w-9",
            starred
              ? "text-primary"
              : "text-muted-foreground/60 hover:bg-secondary hover:text-foreground",
          )}
        >
          <Star className={cn("h-4 w-4", starred && "fill-current")} />
        </button>
      </div>
    </div>
  );
}
