"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { LessonCheckmark } from "@/components/lesson-complete-button";
import { lessons } from "@/lib/lessons";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function Home() {
  const { locale } = useLocale();
  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <section className="mx-auto max-w-2xl text-center">
          <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            {t(locale, "home_badge")}
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {t(locale, "home_title")}
          </h1>
          <p className="mt-4 text-balance text-base text-muted-foreground sm:text-lg">
            {t(locale, "home_subtitle")}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="#lessons"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t(locale, "home_cta_lessons")}
            </Link>
            <Link
              href="/vocab"
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t(locale, "home_cta_vocab")}
            </Link>
          </div>
        </section>

        <section
          id="lessons"
          className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2"
        >
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={lesson.available ? `/lessons/${lesson.id}` : "#"}
              aria-disabled={!lesson.available}
              className={cn(
                "group rounded-xl border bg-card p-5 transition",
                lesson.available
                  ? "hover:border-primary hover:shadow-sm"
                  : "pointer-events-none opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t(locale, "home_lesson")} {lesson.id}
                </div>
                <div className="flex items-center gap-2">
                  <LessonCheckmark lessonId={lesson.id} />
                  {!lesson.available && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t(locale, "home_soon")}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="mt-1 text-lg font-semibold leading-snug group-hover:text-primary">
                {lesson.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lesson.subtitle}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lesson.topics.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
