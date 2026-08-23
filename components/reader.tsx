"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Languages, Square, Volume2 } from "lucide-react";
import type { Block, Glossary } from "@/lib/reading";
import { speakId } from "@/lib/speak-id";
import { cn } from "@/lib/utils";

// Читалка главы. Три взаимодействия, и все три работают на её собственных
// данных, без единого запроса в сеть:
//   1. слово — перевод во всплывашке (наведение мышью, тап на телефоне);
//   2. кнопка ⇄ у предложения — перевод целиком прямо в строке;
//   3. кнопка 🔊 — озвучка предложения (MP3 из public/audio, иначе Web Speech).
//
// Глоссарий и переводы приходят пропсами, уже урезанными до этой главы —
// см. chapterGlossary/chapterTranslations в lib/reading.ts.
//
// Кнопки предложения плавают отдельным слоем, а не стоят в потоке текста:
// в потоке они либо раздвигают строки на свою ширину даже невидимыми, либо
// заставляют текст прыгать в момент появления.

type Popup = { word: string; ru: string; lemma?: string; x: number; y: number };
type Bar = { id: string; x: number; y: number; flip: boolean };

export function Reader({
  blocks,
  translations,
  glossary,
}: {
  blocks: Block[];
  translations: Record<string, string>;
  glossary: Glossary;
}) {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [bar, setBar] = useState<Bar | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  // На тач-экранах наведения нет: там всё живёт по тапу.
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

  // Панель встаёт у конца предложения. Предложение переносится по строкам,
  // поэтому берём последний из его клиентских прямоугольников — конец
  // последней строки, а не габарит всего блока.
  const showBar = useCallback((el: HTMLElement) => {
    const id = el.dataset.sid;
    if (!id) return;
    const rects = el.getClientRects();
    const last = rects[rects.length - 1];
    if (!last) return;
    const flip = last.right > window.innerWidth - 64;
    setBar({
      id,
      x: flip ? last.right : last.right + 4,
      y: last.top + last.height / 2,
      flip,
    });
  }, []);

  const onOver = (e: React.MouseEvent) => {
    if (!hoverable) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-bar]")) return; // мышь ушла на саму панель
    const word = target.closest<HTMLElement>("[data-w]");
    if (word) showWord(word);
    else setPopup(null);
    const sent = target.closest<HTMLElement>("[data-sid]");
    if (sent) showBar(sent);
    else setBar(null);
  };

  const onClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-bar]")) return;
    const word = target.closest<HTMLElement>("[data-w]");
    const sent = target.closest<HTMLElement>("[data-sid]");
    if (word) showWord(word);
    else setPopup(null);
    if (sent) showBar(sent);
    else setBar(null);
  };

  // Всплывашка и панель привязаны к координатам на экране: при скролле их
  // проще убрать, чем пересчитывать на каждый кадр.
  useEffect(() => {
    if (!popup && !bar) return;
    const hide = () => {
      setPopup(null);
      setBar(null);
    };
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
    };
  }, [popup, bar]);

  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !(prev[id] ?? showAll) }));

  const speak = (id: string) => {
    stopRef.current?.();
    if (playing === id) {
      setPlaying(null);
      return;
    }
    setPlaying(id);
    stopRef.current = speakId(id, {
      onEnd: () => setPlaying((cur) => (cur === id ? null : cur)),
    });
  };

  const translated = Object.keys(translations).length;
  const total = blocks.reduce((a, b) => a + b.sent.length, 0);

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
        <span className="text-[11px] leading-tight text-muted-foreground">
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
        onMouseLeave={() => {
          setPopup(null);
          setBar(null);
        }}
        onClick={onClick}
        className="space-y-5 text-[1.0625rem] leading-[1.9] sm:text-lg"
      >
        {blocks.map((block, bi) => (
          <p
            key={bi}
            className={cn(
              block.kind === "q" &&
                "rounded-r-md border-l-2 border-primary/40 bg-secondary/40 py-2 pl-4 pr-3 italic",
            )}
          >
            {block.sent.map((sent, si) => {
              const ru = translations[sent.id];
              const isOpen = open[sent.id] ?? showAll;
              const isActive = bar?.id === sent.id || playing === sent.id;
              return (
                <span key={si}>
                  <span
                    data-sid={sent.id}
                    className={cn(
                      "rounded transition-colors",
                      isActive && "bg-primary/[0.08]",
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
                  {isOpen && ru && (
                    <span className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-[0.9em] not-italic text-muted-foreground">
                      {ru}
                    </span>
                  )}
                  {si < block.sent.length - 1 && " "}
                </span>
              );
            })}
          </p>
        ))}

        {bar && (
          <span
            data-bar
            style={{ left: bar.x, top: bar.y }}
            className={cn(
              "fixed z-40 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-md border bg-popover p-0.5 shadow-md",
              bar.flip && "-translate-x-full",
            )}
          >
            <button
              type="button"
              onClick={() => speak(bar.id)}
              title={playing === bar.id ? "Остановить" : "Прослушать предложение"}
              aria-label="Прослушать предложение"
              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {playing === bar.id ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
            {translations[bar.id] && (
              <button
                type="button"
                onClick={() => toggle(bar.id)}
                title="Перевод предложения"
                aria-label="Перевести предложение"
                aria-pressed={open[bar.id] ?? showAll}
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded transition hover:bg-secondary hover:text-foreground",
                  (open[bar.id] ?? showAll) ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Languages className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        )}
      </div>

      {popup && <WordPopup popup={popup} />}
    </div>
  );
}

function WordPopup({ popup }: { popup: Popup }) {
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

  return (
    <div
      ref={ref}
      role="tooltip"
      style={{ left, top: popup.y - 6 }}
      className="pointer-events-none fixed z-50 max-w-[min(18rem,90vw)] -translate-x-1/2 -translate-y-full rounded-lg border bg-popover px-2.5 py-1.5 text-center shadow-lg"
    >
      <div className="text-sm font-medium leading-tight text-popover-foreground">
        {popup.ru}
      </div>
      {popup.lemma && (
        <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
          от {popup.lemma}
        </div>
      )}
    </div>
  );
}
