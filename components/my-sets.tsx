"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Star, WalletCards } from "lucide-react";
import { FAVORITES_ID, useWordSets } from "@/lib/use-word-sets";
import { cn, plural } from "@/lib/utils";

// Блок «Мои наборы» в каталоге словаря. Наборы живут в localStorage, поэтому
// до монтирования их нет — рендерим только после, иначе разъедется гидрация.

export function MySets() {
  const { sets, mounted, createSet } = useWordSets();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  if (!mounted) return null;

  const submit = () => {
    const name = title.trim();
    if (name) createSet(name);
    setTitle("");
    setAdding(false);
  };

  return (
    <section className="mx-auto mt-10 max-w-4xl">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Мои наборы
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            Новый набор
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setTitle("");
                setAdding(false);
              }
            }}
            placeholder="Название набора"
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Создать
          </button>
        </div>
      )}

      {sets.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Пока пусто. Нажми на слово в{" "}
          <Link href="/reading" className="text-primary hover:underline">
            книге
          </Link>{" "}
          и добавь его звёздочкой — оно попадёт в «Избранное».
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/vocab/my/${set.id}`}
              className={cn(
                "group flex items-start gap-3 rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-sm",
                set.words.length === 0 && "opacity-70",
              )}
            >
              {set.id === FAVORITES_ID ? (
                <Star className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              ) : (
                <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
              )}
              <div className="min-w-0">
                <div className="truncate font-medium group-hover:text-primary">
                  {set.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {set.words.length}{" "}
                  {plural(set.words.length, ["слово", "слова", "слов"])}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
