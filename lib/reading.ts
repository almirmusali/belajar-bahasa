import fs from "node:fs";
import path from "node:path";

import { audioFilename } from "./audio-url";
import { isProse, type Block, type Book, type Chapter, type Glossary } from "./reading-types";

export * from "./reading-types";

// Данные читалки лежат в data/reading/ и собираются скриптами:
//   scripts/build-reading.mjs      книга .md → <slug>.json (главы, предложения, токены)
//   scripts/translate-reading.mjs  → <slug>.translations.json и <slug>.glossary.json
//
// Читается всё на сервере: страница главы рендерится в RSC, и в браузер
// уезжает только та глава, которую открыли, вместе с её переводами и
// нужным куском глоссария. Целиком книгу клиенту не отдаём.

const DIR = path.join(process.cwd(), "data", "reading");

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function bookSlugs(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .filter((slug) => fs.existsSync(path.join(DIR, `${slug}.json`)))
    .sort();
}

export function getBook(slug: string): Book | null {
  const file = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return readJson<Book | null>(file, null);
}

export function getTranslations(slug: string): Record<string, string> {
  return readJson<Record<string, string>>(
    path.join(DIR, `${slug}.translations.json`),
    {},
  );
}

export function getGlossary(slug: string): Glossary {
  return readJson<Glossary>(path.join(DIR, `${slug}.glossary.json`), {});
}

/**
 * Обложка книги — файл public/reading/<slug>.(svg|png|jpg|webp).
 * Нет файла — вернётся null, и карточка нарисует запасную заглушку.
 */
export function coverUrl(slug: string): string | null {
  const dir = path.join(process.cwd(), "public", "reading");
  for (const ext of ["svg", "webp", "png", "jpg", "jpeg"]) {
    if (fs.existsSync(path.join(dir, `${slug}.${ext}`))) {
      return `/reading/${slug}.${ext}`;
    }
  }
  return null;
}

/**
 * Есть ли у книги студийная озвучка. Проверяем по первым предложениям: MP3
 * называется хэшем текста, поэтому файл либо лежит на месте, либо его нет и
 * читалка уйдёт на системный голос. Витрине это нужно, чтобы не обещать
 * озвучку книге, которую ещё не прогоняли через Voicer.
 */
export function hasStudioAudio(book: Book): boolean {
  const dir = path.join(process.cwd(), "public", "audio");
  let checked = 0;
  for (const ch of book.chapters) {
    for (const b of ch.blocks) {
      if (!isProse(b)) continue;
      for (const s of b.sent) {
        if (fs.existsSync(path.join(dir, audioFilename(s.id, b.lang ?? book.lang)))) {
          return true;
        }
        if (++checked >= 20) return false;
      }
    }
  }
  return false;
}

/** Сколько предложений в главе — для оглавления и оценки объёма. */
export function chapterSize(chapter: Chapter): { sentences: number; words: number } {
  let sentences = 0;
  let words = 0;
  for (const b of chapter.blocks) {
    if (!isProse(b)) continue;
    for (const s of b.sent) {
      sentences++;
      for (const seg of s.seg) for (const tk of seg.tk) if (tk.w) words++;
    }
  }
  return { sentences, words };
}

/**
 * Сколько в книге РАЗНЫХ предложений. Именно с этим числом сравнивается
 * размер translations.json: ключ перевода — текст, поэтому повторяющаяся
 * реплика («Iya, Bu.») переводится один раз, а в тексте встречается много.
 */
export function uniqueSentenceCount(book: Book): number {
  const seen = new Set<string>();
  for (const ch of book.chapters) {
    for (const b of ch.blocks) {
      if (!isProse(b)) continue;
      for (const s of b.sent) seen.add(s.id);
    }
  }
  return seen.size;
}

/** Переводы только тех предложений, что есть в главе. */
export function chapterTranslations(
  chapter: Chapter,
  all: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const b of chapter.blocks) {
    if (!isProse(b)) continue;
    for (const s of b.sent) {
      const ru = all[s.id];
      if (ru) out[s.id] = ru;
    }
  }
  return out;
}

/** Кусок глоссария под словоформы главы — чтобы не тащить в браузер весь. */
export function chapterGlossary(chapter: Chapter, all: Glossary): Glossary {
  const out: Glossary = {};
  for (const b of chapter.blocks) {
    if (!isProse(b)) continue;
    for (const s of b.sent) {
      for (const seg of s.seg) {
        for (const tk of seg.tk) {
          if (!tk.w) continue;
          const key = tk.w.toLowerCase();
          const hit = all[key];
          if (hit) out[key] = hit;
        }
      }
    }
  }
  return out;
}
