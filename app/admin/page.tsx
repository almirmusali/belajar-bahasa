import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  formatDuration,
  loadReadingData,
  readerName,
  summarizeReaders,
} from "@/lib/reading-analytics";

export const dynamic = "force-dynamic";

// Список читателей: кто, в каком режиме читает и когда был в последний раз.
// Сортировка по последней активности — живые читатели сверху.

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Makassar",
});

export default async function AdminPage() {
  const data = await loadReadingData();

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Supabase не настроен: для админки нужен{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code> в окружении сервера.
      </p>
    );
  }

  const readers = summarizeReaders(data);

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Читатели</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Поведение в читалке: {readers.length}{" "}
        {plural(readers.length, "читатель", "читателя", "читателей")}, события
        копятся с первого захода.
      </p>

      {readers.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Событий пока нет. Они появятся, как только кто-нибудь откроет главу
          книги.
        </p>
      ) : (
        <div className="mt-6 divide-y rounded-xl border">
          {readers.map((r) => (
            <Link
              key={r.reader}
              href={`/admin/${encodeURIComponent(r.reader)}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-secondary/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {readerName(r)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium leading-none ${r.profile.className}`}
                  >
                    {r.profile.label}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatDuration(r.stats.seconds)} чтения
                  {r.books.length > 0 && <> · {r.books.join(", ")}</>}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                {dateFmt.format(new Date(r.last_seen))}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
