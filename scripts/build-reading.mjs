// Парсит книгу из data/reading/<slug>.md в структуру для читалки.
//
//   node scripts/build-reading.mjs [slug]
//
// На выходе data/reading/<slug>.json:
//   { slug, title, subtitle, chapters: [{ id, num, title, blocks }], appendix }
//
// Блок — абзац, цитата или разделитель. Абзац разбит на предложения, каждое
// предложение — на сегменты (курсив/жирный) и токены (слово / не-слово).
// Разбор идёт один раз на сборке, фронтенд получает готовое дерево.
//
// Ключи для перевода и озвучки — сам текст предложения (translations.json)
// и его FNV-1a хэш (имя MP3). Поэтому перепарсивание книги не ломает уже
// сделанные переводы: пока текст предложения не менялся, ключ тот же.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "data", "reading");

const slug = process.argv[2] ?? "kabut-di-lembang";
const src = path.join(DIR, `${slug}.md`);
if (!fs.existsSync(src)) {
  console.error(`Нет файла ${path.relative(ROOT, src)}`);
  process.exit(1);
}

// ------------------------------------------------------------- инлайн-разбор

// Разбивает строку на сегменты по **жирному** и *курсиву*. Вложенность не
// поддерживаем — в книге её нет, а рекурсивный парсер тут был бы лишним.
function segments(text) {
  const out = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: m[1], em: "b" });
    else out.push({ t: m[2], em: "i" });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out.filter((s) => s.t.length);
}

// Слово индонезийского: буквы, внутри допустимы дефис (anak-anak) и
// апостроф. Всё остальное — пунктуация и пробелы, они идут отдельными
// токенами и не подсвечиваются.
const WORD_RE = /[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[-'][A-Za-zÀ-ÖØ-öø-ÿ]+)*/g;

function tokenize(text) {
  const out = [];
  let last = 0;
  let m;
  WORD_RE.lastIndex = 0;
  while ((m = WORD_RE.exec(text))) {
    if (m.index > last) out.push({ s: text.slice(last, m.index) });
    out.push({ w: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ s: text.slice(last) });
  return out;
}

// ------------------------------------------------------- разбивка на фразы

// Граница предложения: .!?… (возможно с закрывающей кавычкой/скобкой),
// пробел, и дальше начало нового — заглавная буква, кавычка, тире, *, цифра.
// Многоточие внутри реплики («Anu… saya…») не режем: после него строчная.
const SENT_RE = /(?<=[.!?…]["»)]?)\s+(?=[«"(*A-ZÀ-Þ0-9—-])/g;

function splitSentences(text) {
  return text
    .split(SENT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Вырезает кусок [start, end) из размеченных сегментов, сохраняя курсив
// и жирный. Нужно, потому что одна пара *…* в книге спокойно накрывает
// несколько предложений (письмо Пак Хендры целиком курсивом), а резать
// текст мы обязаны по предложениям.
function sliceSegs(segs, start, end) {
  const out = [];
  let at = 0;
  for (const seg of segs) {
    const segStart = at;
    const segEnd = at + seg.t.length;
    at = segEnd;
    if (segEnd <= start) continue;
    if (segStart >= end) break;
    const t = seg.t.slice(Math.max(0, start - segStart), Math.min(seg.t.length, end - segStart));
    if (t) out.push({ ...seg, t });
  }
  return out;
}

// Врезка «Kata Baru» в конце главы — это готовый словарик автора
// (`pulau — остров · tamu — гость · …`), а не проза. Предложениями его
// разбирать бессмысленно: переводить там нечего, озвучивать тоже.
function makeVocabBox(title, raw) {
  const items = raw
    .split("·")
    .map((chunk) => chunk.split(/\s+[—–-]\s+/))
    .filter((pair) => pair.length >= 2)
    .map(([id, ...rest]) => ({ id: id.trim(), ru: rest.join(" — ").trim() }))
    .filter((x) => x.id && x.ru);
  return { kind: "v", title, items };
}

function makeParagraph(raw, kind) {
  const segs = segments(raw);
  const text = segs.map((s) => s.t).join("");

  // Границы предложений ищем по чистому тексту: разметка на них не влияет.
  const cuts = [];
  SENT_RE.lastIndex = 0;
  let m;
  while ((m = SENT_RE.exec(text))) cuts.push([m.index, SENT_RE.lastIndex]);

  const ranges = [];
  let from = 0;
  for (const [cut, next] of cuts) {
    ranges.push([from, cut]);
    from = next;
  }
  ranges.push([from, text.length]);

  const sent = [];
  for (const [a, b] of ranges) {
    const id = text.slice(a, b).trim();
    if (!id) continue;
    // Сдвигаем границы на обрезанные пробелы, иначе сегменты уедут.
    const lead = text.slice(a, b).length - text.slice(a, b).trimStart().length;
    const seg = sliceSegs(segs, a + lead, a + lead + id.length).map((x) => ({
      ...x,
      tk: tokenize(x.t),
    }));
    sent.push({ id, seg });
  }
  return { kind, sent };
}

// ------------------------------------------------------------------ разбор

let md = fs.readFileSync(src, "utf8");

// Язык книги задаётся HTML-комментарием в начале файла: <!-- lang: en -->.
// Комментарии из текста вырезаются до разбора — иначе строка комментария
// стала бы абзацем прозы.
const langMatch = md.match(/<!--\s*lang:\s*([a-z]{2})\s*-->/);
const lang = langMatch ? langMatch[1] : "id";
md = md.replace(/<!--[\s\S]*?-->/g, "");

// Приложение (словарь, грамматика) — русскоязычный справочник. Его не
// разбираем на слова: там нечего переводить наведением.
//
// Заголовок приложения у каждой книги свой («DAFTAR KATA / СЛОВАРЬ»,
// «BAGIAN BELAKANG / СПРАВОЧНАЯ ЧАСТЬ»), поэтому опознаём его не по тексту,
// а по уровню: первый `#` — название книги, второй — начало приложения.
const topHeadings = [...md.matchAll(/^#\s+.*$/gm)];
const appendixAt = topHeadings.length > 1 ? topHeadings[1].index : -1;
const bodyMd = appendixAt >= 0 ? md.slice(0, appendixAt) : md;
const appendixMd = appendixAt >= 0 ? md.slice(appendixAt) : "";

const lines = bodyMd.split("\n");
let title = slug;
let subtitle = "";
const chapters = [];
let chapter = null;
let buf = [];
let bufKind = "p";

let boxTitle = "";

const flush = () => {
  const raw = buf.join(" ").replace(/\s+/g, " ").trim();
  const kind = bufKind;
  const title = boxTitle;
  buf = [];
  bufKind = "p";
  boxTitle = "";
  if (!raw || !chapter) return;
  if (kind === "v") {
    const box = makeVocabBox(title, raw);
    // Пары не набрались — значит это обычная цитата с жирным заголовком,
    // а не словарик. Тогда возвращаем заголовок в текст и разбираем как прозу.
    chapter.blocks.push(
      box.items.length >= 3
        ? box
        : makeParagraph(title ? `**${title}** ${raw}` : raw, "q"),
    );
    return;
  }
  chapter.blocks.push(makeParagraph(raw, kind));
};

const openChapter = (num, heading) => {
  flush();
  chapter = {
    id: chapters.length,
    num,
    title: heading,
    blocks: [],
  };
  chapters.push(chapter);
};

for (const line of lines) {
  const trimmed = line.trim();

  if (/^#\s+/.test(trimmed)) {
    flush();
    title = trimmed.replace(/^#\s+/, "");
    continue;
  }
  if (/^###\s+/.test(trimmed)) {
    flush();
    if (!chapter) subtitle = trimmed.replace(/^###\s+/, "");
    continue;
  }
  if (/^##\s+/.test(trimmed)) {
    const heading = trimmed.replace(/^##\s+/, "");
    const m = heading.match(/^(\d+)\.\s*(.+)$/);
    openChapter(m ? Number(m[1]) : null, m ? m[2] : heading);
    continue;
  }
  if (/^---+$/.test(trimmed)) {
    flush();
    continue;
  }
  if (!trimmed) {
    flush();
    continue;
  }
  if (/^>/.test(trimmed)) {
    const inner = trimmed.replace(/^>\s?/, "");
    if (!inner) {
      flush();
      continue;
    }
    // Цитата, начинающаяся с одиночного **заголовка**, — это врезка-словарик.
    // Внутри заголовка звёздочек быть не может: иначе под шаблон попадёт
    // любая строка, которая просто начинается и кончается жирным, — например
    // строка хронологии `**22:50** — Bambang lewat lorong. **Meja kosong.**`.
    const head = inner.match(/^\*\*([^*]+)\*\*$/);
    if (head) {
      flush();
      bufKind = "v";
      boxTitle = head[1].trim();
      continue;
    }
    if (bufKind !== "q" && bufKind !== "v") flush();
    if (bufKind === "p") bufKind = "q";
    buf.push(inner);
    continue;
  }
  if (bufKind === "q") flush();
  buf.push(trimmed);
}
flush();

const book = {
  slug,
  title,
  subtitle,
  lang,
  chapters,
  appendix: appendixMd.trim(),
};

const out = path.join(DIR, `${slug}.json`);
fs.writeFileSync(out, JSON.stringify(book, null, 1));

// ------------------------------------------------------------------ сводка

const sentences = [];
const words = new Map();
for (const ch of chapters) {
  for (const b of ch.blocks) {
    for (const s of b.sent ?? []) {
      sentences.push(s.id);
      for (const seg of s.seg) {
        for (const tk of seg.tk) {
          if (!tk.w) continue;
          const key = tk.w.toLowerCase();
          words.set(key, (words.get(key) ?? 0) + 1);
        }
      }
    }
  }
}

fs.writeFileSync(
  path.join(DIR, `${slug}.words.json`),
  JSON.stringify(
    [...words.entries()].sort((a, b) => b[1] - a[1]).map(([w, n]) => ({ w, n })),
    null,
    1,
  ),
);

console.log(`${path.relative(ROOT, out)}`);
console.log(`  глав: ${chapters.length}`);
console.log(`  предложений: ${sentences.length} (уникальных ${new Set(sentences).size})`);
console.log(`  слов: ${[...words.values()].reduce((a, b) => a + b, 0)}, уникальных форм: ${words.size}`);
console.log(`  символов на озвучку: ${sentences.reduce((a, s) => a + s.length, 0).toLocaleString("ru")}`);
