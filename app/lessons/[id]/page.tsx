import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getLesson, lessons } from "@/lib/lessons";
import { Lesson01 } from "./lesson-01";

export function generateStaticParams() {
  return lessons.map((l) => ({ id: String(l.id) }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = getLesson(Number(id));
  if (!lesson) notFound();

  const prev = lessons.find((l) => l.id === lesson.id - 1);
  const next = lessons.find((l) => l.id === lesson.id + 1);

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Все уроки
        </Link>

        <header className="mt-4 border-b pb-6">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Урок {lesson.id}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {lesson.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{lesson.subtitle}</p>
        </header>

        {lesson.available ? (
          lesson.id === 1 ? (
            <Lesson01 />
          ) : (
            <ComingSoon />
          )
        ) : (
          <ComingSoon />
        )}

        <nav className="mt-12 flex items-center justify-between border-t pt-6 text-sm">
          {prev ? (
            <Link
              href={`/lessons/${prev.id}`}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Урок {prev.id}. {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/lessons/${next.id}`}
              className="text-right text-muted-foreground hover:text-foreground"
            >
              Урок {next.id}. {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
    </>
  );
}

function ComingSoon() {
  return (
    <div className="mt-10 rounded-xl border bg-card p-10 text-center">
      <p className="text-lg font-medium">Урок скоро появится</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Сейчас доступен только Урок 1 — структура остальных уроков уже намечена.
      </p>
    </div>
  );
}
