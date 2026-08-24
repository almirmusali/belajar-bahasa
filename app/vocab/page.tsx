import { SiteHeader } from "@/components/site-header";
import { VocabCatalog } from "@/components/vocab-catalog";
import { MySets } from "@/components/my-sets";
import { getAllVocabSets } from "@/lib/vocab";

export default function VocabIndexPage() {
  const sets = getAllVocabSets();
  return (
    <>
      <SiteHeader />
      <VocabCatalog sets={sets} />
      <div className="container mx-auto px-4 pb-12">
        <MySets />
      </div>
    </>
  );
}
