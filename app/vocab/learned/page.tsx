import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { LearnedList } from "@/components/learned-list";
import { getAllVocabSets } from "@/lib/vocab";

export default function LearnedPage() {
  const sets = getAllVocabSets();

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/vocab"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Все наборы
        </Link>

        <header className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight">Выученные слова</h1>
          <p className="mt-1 text-muted-foreground">
            Слова, которые ты отметил «знаю». Они исключены из автоповтора, но
            всегда здесь, если захочешь повторить или вернуть в учёбу.
          </p>
        </header>

        <LearnedList sets={sets} />
      </main>
    </>
  );
}
