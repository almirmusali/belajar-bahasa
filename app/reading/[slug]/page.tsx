import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookMarked } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ActivityTracker } from "@/components/activity-tracker";
import { ChapterMark, ResumeReading } from "@/components/reading-position";
import {
  bookSlugs,
  chapterSize,
  coverUrl,
  getBook,
  getTranslations,
} from "@/lib/reading";

export function generateStaticParams() {
  return bookSlugs().map((slug) => ({ slug }));
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getBook(slug);
  if (!book) notFound();
  const cover = coverUrl(slug);
  const tr = getTranslations(slug);
  // Веса глав для процента прочитанного: длинная глава двигает полосу сильнее.
  const weights = book.chapters.map((c) => chapterSize(c).words);
  const words = weights.reduce((a, b) => a + b, 0);

  return (
    <>
      <SiteHeader />
      <ActivityTracker />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/reading"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Все книги
        </Link>

        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`Обложка: ${book.title}`}
              className="w-40 shrink-0 self-center rounded-lg border shadow-md sm:self-start"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {book.title}
            </h1>
            {tr[book.title] && (
              <p className="mt-1 text-lg text-muted-foreground">
                {tr[book.title]}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {book.subtitle}
              {tr[book.subtitle] && ` · ${tr[book.subtitle]}`}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {book.chapters.length} глав · {words.toLocaleString("ru")} слов ·
              перевод каждого слова и предложения, озвучка
            </p>
            <ResumeReading
              slug={book.slug}
              chapters={book.chapters.length}
              weights={weights}
            />
          </div>
        </div>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Оглавление
        </h2>
        <ol className="mt-3 divide-y rounded-xl border bg-card">
          {book.chapters.map((ch) => {
            const size = chapterSize(ch);
            return (
              <li key={ch.id}>
                <Link
                  href={`/reading/${book.slug}/${ch.id}`}
                  className="flex items-baseline gap-3 px-5 py-3 transition hover:bg-secondary/60"
                >
                  <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
                    {ch.num ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{ch.title}</span>
                    {tr[ch.title] && (
                      <span className="block text-sm text-muted-foreground">
                        {tr[ch.title]}
                      </span>
                    )}
                  </span>
                  <ChapterMark slug={book.slug} chapter={ch.id} />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {size.words} слов
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        {book.appendix && (
          <Link
            href={`/reading/${book.slug}/appendix`}
            className="mt-4 flex items-center gap-3 rounded-xl border bg-card px-5 py-4 transition hover:border-primary hover:bg-secondary/60"
          >
            <BookMarked className="h-5 w-5 text-muted-foreground" />
            <span>
              <span className="font-medium">Словарь книги</span>
              <span className="block text-xs text-muted-foreground">
                {book.lang === "en"
                  ? "Мир книги, главные даты, как читать"
                  : "Частицы, разговорные формы, сунданские слова, грамматика"}
              </span>
            </span>
          </Link>
        )}
      </main>
    </>
  );
}
