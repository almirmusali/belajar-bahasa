// Типы читалки и чистые хелперы над ними.
//
// Вынесены из lib/reading.ts отдельным модулем намеренно: reading.ts читает
// данные с диска через node:fs, и любой импорт значения (а не типа) из него
// затягивает fs в клиентский бандл — сборка падает на UnhandledSchemeError.
// Клиентские компоненты импортируют отсюда.

export type Token = { w?: string; s?: string };
export type Segment = { t: string; em?: "b" | "i"; tk: Token[] };
export type Sentence = { id: string; seg: Segment[] };
export type Prose = { kind: "p" | "q"; sent: Sentence[] };
/**
 * Врезка-словарик в конце главы («Kata Baru» во второй книге): готовый
 * список автора, а не проза. Предложений в ней нет — значит нет ни перевода
 * по кнопке, ни озвучки, и в глоссарий её слова тоже не идут.
 */
export type VocabBox = {
  kind: "v";
  title: string;
  items: { id: string; ru: string }[];
};
export type Block = Prose | VocabBox;

export const isProse = (b: Block): b is Prose => b.kind !== "v";
export type Chapter = { id: number; num: number | null; title: string; blocks: Block[] };
/**
 * Язык книги. Определяет голос озвучки (MP3-папка и фолбэк Web Speech).
 * У старых JSON поля нет — читается как "id".
 */
export type BookLang = "id" | "en";
export type Book = {
  slug: string;
  title: string;
  subtitle: string;
  lang?: BookLang;
  chapters: Chapter[];
  appendix: string;
};
export type GlossaryEntry = { ru: string; lemma?: string };
export type Glossary = Record<string, GlossaryEntry>;
