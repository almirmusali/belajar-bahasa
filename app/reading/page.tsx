import Link from "next/link";
import { BookOpen, Languages, Volume2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BookCardProgress } from "@/components/reading-position";
import {
  bookSlugs,
  chapterSize,
  coverUrl,
  getBook,
  getTranslations,
  uniqueSentenceCount,
} from "@/lib/reading";

export default function ReadingIndexPage() {
  const books = bookSlugs()
    .map((slug) => getBook(slug))
    .filter((b) => b !== null)
    .map((book) => {
      const weights = book.chapters.map((c) => chapterSize(c).words);
      const words = weights.reduce((a, b) => a + b, 0);
      const sentences = uniqueSentenceCount(book);
      const tr = getTranslations(book.slug);
      return {
        book,
        weights,
        words,
        sentences,
        translated: Object.keys(tr).length,
        titleRu: tr[book.title] ?? null,
        subtitleRu: tr[book.subtitle] ?? null,
        cover: coverUrl(book.slug),
      };
    });

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Чтение
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Библиотека
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Книги на разговорном индонезийском и простом английском. Наведи на
          слово — увидишь перевод, нажми кнопку у предложения — получишь
          перевод целиком или озвучку.
        </p>

        {books.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            Пока ни одной книги. Положи .md в data/reading/ и запусти{" "}
            <code className="rounded bg-secondary px-1">
              npm run reading:build
            </code>
            .
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {books.map(({ book, weights, words, sentences, translated, cover, titleRu, subtitleRu }) => (
              <Link
                key={book.slug}
                href={`/reading/${book.slug}`}
                className="group flex gap-4 rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-md"
              >
                <div className="h-fit w-[92px] shrink-0 self-start overflow-hidden rounded-md border shadow-sm">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={`Обложка: ${book.title}`}
                      className="aspect-[2/3] w-full object-cover transition group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex aspect-[2/3] w-full items-center justify-center bg-secondary">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col">
                  <h2 className="text-base font-semibold leading-snug group-hover:text-primary">
                    {book.title}
                  </h2>
                  {titleRu && (
                    <p className="text-sm text-muted-foreground">{titleRu}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {book.subtitle}
                    {subtitleRu && ` · ${subtitleRu}`}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {book.chapters.length} глав · {words.toLocaleString("ru")} слов
                  </p>
                  <div className="mt-auto pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge icon={<Languages className="h-3 w-3" />}>
                        {translated >= sentences
                          ? "перевод по предложениям"
                          : `перевод ${translated}/${sentences}`}
                      </Badge>
                      <Badge icon={<Volume2 className="h-3 w-3" />}>озвучка</Badge>
                    </div>
                    <BookCardProgress slug={book.slug} weights={weights} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function Badge({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}
