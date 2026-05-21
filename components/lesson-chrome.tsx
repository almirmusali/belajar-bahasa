"use client";

import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import type { Lesson } from "@/lib/lessons";

export function LessonHeader({ lesson }: { lesson: Lesson }) {
  const { locale } = useLocale();
  return (
    <>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {t(locale, "lessons_back_all")}
      </Link>
      {locale === "id" && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>{t(locale, "lessons_ru_only_notice")}</p>
        </div>
      )}
      <header className="mt-4 border-b pb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t(locale, "lessons_lesson")} {lesson.id}
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {lesson.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{lesson.subtitle}</p>
      </header>
    </>
  );
}

export function LessonComingSoon() {
  const { locale } = useLocale();
  return (
    <div className="mt-10 rounded-xl border bg-card p-10 text-center">
      <p className="text-lg font-medium">
        {t(locale, "lessons_coming_soon_title")}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {t(locale, "lessons_coming_soon_subtitle")}
      </p>
    </div>
  );
}

export function LessonNav({
  prev,
  next,
}: {
  prev?: Lesson;
  next?: Lesson;
}) {
  const { locale } = useLocale();
  return (
    <nav className="mt-12 flex items-center justify-between border-t pt-6 text-sm">
      {prev ? (
        <Link
          href={`/lessons/${prev.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          ← {t(locale, "lessons_lesson")} {prev.id}. {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/lessons/${next.id}`}
          className="text-right text-muted-foreground hover:text-foreground"
        >
          {t(locale, "lessons_lesson")} {next.id}. {next.title} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
