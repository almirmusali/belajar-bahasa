"use client";

import { useCallback, useEffect, useState } from "react";

// Прогресс чтения книг: где читатель остановился и сколько уже прочитано.
//
// Хранится в localStorage, как избранное и статистика: чтение — занятие на
// много заходов, но требовать ради закладки аккаунт не хочется. Прогресс
// принадлежит устройству и на другую машину не переезжает.
//
// Одна запись на книгу:
//   chapter   последняя открытая глава (её id, он же индекс в оглавлении);
//   block     абзац внутри неё, до которого дочитали, — это и есть закладка;
//   chapters  доля прочитанного по каждой главе, 0..1.
//
// Доли по главам только растут: перечитал начало главы — полоса не откатилась
// назад. А закладка (chapter/block) всегда показывает последнее место, где
// читатель был на самом деле.

const KEY = "belajar:reading:v1";
const EVENT = "belajar:reading-changed";

/** Ключ первой версии — помнил только номер главы. Читается на подхвате. */
const legacyKey = (slug: string) => `reading:${slug}:chapter`;

export type BookProgress = {
  chapter: number;
  block: number;
  updatedAt: number;
  chapters: Record<string, number>;
};

type Store = Record<string, BookProgress>;

const EMPTY: BookProgress = { chapter: 0, block: 0, updatedAt: 0, chapters: {} };

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function write(next: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** Прогресс по книге или null, если её ещё не открывали. */
export function readBook(slug: string): BookProgress | null {
  if (typeof window === "undefined") return null;
  const hit = read()[slug];
  if (hit) {
    return {
      chapter: Number(hit.chapter) || 0,
      block: Number(hit.block) || 0,
      updatedAt: Number(hit.updatedAt) || 0,
      chapters: hit.chapters && typeof hit.chapters === "object" ? hit.chapters : {},
    };
  }
  try {
    const raw = window.localStorage.getItem(legacyKey(slug));
    const n = raw === null ? NaN : Number(raw);
    if (Number.isInteger(n) && n >= 0) return { ...EMPTY, chapter: n };
  } catch {}
  return null;
}

function update(slug: string, patch: (prev: BookProgress) => BookProgress) {
  if (typeof window === "undefined") return;
  const store = read();
  const prev = readBook(slug) ?? EMPTY;
  store[slug] = { ...patch(prev), updatedAt: Date.now() };
  write(store);
}

/**
 * Глава открыта. Позицию внутри неё не трогаем: закладка ставится по
 * прокрутке, а сам факт открытия не значит, что читатель вернулся в начало.
 */
export function touchChapter(slug: string, chapter: number) {
  update(slug, (prev) => ({
    ...prev,
    chapter,
    block: prev.chapter === chapter ? prev.block : 0,
  }));
}

/** Закладка переехала на абзац `block` главы из `blocks` абзацев. */
export function savePosition(
  slug: string,
  chapter: number,
  block: number,
  blocks: number,
  done = false,
) {
  update(slug, (prev) => {
    const fraction = done ? 1 : blocks > 0 ? Math.min(1, (block + 1) / blocks) : 0;
    const key = String(chapter);
    return {
      ...prev,
      chapter,
      block,
      chapters: {
        ...prev.chapters,
        [key]: Math.max(prev.chapters[key] ?? 0, fraction),
      },
    };
  });
}

/** Забыть книгу: прогресс сбрасывается в «не начата». */
export function clearBook(slug: string) {
  if (typeof window === "undefined") return;
  const store = read();
  delete store[slug];
  try {
    window.localStorage.removeItem(legacyKey(slug));
  } catch {}
  write(store);
}

/** Доля прочитанного в главе, 0..1. */
export function chapterFraction(progress: BookProgress | null, chapter: number): number {
  const v = progress?.chapters[String(chapter)];
  return typeof v === "number" && v > 0 ? Math.min(1, v) : 0;
}

/**
 * Процент книги. Главы взвешены по числу слов: пятистраничная глава двигает
 * полосу сильнее, чем полстраничная, — иначе прогресс врал бы.
 */
export function bookPercent(progress: BookProgress | null, weights: number[]): number {
  if (!progress) return 0;
  const total = weights.reduce((a, b) => a + b, 0);
  if (!total) return 0;
  const done = weights.reduce(
    (a, w, i) => a + w * chapterFraction(progress, i),
    0,
  );
  const pct = (done / total) * 100;
  // Начатую книгу не показываем нулём, дочитанную — не округляем до 100.
  if (pct > 0 && pct < 1) return 1;
  if (pct > 99 && pct < 100) return 99;
  return Math.round(pct);
}

/** Прогресс по книге, живой: обновляется при записи в соседней вкладке тоже. */
export function useBookProgress(slug: string) {
  const [progress, setProgress] = useState<BookProgress | null>(null);
  const [mounted, setMounted] = useState(false);

  const sync = useCallback(() => setProgress(readBook(slug)), [slug]);

  useEffect(() => {
    sync();
    setMounted(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return { progress, mounted };
}
