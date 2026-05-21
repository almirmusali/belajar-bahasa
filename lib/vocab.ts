import fs from "node:fs";
import path from "node:path";

export type Word = {
  id: string;
  ru: string;
  en?: string;
  note?: string;
};

export type VocabSet = {
  slug: string;
  title: string;
  description?: string;
  words: Word[];
};

const VOCAB_DIR = path.join(process.cwd(), "data", "vocab");

export function getAllVocabSets(): VocabSet[] {
  if (!fs.existsSync(VOCAB_DIR)) return [];
  return fs
    .readdirSync(VOCAB_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => readSet(d.name))
    .filter((s): s is VocabSet => Boolean(s))
    .sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

export function getVocabSet(slug: string): VocabSet | undefined {
  return readSet(slug);
}

function readSet(slug: string): VocabSet | undefined {
  const file = path.join(VOCAB_DIR, slug, "index.json");
  if (!fs.existsSync(file)) return undefined;
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<VocabSet>;
    if (!Array.isArray(raw.words)) return undefined;
    return {
      slug,
      title: raw.title ?? slug,
      description: raw.description,
      words: raw.words as Word[],
    };
  } catch {
    return undefined;
  }
}
