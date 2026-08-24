"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Languages, Square, Volume2 } from "lucide-react";
import { isProse, type Block, type Glossary } from "@/lib/reading-types";
import { speakId } from "@/lib/speak-id";
import { cn } from "@/lib/utils";

// Читалка главы. Три взаимодействия, и все три работают на её собственных
// данных, без единого запроса в сеть:
//   1. слово — перевод во всплывашке (наведение мышью, тап на телефоне);
//   2. значок ⇄ в конце предложения — перевод целиком прямо в строке;
//   3. значок 🔊 там же — озвучка предложения (MP3 из public/audio, иначе
//      системный Web Speech).
//
// Значки стоят в потоке текста и видны всегда. Плавающая панель, которая
// появлялась по наведению, для этого не годилась: она гасла, стоило увести
// курсор, и в неё нельзя было прицелиться. Постоянные значки занимают своё
// место всегда, поэтому строки не прыгают в момент появления.
//
// Глоссарий и переводы приходят пропсами, уже урезанными до этой главы —
// см. chapterGlossary/chapterTranslations в lib/reading.ts.

type Popup = { word: string; ru: string; lemma?: string; x: number; y: number };

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
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [voice, setVoice] = useState(true);
  const stopRef = useRef<(() => void) | null>(null);
  const queueRef = useRef<string[]>([]);

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
    const word = (e.target as HTMLElement).closest<HTMLElement>("[data-w]");
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
      if ((e.target as HTMLElement | null)?.closest("[data-w]")) return;
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

  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !(prev[id] ?? showAll) }));

  const stopSpeaking = () => {
    queueRef.current = [];
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(null);
  };

  // Озвучка идёт очередью: сейчас в ней всегда одно предложение, но очередь
  // оставлена намеренно — из неё же читается несколько подряд, если понадобится.
  const speakQueue = (ids: string[]) => {
    stopSpeaking();
    queueRef.current = ids.slice();
    const next = () => {
      const id = queueRef.current.shift();
      if (!id) {
        setPlaying(null);
        return;
      }
      setPlaying(id);
      stopRef.current = speakId(id, { onEnd: next });
    };
    next();
  };

  const speak = (id: string) => {
    if (playing === id) stopSpeaking();
    else speakQueue([id]);
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
        onMouseLeave={() => setPopup(null)}
        onClick={onClick}
        className="space-y-5 text-[1.0625rem] leading-[2] sm:text-lg"
      >
        {blocks.map((block, bi) =>
          !isProse(block) ? (
            <VocabBoxView key={bi} title={block.title} items={block.items} />
          ) : (
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
                const isPlaying = playing === sent.id;
                return (
                  <span key={si} className="group/sent">
                    <span
                      className={cn(
                        "rounded transition-colors",
                        isPlaying && "bg-primary/[0.08]",
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

                    {/* Значки конца предложения: не отрываются от него при
                        переносе строки и не тянут за собой курсив цитаты. */}
                    <span className="ml-1 inline-flex translate-y-[0.15em] items-center gap-0.5 whitespace-nowrap align-baseline not-italic">
                      {voice && (
                        <SentenceAction
                          active={isPlaying}
                          title={isPlaying ? "Остановить" : "Прослушать предложение"}
                          onClick={() => speak(sent.id)}
                        >
                          {isPlaying ? (
                            <Square className="h-2.5 w-2.5 fill-current" />
                          ) : (
                            <Volume2 className="h-[13px] w-[13px]" />
                          )}
                        </SentenceAction>
                      )}
                      {ru && (
                        <SentenceAction
                          active={isOpen}
                          title="Перевод предложения"
                          onClick={() => toggle(sent.id)}
                        >
                          <Languages className="h-[13px] w-[13px]" />
                        </SentenceAction>
                      )}
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
          ),
        )}
      </div>

      {popup && <WordPopup popup={popup} />}
    </div>
  );
}

// Значок действия в конце предложения. Приглушён, пока предложение не под
// курсором, — иначе две иконки после каждой фразы забивают полосу текста.
function SentenceAction({
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
        "inline-flex h-[18px] w-[18px] items-center justify-center rounded transition",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground/45 group-hover/sent:text-muted-foreground hover:!bg-secondary hover:!text-foreground",
      )}
    >
      {children}
    </button>
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

  // Всплывашка неизбежно накрывает строку выше — в плотном тексте её просто
  // некуда деть. Поэтому она полупрозрачная и с размытием под собой: видно,
  // что это слой поверх текста, а не слипшиеся строки.
  return (
    <div
      ref={ref}
      role="tooltip"
      style={{ left, top: popup.y - 10 }}
      className="pointer-events-none fixed z-50 max-w-[min(18rem,90vw)] -translate-x-1/2 -translate-y-full rounded-lg border bg-popover/85 px-2.5 py-1.5 text-center shadow-xl ring-1 ring-black/5 backdrop-blur-md"
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
