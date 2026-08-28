import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { DEFAULT_SKAZKA, getSkazka, illustrationUrl } from "@/lib/skazki";

export const dynamic = "force-static";

const book = getSkazka(DEFAULT_SKAZKA);

export const metadata: Metadata = {
  title: book ? `${book.title} — сказки на ночь` : "Сказки",
  description: book?.description,
};

export default function SkazkiIndex() {
  if (!book) {
    return (
      <>
        <SiteHeader />
        <main className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Сказка ещё не собрана.
        </main>
      </>
    );
  }

  const cover = illustrationUrl(book.slug, "cover");
  const totalMinutes = book.parts.reduce((sum, p) => sum + p.minutes, 0);

  return (
    <div className="min-h-screen bg-[#fdf8ef] text-[#3b2f26] dark:bg-[#171310] dark:text-[#ece1d4]">
      <SiteHeader />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <header className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="w-48 shrink-0 rounded-2xl shadow-lg shadow-black/10 sm:w-56"
            />
          ) : (
            <div className="flex aspect-[3/4] w-48 shrink-0 items-center justify-center rounded-2xl bg-[#f2e4cf] text-5xl dark:bg-[#2a221c] sm:w-56">
              🦔
            </div>
          )}
          <div className="text-center sm:text-left">
            <span className="rounded-full bg-[#f0e0c6] px-3 py-1 text-xs uppercase tracking-widest text-[#8a6b42] dark:bg-[#2f2519] dark:text-[#c9a978]">
              {book.ageHint}
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl">
              {book.title}
            </h1>
            <p className="mt-1 text-lg text-[#8a7460] dark:text-[#a4917d]">{book.subtitle}</p>
            <p className="mt-4 text-balance leading-relaxed text-[#5d4c3e] dark:text-[#c4b5a4]">
              {book.description}
            </p>
            <p className="mt-4 text-sm text-[#8a7460] dark:text-[#a4917d]">
              {book.parts.length} частей · примерно {totalMinutes} минут чтения вслух
            </p>
            <Link
              href={`/skazki/${book.parts[0]?.num ?? 1}`}
              className="mt-5 inline-block rounded-xl bg-[#c9622e] px-5 py-3 font-medium text-white transition hover:bg-[#b1541f]"
            >
              Читать с первой части
            </Link>
          </div>
        </header>

        {/* Полка обложек: у каждой части своя, с номером и названием прямо на
            картинке. Ребёнок выбирает следующую сказку сам, по картинке, — для
            четырёх лет это единственный способ ориентироваться в оглавлении. */}
        <ol className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {book.parts.map((part) => {
            const partCover = illustrationUrl(
              book.slug,
              `p${String(part.num).padStart(2, "0")}-cover`,
            );
            return (
              <li key={part.num}>
                <Link href={`/skazki/${part.num}`} className="group block">
                  {partCover ? (
                    <img
                      src={partCover}
                      alt={`Часть ${part.num}. ${part.title}`}
                      loading="lazy"
                      className="w-full rounded-xl shadow-sm shadow-black/10 transition group-hover:-translate-y-1 group-hover:shadow-md"
                    />
                  ) : (
                    <span className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-xl bg-[#f2e4cf] p-3 text-center dark:bg-[#2a221c]">
                      <span className="text-xs uppercase tracking-widest text-[#a0794a]">
                        Часть {part.num}
                      </span>
                      <span className="mt-2 font-serif text-base font-semibold leading-snug">
                        {part.title}
                      </span>
                    </span>
                  )}
                  <span className="mt-2 block text-sm leading-snug text-[#6d5a49] dark:text-[#b3a291]">
                    {part.teaser}
                  </span>
                  <span className="mt-1 block text-xs text-[#a08a72] dark:text-[#8b7a68]">
                    ~{part.minutes} мин{part.theme ? ` · ${part.theme}` : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
