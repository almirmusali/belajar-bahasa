import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { FlashcardPlayer } from "@/components/flashcard-player";
import { getAllVocabSets, getVocabSet } from "@/lib/vocab";

export function generateStaticParams() {
  return getAllVocabSets().map((s) => ({ slug: s.slug }));
}

export default async function VocabSetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const set = getVocabSet(slug);
  if (!set) notFound();

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/vocab"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Все наборы
        </Link>

        <header className="mt-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{set.title}</h1>
          {set.description && (
            <p className="mt-1 text-muted-foreground">{set.description}</p>
          )}
        </header>

        <FlashcardPlayer words={set.words} />
      </main>
    </>
  );
}
