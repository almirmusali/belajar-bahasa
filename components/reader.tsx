"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Languages, Square, Star, Volume2 } from "lucide-react";
import {
  isProse,
  type Block,
  type Glossary,
  type GlossaryEntry,
  type Prose,
} from "@/lib/reading-types";
import type { AudioLang } from "@/lib/audio-url";
import { speak } from "@/lib/speak";
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
// Значки стоят в потоке текста и видны всегда. Плавающая панель, которая
// появлялась по наведению, для этого не годилась: она гасла, стоило увести
// курсор, и в неё нельзя было прицелиться. По паре значков на предложение
// получалось слишком пёстро, поэтому пара одна — на абзац.
//
// Глоссарий и переводы приходят пропсами, уже урезанными до этой главы —
// см. chapterGlossary/chapterTranslations в lib/reading.ts.

type Popup = { word: string; ru: string; lemma?: string; x: number; y: number };

export function Reader({
  blocks,
  translations,
  glossary,
  lang,
}: {
  blocks: Block[];
  translations: Record<string, string>;
  glossary: Glossary;
  lang: AudioLang;
}) {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [voice, setVoice] = useState(true);
  const stopRef = useRef<(() => void) | null>(null);
  const queueRef = useRef<string[]>([]);
  const { toggleFavorite, isFavorite } = useWordSets();

  // На тач-экранах наведения нет: там всплывашка живёт по тапу.
  const [hoverable, setHoverable] = useState(true);
  useEffect(() => {
    setHoverable(window.matchMedia("(hover: hover)").matches);
  }, []);

  useEffect(() => () => stopRef.current?.(), []);

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
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition",
            showAll
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-secondary",
          )}
        >
          <Languages className="h-3.5 w-3.5" />
          {showAll ? "Перевод везде" : "Перевод по кнопке"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (voice) stopSpeaking();
            setVoice((v) => !v);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition",
            voice
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-secondary",
          )}
        >
          <Volume2 className="h-3.5 w-3.5" />
          {voice ? "Озвучка" : "Без озвучки"}
        </button>
        <span className="w-full text-[11px] leading-tight text-muted-foreground sm:w-auto">
          {hoverable ? "Наведи на слово" : "Тапни по слову"} — увидишь перевод
          {translated < total && (
            <span className="ml-1 opacity-70">
              · переведено {translated} из {total}
            </span>
          )}
        </span>
      </div>

      <div
        onMouseOver={onOver}
        onMouseLeave={(e) => {
          const to = e.relatedTarget as HTMLElement | null;
          if (to?.closest?.("[data-tip]")) return;
          setPopup(null);
        }}
        onClick={onClick}
        className="space-y-5 text-[1.0625rem] leading-[2] sm:text-lg"
      >
        {blocks.map((block, bi) =>
          block.kind === "t" ? (
            <TableView key={bi} head={block.head} rows={block.rows} />
          ) : !isProse(block) ? (
            <VocabBoxView key={bi} title={block.title} items={block.items} />
          ) : (
            <ParagraphView
              key={bi}
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
          ),
        )}
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
        <span className="ml-1.5 inline-flex translate-y-[0.15em] items-center gap-0.5 whitespace-nowrap align-baseline not-italic">
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
        "inline-flex h-5 w-5 items-center justify-center rounded transition",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground/50 group-hover/par:text-muted-foreground hover:!bg-secondary hover:!text-foreground",
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
      className="fixed z-50 max-w-[min(20rem,92vw)] -translate-x-1/2 -translate-y-full pb-2"
    >
      <div className="flex items-center gap-2 rounded-lg border bg-popover/85 py-1.5 pl-2.5 pr-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-md">
        <div className="min-w-0 text-left">
          <div className="text-sm font-medium leading-tight text-popover-foreground">
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
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition",
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
