import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Раздел «Сказки» намеренно отделён от читалки. У читалки другая задача:
// индонезийский текст, перевод по тапу, глоссарий, озвучка каждого слова.
// Здесь ничего этого нет и быть не должно — сказку взрослый читает вслух
// по-русски, и единственное, что ей нужно, — крупный текст и картинки.

export type SkazkaBlock =
  | { type: "text"; text: string }
  | { type: "image"; file: string; alt: string };

export type SkazkaPart = {
  num: number;
  title: string;
  theme: string;
  teaser: string;
  moral: string;
  cliffhanger: string;
  question: string;
  words: number;
  minutes: number;
  blocks: SkazkaBlock[];
};

export type Skazka = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  ageHint: string;
  parts: SkazkaPart[];
};

const DIR = path.join(process.cwd(), "data", "skazki");

// Сказка пока одна, и лишний сегмент в адресе только мешал бы: /skazki/7
// читается лучше, чем /skazki/ezhinka-ulya/7. Когда появится вторая книга,
// slug выносится в маршрут, а этой константы не станет.
export const DEFAULT_SKAZKA = "ezhinka-ulya";

export function skazkaSlugs(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json") && !f.endsWith(".prompts.json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

export function getSkazka(slug: string): Skazka | null {
  const file = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Skazka;
  } catch {
    return null;
  }
}

export function getPart(slug: string, num: number): SkazkaPart | null {
  return getSkazka(slug)?.parts.find((p) => p.num === num) ?? null;
}

/**
 * Короткий хеш содержимого — то же решение, что в читалке (lib/reading.ts).
 * Service worker кеширует картинки cache-first, поэтому перерисованная
 * иллюстрация по постоянному адресу навсегда осталась бы у читателя старой.
 * Считается на сборке: страницы сказок статические.
 */
const contentTags = new Map<string, string>();

function contentTag(file: string): string {
  const known = contentTags.get(file);
  if (known) return known;
  const tag = crypto
    .createHash("sha1")
    .update(fs.readFileSync(file))
    .digest("hex")
    .slice(0, 8);
  contentTags.set(file, tag);
  return tag;
}

/**
 * Картинка сказки — public/skazki/<slug>/<file>.(webp|png).
 * Файла нет — вернётся null, и страница просто отрисуется без него: текст
 * выкладывается раньше, чем досчитаются все двести иллюстраций.
 */
export function illustrationUrl(slug: string, file: string): string | null {
  const dir = path.join(process.cwd(), "public", "skazki", slug);
  for (const ext of ["webp", "png", "jpg", "jpeg"]) {
    const full = path.join(dir, `${file}.${ext}`);
    if (fs.existsSync(full)) {
      return `/skazki/${slug}/${file}.${ext}?v=${contentTag(full)}`;
    }
  }
  return null;
}

/**
 * Озвучка части — public/skazki/<slug>/audio/pNN.mp3, один трек на часть.
 * Нет файла — вернётся null, и страница просто отрисуется без плеера:
 * озвучка добирается по частям и стоит квоты, поэтому её может не быть.
 */
export function audioUrl(slug: string, num: number): string | null {
  const file = path.join(
    process.cwd(), "public", "skazki", slug, "audio",
    `p${String(num).padStart(2, "0")}.mp3`,
  );
  if (!fs.existsSync(file)) return null;
  return `/skazki/${slug}/audio/p${String(num).padStart(2, "0")}.mp3?v=${contentTag(file)}`;
}
