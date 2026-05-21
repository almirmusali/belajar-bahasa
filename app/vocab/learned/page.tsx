import { SiteHeader } from "@/components/site-header";
import { LearnedList } from "@/components/learned-list";
import { LearnedPageChrome } from "@/components/learned-page-chrome";
import { getAllVocabSets } from "@/lib/vocab";

export default function LearnedPage() {
  const sets = getAllVocabSets();
  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <LearnedPageChrome />
        <LearnedList sets={sets} />
      </main>
    </>
  );
}
