import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { lessons } from "@/lib/lessons";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <section className="mx-auto max-w-2xl text-center">
          <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            Bahasa Indonesia
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Индонезийский за 16 уроков
          </h1>
          <p className="mt-4 text-balance text-base text-muted-foreground sm:text-lg">
            Курс по образцу &laquo;Полиглота&raquo;: короткие уроки, грамматические
            матрицы и устные упражнения. Подходит тем, кто начинает с нуля.
          </p>
        </section>

        <section className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
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
                  Урок {lesson.id}
                </div>
                {!lesson.available && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Скоро
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-lg font-semibold leading-snug group-hover:text-primary">
                {lesson.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{lesson.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lesson.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {t}
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
