// Типы читалки и чистые хелперы над ними.
//
// Вынесены из lib/reading.ts отдельным модулем намеренно: reading.ts читает
// данные с диска через node:fs, и любой импорт значения (а не типа) из него
// затягивает fs в клиентский бандл — сборка падает на UnhandledSchemeError.
// Клиентские компоненты импортируют отсюда.

export type Token = { w?: string; s?: string };
export type Segment = { t: string; em?: "b" | "i"; tk: Token[] };
export type Sentence = { id: string; seg: Segment[] };
/**
 * Абзац (`p`), цитата (`q`) или подзаголовок внутри главы (`h`).
 *
 * `lang` стоит только у абзацев, написанных не на языке книги: во вступлении
 * английского ридера половина текста — обращение к читателю по-русски, и
 * читать его английским голосом нельзя.
 */
export type Prose = { kind: "p" | "q" | "h"; lang?: "id" | "en" | "ru"; sent: Sentence[] };
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
/**
 * Таблица главы («Key Vocabulary» в AI & Business English): обе колонки уже
 * переведены автором, поэтому — как и врезка-словарик — без кнопок перевода
 * и озвучки и мимо глоссария.
 */
export type TableBlock = { kind: "t"; head: string[]; rows: string[][] };
export type Block = Prose | VocabBox | TableBlock;

export const isProse = (b: Block): b is Prose => b.kind !== "v" && b.kind !== "t";
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
  /**
   * Язык книги: на нём её озвучивают и с него переводят. Необязателен,
   * потому что у старых JSON поля нет — читатели берут `?? "id"`.
   */
  lang?: BookLang;
  chapters: Chapter[];
  appendix: string;
};
export type GlossaryEntry = { ru: string; lemma?: string };
export type Glossary = Record<string, GlossaryEntry>;
