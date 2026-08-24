"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Pencil, Trash2, X } from "lucide-react";
import { FlashcardPlayer } from "@/components/flashcard-player";
import {
  FAVORITES_ID,
  useWordSets,
  userSetSlug,
} from "@/lib/use-word-sets";
import { cn, plural } from "@/lib/utils";

// Свой набор: те же карточки, что и у готовых наборов, плюс правка состава —
// слова сюда попадают по одному из читалки, так что чистить и раскладывать
// их по темам нужно прямо здесь.

export function MySetView({ id }: { id: string }) {
  const {
    sets,
    mounted,
    getSet,
    renameSet,
    deleteSet,
    removeWord,
    moveWords,
  } = useWordSets();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const set = getSet(id);

  if (!mounted) {
    return <main className="container mx-auto max-w-3xl px-4 py-10" />;
  }

  if (!set) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/vocab"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Все наборы
        </Link>
        <p className="mt-8 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Такого набора нет. Возможно, он был удалён.
        </p>
      </main>
    );
  }

  const toggle = (wordId: string) =>
    setPicked((prev) =>
      prev.includes(wordId)
        ? prev.filter((x) => x !== wordId)
        : [...prev, wordId],
    );

  const targets = sets.filter((s) => s.id !== set.id);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/vocab"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Все наборы
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {editing ? (
          <>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  renameSet(set.id, title);
                  setEditing(false);
                }
                if (e.key === "Escape") setEditing(false);
              }}
              className="min-w-0 flex-1 rounded-md border bg-background px-3 py-1.5 text-xl font-bold outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => {
                renameSet(set.id, title);
                setEditing(false);
              }}
              className="rounded-md border p-2 hover:bg-secondary"
              aria-label="Сохранить название"
            >
              <Check className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {set.title}
            </h1>
            {/* «Избранное» — служебный набор: переименовать и удалить нельзя,
                иначе слова из читалки станет некуда класть. */}
            {set.id !== FAVORITES_ID && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTitle(set.title);
                    setEditing(true);
                  }}
                  className="rounded-md border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Переименовать набор"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Удалить набор «${set.title}»?`)) {
                      deleteSet(set.id);
                      location.href = "/vocab";
                    }
                  }}
                  className="rounded-md border p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Удалить набор"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {set.words.length} {plural(set.words.length, ["слово", "слова", "слов"])}
      </p>

      {set.words.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          В наборе пока нет слов. Открой{" "}
          <Link href="/reading" className="text-primary hover:underline">
            книгу
          </Link>
          , нажми на слово и добавь его звёздочкой.
        </p>
      ) : (
        <>
          <div className="mt-6">
            <FlashcardPlayer words={set.words} slug={userSetSlug(set.id)} />
          </div>

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Слова набора
              </h2>
              {picked.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    выбрано {picked.length}
                  </span>
                  {targets.length > 0 && (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        moveWords(set.id, e.target.value, picked);
                        setPicked([]);
                        e.target.value = "";
                      }}
                      className="rounded-md border bg-background px-2 py-1 outline-none focus:border-primary"
                    >
                      <option value="">Перенести в…</option>
                      {targets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      picked.forEach((w) => removeWord(set.id, w));
                      setPicked([]);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                    Удалить
                  </button>
                </div>
              )}
            </div>

            <ul className="mt-3 divide-y rounded-xl border bg-card">
              {set.words.map((word) => {
                const on = picked.includes(word.id);
                return (
                  <li key={word.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition",
                        on ? "bg-secondary/70" : "hover:bg-secondary/40",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(word.id)}
                        className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{word.id}</span>
                        <span className="text-muted-foreground"> — {word.ru}</span>
                        {word.note && (
                          <span className="block text-xs text-muted-foreground">
                            {word.note}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeWord(set.id, word.id);
                        }}
                        className="shrink-0 rounded p-1 text-muted-foreground/60 hover:bg-secondary hover:text-foreground"
                        aria-label={`Убрать ${word.id}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
