import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { bookSlugs, getBook } from "@/lib/reading";
import { renderMarkdown } from "@/lib/markdown";

// Только собранные на билде страницы — рантайм-рендера нет (см. next.config.mjs).
export const dynamicParams = false;

export function generateStaticParams() {
  return bookSlugs().map((slug) => ({ slug }));
}

export default async function AppendixPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getBook(slug);
  if (!book?.appendix) notFound();

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/reading/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {book.title}
        </Link>
        <article
          className="mt-4 leading-relaxed [&_p]:mt-3 [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(book.appendix) }}
        />
      </main>
    </>
  );
}
