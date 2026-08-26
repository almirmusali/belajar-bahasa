import { createSupabaseAdminClient } from "./supabase/admin";

// Аналитика читалки для админки: загрузка витрин из Supabase и вычисление
// профиля чтения. Только серверный код — ходит service-role клиентом.
//
// Профиль — главный вывод по читателю: читает ли он оригинал или фактически
// перевод. Складывается из трёх независимых сигналов:
//   showAllShare   — доля времени чтения с включённым «Перевод везде»;
//   translateShare — доля прочитанных абзацев, у которых раскрывали перевод;
//   lookupsPer100  — подглядываний в слова на сто прочитанных слов.

export type DailyRow = {
  reader: string;
  day: string;
  book_slug: string;
  lookups: number;
  par_opens: number;
  chapter_opens: number;
  seconds: number;
  seconds_show_all: number;
};

export type ChapterRow = {
  reader: string;
  book_slug: string;
  chapter: number;
  words_total: number | null;
  blocks_total: number | null;
  words_read: number;
  last_block: number;
  done: boolean;
  blocks_translated: number;
  lookups: number;
  seconds: number;
};

export type ReaderRow = {
  reader: string;
  user_id: string | null;
  first_seen: string;
  last_seen: string;
  events: number;
};

export type ReadingProfile = {
  label: string;
  hint: string;
  /** Классы бейджа: от «читает оригинал» (primary) до «только перевод». */
  className: string;
};

export type ReaderStats = {
  showAllShare: number;
  translateShare: number;
  lookupsPer100: number;
  seconds: number;
  wordsRead: number;
  blocksRead: number;
  blocksTranslated: number;
  lookups: number;
};

export type ReaderSummary = ReaderRow & {
  email: string | null;
  stats: ReaderStats;
  profile: ReadingProfile;
  books: string[];
};

export async function loadReadingData() {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const [readers, daily, chapters] = await Promise.all([
    admin
      .from("reading_readers")
      .select("*")
      .order("last_seen", { ascending: false }),
    admin.from("reading_daily").select("*").order("day"),
    admin.from("reading_chapter_stats").select("*"),
  ]);

  // Email'ы читателей: auth.users через admin API. Ошибка здесь не должна
  // валить админку — просто останемся без email'ов.
  const emails = new Map<string, string>();
  try {
    const { data } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of data?.users ?? []) {
      if (u.email) emails.set(u.id, u.email);
    }
  } catch {
    // ignore
  }

  return {
    readers: (readers.data ?? []) as ReaderRow[],
    daily: (daily.data ?? []) as DailyRow[],
    chapters: (chapters.data ?? []) as ChapterRow[],
    emails,
  };
}

export function readerStats(
  daily: DailyRow[],
  chapters: ChapterRow[],
): ReaderStats {
  const seconds = daily.reduce((a, d) => a + d.seconds, 0);
  const secondsShowAll = daily.reduce((a, d) => a + d.seconds_show_all, 0);
  const lookups = daily.reduce((a, d) => a + d.lookups, 0);
  const wordsRead = chapters.reduce((a, c) => a + c.words_read, 0);
  // Абзацы считаем как «дочитал до N-го» → N+1 прочитанных блоков; для
  // недобранных данных прикрываемся нулём.
  const blocksRead = chapters.reduce(
    (a, c) => a + (c.words_read > 0 || c.done ? c.last_block + 1 : 0),
    0,
  );
  const blocksTranslated = chapters.reduce((a, c) => a + c.blocks_translated, 0);

  return {
    seconds,
    lookups,
    wordsRead,
    blocksRead,
    blocksTranslated,
    showAllShare: seconds > 0 ? secondsShowAll / seconds : 0,
    translateShare: blocksRead > 0 ? Math.min(1, blocksTranslated / blocksRead) : 0,
    lookupsPer100: wordsRead > 0 ? (lookups / wordsRead) * 100 : 0,
  };
}

export function classifyProfile(s: ReaderStats): ReadingProfile {
  if (s.seconds < 120) {
    return {
      label: "мало данных",
      hint: "меньше двух минут чтения — судить рано",
      className: "bg-secondary text-muted-foreground",
    };
  }
  if (s.showAllShare > 0.5) {
    return {
      label: "только перевод",
      hint: "больше половины времени включён «Перевод везде»",
      className: "bg-destructive/10 text-destructive",
    };
  }
  if (s.translateShare > 0.45) {
    return {
      label: "параллельное чтение",
      hint: "перевод раскрыт почти у каждого второго абзаца",
      className: "bg-primary/10 text-primary",
    };
  }
  if (s.translateShare > 0.12 || s.lookupsPer100 > 2.5) {
    return {
      label: "оригинал с подглядыванием",
      hint: "читает оригинал, точечно проверяя слова и абзацы",
      className: "bg-primary/10 text-primary",
    };
  }
  return {
    label: "оригинал",
    hint: "переводом почти не пользуется",
    className: "bg-primary text-primary-foreground",
  };
}

export function summarizeReaders(data: {
  readers: ReaderRow[];
  daily: DailyRow[];
  chapters: ChapterRow[];
  emails: Map<string, string>;
}): ReaderSummary[] {
  const dailyBy = groupBy(data.daily, (d) => d.reader);
  const chaptersBy = groupBy(data.chapters, (c) => c.reader);

  return data.readers.map((r) => {
    const daily = dailyBy.get(r.reader) ?? [];
    const chapters = chaptersBy.get(r.reader) ?? [];
    const stats = readerStats(daily, chapters);
    return {
      ...r,
      email: r.user_id ? (data.emails.get(r.user_id) ?? null) : null,
      stats,
      profile: classifyProfile(stats),
      books: [...new Set(daily.map((d) => d.book_slug))],
    };
  });
}

export function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}

/** «анон · 1f2a» для безымянных, email — для залогиненных. */
export function readerName(r: { email: string | null; reader: string }): string {
  if (r.email) return r.email;
  const id = r.reader.startsWith("anon:") ? r.reader.slice(5) : r.reader;
  return `аноним · ${id.slice(0, 4)}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} c`;
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  return `${h} ч ${min % 60} мин`;
}
