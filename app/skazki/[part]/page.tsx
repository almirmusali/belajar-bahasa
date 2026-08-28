import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DEFAULT_SKAZKA, getSkazka, illustrationUrl } from "@/lib/skazki";

export const dynamicParams = false;

const book = getSkazka(DEFAULT_SKAZKA);

export function generateStaticParams() {
  return (book?.parts ?? []).map((p) => ({ part: String(p.num) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ part: string }>;
}): Promise<Metadata> {
  const { part } = await params;
  const p = book?.parts.find((x) => x.num === Number(part));
  if (!p) return {};
  return {
    title: `${p.num}. ${p.title} — ${book?.title}`,
    description: p.teaser,
  };
}

export default async function SkazkaPart({
  params,
}: {
  params: Promise<{ part: string }>;
}) {
  const { part } = await params;
  const num = Number(part);
  const p = book?.parts.find((x) => x.num === num);
  if (!book || !p) notFound();

  const prev = book.parts.find((x) => x.num === num - 1);
  const next = book.parts.find((x) => x.num === num + 1);
  const cover = illustrationUrl(book.slug, `p${String(num).padStart(2, "0")}-cover`);

  return (
    <div className="min-h-screen bg-[#fdf8ef] text-[#3b2f26] dark:bg-[#171310] dark:text-[#ece1d4]">
      <SiteHeader />
      <main className="container mx-auto max-w-2xl px-4 pb-16 pt-8">
        <nav className="text-sm text-[#a08a72] dark:text-[#8b7a68]">
          <Link href="/skazki" className="hover:text-[#c9622e]">
            {book.title}
          </Link>
          <span className="mx-2">·</span>
          <span>
            часть {p.num} из {book.parts.length}
          </span>
        </nav>

        {/* Название части уже набрано на обложке, поэтому при ней заголовок
            уходит только в разметку — для читалок с экрана и поиска. */}
        <h1
          className={
            cover
              ? "sr-only"
              : "mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl"
          }
        >
          {p.title}
        </h1>
        {cover ? (
          <img
            src={cover}
            alt={`Часть ${p.num}. ${p.title}`}
            className="mx-auto mt-5 w-full max-w-sm rounded-2xl shadow-md shadow-black/10"
          />
        ) : null}
        <p className="mt-4 text-center text-sm text-[#a08a72] dark:text-[#8b7a68]">
          ~{p.minutes} минут вслух{p.theme ? ` · ${p.theme}` : ""}
        </p>

        {/* Текст крупный намеренно: читает взрослый вслух, часто в полутьме,
            держа телефон на вытянутой руке над кроватью. */}
        <article className="mt-8 font-serif text-[1.3rem] leading-[1.85] sm:text-[1.4rem]">
          {p.blocks.map((block, i) => {
            if (block.type === "image") {
              const src = illustrationUrl(book.slug, block.file);
              if (!src) return null;
              return (
                <figure key={i} className="-mx-1 my-9 sm:mx-0">
                  <img
                    src={src}
                    alt={block.alt}
                    loading="lazy"
                    className="w-full rounded-2xl shadow-md shadow-black/5"
                  />
                </figure>
              );
            }
            return (
              <div key={i}>
                {block.text.split("\n\n").map((para, j) => (
                  <p key={j} className="mb-5">
                    {para}
                  </p>
                ))}
              </div>
            );
          })}
        </article>

        <p className="my-10 border-l-4 border-[#e0a458] bg-[#fbf0dc] px-5 py-4 font-serif text-[1.25rem] italic leading-relaxed text-[#7a5a2e] dark:bg-[#241c13] dark:text-[#d9b982]">
          {p.moral}
        </p>

        <section className="rounded-2xl bg-[#f4e9d6] px-5 py-5 dark:bg-[#221b15]">
          <h2 className="text-xs uppercase tracking-widest text-[#a0794a] dark:text-[#c9a978]">
            А дальше
          </h2>
          <p className="mt-2 font-serif text-[1.25rem] leading-relaxed">{p.cliffhanger}</p>
        </section>

        {/* Ритуальное прощание одинаково во всех двадцати частях, поэтому живёт
            в вёрстке, а не в тексте: ребёнок узнаёт его как сигнал ко сну. */}
        <p className="mt-10 text-center font-serif text-[1.3rem] leading-relaxed text-[#8a7460] dark:text-[#a4917d]">
          Спокойной ночи, Уля.
          <br />
          Спокойной ночи и тебе.
        </p>

        <section className="mt-12 rounded-2xl border border-dashed border-[#d9c3a0] px-5 py-5 dark:border-[#3d3125]">
          <h2 className="text-xs uppercase tracking-widest text-[#a0794a] dark:text-[#c9a978]">
            Вопрос ребёнку
          </h2>
          <p className="mt-2 text-[1.05rem] leading-relaxed text-[#5d4c3e] dark:text-[#c4b5a4]">
            {p.question}
          </p>
        </section>

        <nav className="mt-10 flex items-stretch justify-between gap-3">
          {prev ? (
            <Link
              href={`/skazki/${prev.num}`}
              className="flex-1 rounded-xl border border-[#e8dac2] px-4 py-3 text-sm transition hover:border-[#c9622e] dark:border-[#33291f]"
            >
              <span className="block text-xs text-[#a08a72] dark:text-[#8b7a68]">Назад</span>
              <span className="font-medium">{prev.title}</span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/skazki/${next.num}`}
              className="flex-1 rounded-xl bg-[#c9622e] px-4 py-3 text-right text-sm text-white transition hover:bg-[#b1541f]"
            >
              <span className="block text-xs text-white/75">Часть {next.num}</span>
              <span className="font-medium">{next.title}</span>
            </Link>
          ) : (
            <Link
              href="/skazki"
              className="flex-1 rounded-xl bg-[#c9622e] px-4 py-3 text-right text-sm text-white transition hover:bg-[#b1541f]"
            >
              <span className="block text-xs text-white/75">Это конец книги</span>
              <span className="font-medium">Ко всем частям</span>
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
