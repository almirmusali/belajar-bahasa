"use client";

import { useCallback, useEffect, useState } from "react";
import type { Word } from "./vocab";

// Свои наборы слов: собираются прямо во время чтения (звёздочка во
// всплывашке над словом) и учатся теми же карточками, что и готовые наборы
// из data/vocab.
//
// Хранилище — localStorage, как у прогресса и выученных слов: наборы
// принадлежат этому устройству и не требуют аккаунта. Событие нужно, чтобы
// открытые рядом экраны (каталог, страница набора, читалка) обновлялись
// одновременно, — storage-событие в своей же вкладке не срабатывает.

const KEY = "belajar:wordsets:v1";
const EVENT = "belajar:wordsets-changed";

/** Набор «Избранное» есть всегда: это входящие для слов из читалки. */
export const FAVORITES_ID = "favorites";
export const FAVORITES_TITLE = "Избранное";

export type UserSet = {
  id: string;
  title: string;
  createdAt: number;
  words: Word[];
};

function read(): UserSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is UserSet =>
        s && typeof s.id === "string" && Array.isArray(s.words),
    );
  } catch {
    return [];
  }
}

function write(next: UserSet[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

/** Избранное создаётся лениво — пустой набор в списке выглядел бы мусором. */
function ensureFavorites(sets: UserSet[]): UserSet[] {
  if (sets.some((s) => s.id === FAVORITES_ID)) return sets;
  return [
    { id: FAVORITES_ID, title: FAVORITES_TITLE, createdAt: Date.now(), words: [] },
    ...sets,
  ];
}

export function useWordSets() {
  const [sets, setSets] = useState<UserSet[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sync = () => setSets(read());
    sync();
    setMounted(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((fn: (prev: UserSet[]) => UserSet[]) => {
    const next = fn(read());
    write(next);
    setSets(next);
  }, []);

  const createSet = useCallback(
    (title: string) => {
      const id = `s${Date.now().toString(36)}`;
      update((prev) => [
        ...ensureFavorites(prev),
        { id, title: title.trim() || "Без названия", createdAt: Date.now(), words: [] },
      ]);
      return id;
    },
    [update],
  );

  const renameSet = useCallback(
    (id: string, title: string) =>
      update((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: title.trim() || s.title } : s)),
      ),
    [update],
  );

  const deleteSet = useCallback(
    (id: string) => update((prev) => prev.filter((s) => s.id !== id)),
    [update],
  );

  const addWord = useCallback(
    (setId: string, word: Word) =>
      update((prev) =>
        ensureFavorites(prev).map((s) =>
          s.id === setId && !s.words.some((w) => w.id === word.id)
            ? { ...s, words: [...s.words, word] }
            : s,
        ),
      ),
    [update],
  );

  const removeWord = useCallback(
    (setId: string, wordId: string) =>
      update((prev) =>
        prev.map((s) =>
          s.id === setId
            ? { ...s, words: s.words.filter((w) => w.id !== wordId) }
            : s,
        ),
      ),
    [update],
  );

  /** Перенос между наборами: слово уходит из исходного и появляется в целевом. */
  const moveWords = useCallback(
    (fromId: string, toId: string, wordIds: string[]) =>
      update((prev) => {
        const ids = new Set(wordIds);
        const moving = prev
          .find((s) => s.id === fromId)
          ?.words.filter((w) => ids.has(w.id)) ?? [];
        return prev.map((s) => {
          if (s.id === fromId) {
            return { ...s, words: s.words.filter((w) => !ids.has(w.id)) };
          }
          if (s.id === toId) {
            const have = new Set(s.words.map((w) => w.id));
            return { ...s, words: [...s.words, ...moving.filter((w) => !have.has(w.id))] };
          }
          return s;
        });
      }),
    [update],
  );

  const toggleFavorite = useCallback(
    (word: Word) =>
      update((prev) => {
        const withFav = ensureFavorites(prev);
        return withFav.map((s) => {
          if (s.id !== FAVORITES_ID) return s;
          const has = s.words.some((w) => w.id === word.id);
          return {
            ...s,
            words: has
              ? s.words.filter((w) => w.id !== word.id)
              : [...s.words, word],
          };
        });
      }),
    [update],
  );

  const getSet = useCallback(
    (id: string) => sets.find((s) => s.id === id) ?? null,
    [sets],
  );

  const isFavorite = useCallback(
    (wordId: string) =>
      sets.find((s) => s.id === FAVORITES_ID)?.words.some((w) => w.id === wordId) ??
      false,
    [sets],
  );

  return {
    sets,
    mounted,
    getSet,
    createSet,
    renameSet,
    deleteSet,
    addWord,
    removeWord,
    moveWords,
    toggleFavorite,
    isFavorite,
  };
}

/** Slug для FlashcardPlayer и прогресса: свои наборы не путаются с data/vocab. */
export const userSetSlug = (id: string) => `my:${id}`;
