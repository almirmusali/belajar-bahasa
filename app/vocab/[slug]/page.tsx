import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { FlashcardPlayer } from "@/components/flashcard-player";
import { VocabSetChrome } from "@/components/vocab-set-chrome";
import { ActivityTracker } from "@/components/activity-tracker";
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
      <ActivityTracker />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <VocabSetChrome set={set} />
        <FlashcardPlayer words={set.words} slug={set.slug} />
      </main>
    </>
  );
}
