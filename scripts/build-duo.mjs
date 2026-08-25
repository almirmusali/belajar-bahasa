// Собирает книгу из двуязычного исходника data/reading/duo/<slug>.duo.md.
//
//   node scripts/build-duo.mjs <slug>
//
// Пишет два файла:
//   data/reading/<slug>.md                — сама книга (только индонезийский)
//   data/reading/<slug>.translations.json — { "предложение": "перевод" }
//
// Зачем нужен ещё один формат. Обычный маршрут книги — написать .md и
// перевести его скриптом translate-reading.mjs, который дёргает `claude -p`.
// Когда переводчик пишется вручную (или CLI недоступен), опасность одна:
// ключ перевода — точный текст предложения после разбора build-reading.mjs,
// и любая опечатка в ключе тихо оставляет абзац без кнопки ⇄. Здесь текст и
// перевод стоят на одной строке, ключи генерируются из того же источника,
// разойтись им негде.
//
// Формат исходника:
//
//   # JUDUL | Название            заголовок книги
//   ### Subjudul | Подзаголовок   подзаголовок книги
//   ## 1. Bab | Глава             глава (номер необязателен)
//   Kalimat. | Предложение.       одна строка — одно предложение
//   (пустая строка)               конец абзаца
//   > **Kata Baru**               строки с `>` уходят в .md как есть
//   > pulau — остров · ...        (врезка-словарик, перевод в ней уже есть)
//   ---                           горизонтальная черта, уходит в .md как есть
//   ---APPENDIX---                дальше всё копируется в .md без разбора
//
// Разделитель предложения и перевода — ` | `. Если перевода нет, строка
// уходит в .md, но в translations.json не попадает.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "data", "reading");
const SRC_DIR = path.join(DIR, "duo");

const slug = process.argv[2];
if (!slug) {
  console.error("Укажи slug: node scripts/build-duo.mjs <slug>");
  process.exit(1);
}

const src = path.join(SRC_DIR, `${slug}.duo.md`);
if (!fs.existsSync(src)) {
  console.error(`Нет файла ${path.relative(ROOT, src)}`);
  process.exit(1);
}

const SEP = " | ";

/** Делит строку на оригинал и перевод по первому ` | `. */
function split(line) {
  const at = line.indexOf(SEP);
  if (at < 0) return [line.trim(), null];
  return [line.slice(0, at).trim(), line.slice(at + SEP.length).trim() || null];
}

/**
 * Ключ перевода — предложение таким, каким его увидит build-reading.mjs:
 * без разметки (`**жирный**` там разбирается в сегменты, а ключ строится по
 * чистому тексту) и без номера главы (`## 1. Bab` даёт title «Bab»).
 */
const plainKey = (text, isChapter) =>
  text
    .replace(/\*\*([^*]+)\*\*|\*([^*]+)\*/g, (_, b, i) => b ?? i)
    .replace(isChapter ? /^\d+\.\s*/ : /^$/, "")
    .trim();

const raw = fs.readFileSync(src, "utf8");
const [body, appendix = ""] = raw.split(/^---APPENDIX---$/m);

const out = [];
const translations = {};
const problems = [];

/** Абзац копится построчно и склеивается пробелом — как в обычной книге. */
let para = [];
/** Идёт ли сейчас блок цитаты: он закрывается пустой строкой, но только раз. */
let quote = false;
const flush = () => {
  if (!para.length) return;
  out.push(para.join(" "), "");
  para = [];
};

const remember = (id, ru, lineNo) => {
  if (!ru) return;
  if (translations[id] && translations[id] !== ru) {
    problems.push(`строка ${lineNo}: два разных перевода у «${id.slice(0, 40)}…»`);
  }
  translations[id] = ru;
};

const lines = body.split("\n");
lines.forEach((line, i) => {
  const lineNo = i + 1;
  const trimmed = line.trim();

  if (!trimmed) {
    flush();
    return;
  }
  // Врезки и разделители — разметка, а не проза: копируем дословно.
  // Соседние строки `>` идут подряд, без пустой строки между ними: пустая
  // строка обрывает цитату, и врезка-словарик распалась бы на заголовок и
  // отдельный абзац — build-reading.mjs перестал бы узнавать в ней словарик.
  if (trimmed.startsWith(">")) {
    flush();
    if (out.at(-1) === "") out.pop();
    out.push(trimmed);
    quote = true;
    return;
  }
  if (quote) {
    out.push("");
    quote = false;
  }
  if (/^---+$/.test(trimmed)) {
    flush();
    out.push(trimmed, "");
    return;
  }
  const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
  if (heading) {
    flush();
    const [id, ru] = split(heading[2]);
    remember(plainKey(id, heading[1] === "##"), ru, lineNo);
    out.push(`${heading[1]} ${id}`, "");
    return;
  }
  const [id, ru] = split(trimmed);
  // Предложение, начинающееся со строчной, склеится с предыдущим при
  // разборе книги — и оба перевода потеряют свои ключи. Ловим здесь.
  if (para.length && /^[a-zà-ÿ]/.test(id)) {
    problems.push(`строка ${lineNo}: предложение начинается со строчной — «${id.slice(0, 40)}…»`);
  }
  if (!/[.!?…:»"]$/.test(plainKey(id, false))) {
    problems.push(`строка ${lineNo}: нет знака конца предложения — «${id.slice(0, 40)}…»`);
  }
  remember(plainKey(id, false), ru, lineNo);
  para.push(id);
});
flush();

const md = `${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n${
  appendix.trim() ? `\n${appendix.trim()}\n` : ""
}`;

fs.writeFileSync(path.join(DIR, `${slug}.md`), md);

// Уже лежащие переводы не затираем: файл может быть общим с translate-reading.
const trFile = path.join(DIR, `${slug}.translations.json`);
const existing = fs.existsSync(trFile) ? JSON.parse(fs.readFileSync(trFile, "utf8")) : {};
fs.writeFileSync(trFile, JSON.stringify({ ...existing, ...translations }, null, 1));

console.log(`data/reading/${slug}.md`);
console.log(`  переводов: ${Object.keys(translations).length}`);
if (problems.length) {
  console.log(`  ⚠ проблем: ${problems.length}`);
  for (const p of problems.slice(0, 20)) console.log(`    ${p}`);
}
