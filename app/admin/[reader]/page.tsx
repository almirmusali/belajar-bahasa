import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBook } from "@/lib/reading";
import {
  classifyProfile,
  formatDuration,
  loadReadingData,
  readerName,
  readerStats,
  type ChapterRow,
  type DailyRow,
} from "@/lib/reading-analytics";

export const dynamic = "force-dynamic";

// Карточка читателя: профиль чтения (оригинал или перевод), из чего он
// вычислен, динамика по дням и разбор по книгам и главам.

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Makassar",
});

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ reader: string }>;
}) {
  const { reader: raw } = await params;
  const reader = decodeURIComponent(raw);

  const data = await loadReadingData();
  if (!data) notFound();
  const row = data.readers.find((r) => r.reader === reader);
  if (!row) notFound();

  const daily = data.daily.filter((d) => d.reader === reader);
  const chapters = data.chapters.filter((c) => c.reader === reader);
  const stats = readerStats(daily, chapters);
  const profile = classifyProfile(stats);
  const email = row.user_id ? (data.emails.get(row.user_id) ?? null) : null;
  const name = readerName({ email, reader });

  const books = [...new Set(chapters.map((c) => c.book_slug))].sort();

  return (
    <>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Все читатели
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <h1 className="text-xl font-semibold tracking-tight">{name}</h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium leading-none ${profile.className}`}
        >
          {profile.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {profile.hint} · первый заход {dateFmt.format(new Date(row.first_seen))}
        , последний — {dateFmt.format(new Date(row.last_seen))}
      </p>

      {/* Три сигнала, из которых сложен профиль, плюс общее время. */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Время чтения" value={formatDuration(stats.seconds)} />
        <Stat
          label="«Перевод везде»"
          value={pct(stats.showAllShare)}
          hint="доля времени с включённым режимом"
        />
        <Stat
          label="Перевод абзацев"
          value={pct(stats.translateShare)}
          hint={`${stats.blocksTranslated} из ~${stats.blocksRead} прочитанных`}
        />
        <Stat
          label="Слова"
          value={stats.lookupsPer100.toFixed(1)}
          hint={`подглядываний на 100 слов (всего ${stats.lookups})`}
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-muted-foreground">
        Минуты чтения за последние 30 дней
      </h2>
      <DailyBars daily={daily} />

      {books.map((slug) => (
        <BookSection
          key={slug}
          slug={slug}
          chapters={chapters
            .filter((c) => c.book_slug === slug)
            .sort((a, b) => a.chapter - b.chapter)}
        />
      ))}
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border px-3.5 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums leading-none">
        {value}
      </div>
      {hint && (
        <div className="mt-1.5 text-[11px] leading-tight text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  );
}

// Столbики по дням. Чистый SVG в RSC: библиотека графиков ради тридцати
// прямоугольников не нужна.
function DailyBars({ daily }: { daily: DailyRow[] }) {
  const byDay = new Map<string, number>();
  for (const d of daily) {
    byDay.set(d.day, (byDay.get(d.day) ?? 0) + d.seconds);
  }
  const days = lastDays(30);
  const minutes = days.map((day) => Math.round((byDay.get(day) ?? 0) / 60));
  const max = Math.max(1, ...minutes);

  const W = 8;
  const GAP = 3;
  const H = 56;

  return (
    <svg
      viewBox={`0 0 ${days.length * (W + GAP) - GAP} ${H}`}
      className="mt-2 h-14 w-full max-w-md"
      role="img"
      aria-label="Минуты чтения по дням"
    >
      {minutes.map((m, i) => {
        const h = m > 0 ? Math.max(3, (m / max) * H) : 1.5;
        return (
          <rect
            key={days[i]}
            x={i * (W + GAP)}
            y={H - h}
            width={W}
            height={h}
            rx={1.5}
            className={m > 0 ? "fill-primary/80" : "fill-muted-foreground/20"}
          >
            <title>{`${days[i]}: ${m} мин`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

function BookSection({
  slug,
  chapters,
}: {
  slug: string;
  chapters: ChapterRow[];
}) {
  const book = getBook(slug);
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold">{book?.title ?? slug}</h2>
      <div className="-mx-4 mt-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="border-b px-2 py-1.5 font-medium">Глава</th>
              <th className="border-b px-2 py-1.5 text-right font-medium">
                Прочитано
              </th>
              <th className="border-b px-2 py-1.5 text-right font-medium">
                Перевод абзацев
              </th>
              <th className="border-b px-2 py-1.5 text-right font-medium">
                Слова
              </th>
              <th className="border-b px-2 py-1.5 text-right font-medium">
                Время
              </th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((c) => {
              const blocksRead = c.words_read > 0 || c.done ? c.last_block + 1 : 0;
              const readShare = c.done
                ? 1
                : c.words_total
                  ? Math.min(1, c.words_read / c.words_total)
                  : c.blocks_total
                    ? Math.min(1, blocksRead / c.blocks_total)
                    : 0;
              return (
                <tr key={c.chapter} className="tabular-nums">
                  <td className="border-b px-2 py-1.5">
                    {book?.chapters[c.chapter]?.title ?? `Глава ${c.chapter}`}
                  </td>
                  <td className="border-b px-2 py-1.5 text-right">
                    {pct(readShare)}
                  </td>
                  <td className="border-b px-2 py-1.5 text-right">
                    {c.blocks_translated}
                    {blocksRead > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        / {blocksRead}
                      </span>
                    )}
                  </td>
                  <td className="border-b px-2 py-1.5 text-right">
                    {c.lookups}
                  </td>
                  <td className="border-b px-2 py-1.5 text-right">
                    {formatDuration(c.seconds)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** Последние n дней в поясе читателей, формат YYYY-MM-DD как в витрине. */
function lastDays(n: number): string[] {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(fmt.format(new Date(Date.now() - i * 86_400_000)));
  }
  return out;
}
