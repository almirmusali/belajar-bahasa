import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, List } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ActivityTracker } from "@/components/activity-tracker";
import { RememberChapter } from "@/components/reading-position";
import { Reader } from "@/components/reader";
import {
  bookSlugs,
  chapterGlossary,
  chapterTranslations,
  getBook,
  getGlossary,
  getTranslations,
} from "@/lib/reading";

export function generateStaticParams() {
  return bookSlugs().flatMap((slug) => {
    const book = getBook(slug);
    return (book?.chapters ?? []).map((ch) => ({
      slug,
      chapter: String(ch.id),
    }));
  });
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = await params;
  const book = getBook(slug);
  const index = Number(chapter);
  if (!book || !Number.isInteger(index)) notFound();
  const current = book.chapters[index];
  if (!current) notFound();

  // В браузер уезжает только эта глава: её предложения, её переводы и
  // тот кусок глоссария, который в ней реально встречается.
  const translations = chapterTranslations(current, getTranslations(slug));
  const glossary = chapterGlossary(current, getGlossary(slug));

  const prev = book.chapters[index - 1];
  const next = book.chapters[index + 1];

  return (
    <>
      <SiteHeader />
      <ActivityTracker />
      <RememberChapter slug={slug} chapter={index} />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <Link
            href={`/reading/${slug}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <List className="h-4 w-4" />
            Оглавление
          </Link>
          <span className="text-xs">
            {index + 1} из {book.chapters.length}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {current.num !== null && (
            <span className="mr-2 text-muted-foreground">{current.num}.</span>
          )}
          {current.title}
        </h1>

        <div className="mt-6">
          <Reader
            blocks={current.blocks}
            translations={translations}
            glossary={glossary}
          />
        </div>

        <nav className="mt-12 flex items-stretch justify-between gap-3 border-t pt-6">
          {prev ? (
            <Link
              href={`/reading/${slug}/${prev.id}`}
              className="group flex max-w-[48%] items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:border-primary"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              <span className="truncate">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/reading/${slug}/${next.id}`}
              className="group flex max-w-[48%] items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:border-primary"
            >
              <span className="truncate">{next.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          ) : (
            <Link
              href={`/reading/${slug}/appendix`}
              className="group flex max-w-[48%] items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:border-primary"
            >
              <span className="truncate">Словарь книги</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          )}
        </nav>
      </main>
    </>
  );
}
