import { SiteHeader } from "@/components/site-header";
import { VocabCatalog } from "@/components/vocab-catalog";
import { getAllVocabSets } from "@/lib/vocab";

export default function VocabIndexPage() {
  const sets = getAllVocabSets();
  return (
    <>
      <SiteHeader />
      <VocabCatalog sets={sets} />
    </>
  );
}
