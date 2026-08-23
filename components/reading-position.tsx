"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

// Где читатель остановился. Хранится в localStorage: чтение — занятие
// на много заходов, а требовать ради этого аккаунт не хочется.
const key = (slug: string) => `reading:${slug}:chapter`;

/** Ставится на страницу главы: молча запоминает, что глава открыта. */
export function RememberChapter({
  slug,
  chapter,
}: {
  slug: string;
  chapter: number;
}) {
  useEffect(() => {
    try {
      localStorage.setItem(key(slug), String(chapter));
    } catch {}
  }, [slug, chapter]);
  return null;
}

/** Кнопка «продолжить» на обложке книги. */
export function ResumeReading({
  slug,
  chapters,
}: {
  slug: string;
  chapters: number;
}) {
  const [at, setAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(slug));
      const n = raw === null ? NaN : Number(raw);
      if (Number.isInteger(n) && n >= 0 && n < chapters) setAt(n);
    } catch {}
  }, [slug, chapters]);

  return (
    <Link
      href={`/reading/${slug}/${at ?? 0}`}
      className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
    >
      <BookOpen className="h-4 w-4" />
      {at === null ? "Начать читать" : `Продолжить — глава ${at + 1}`}
    </Link>
  );
}
