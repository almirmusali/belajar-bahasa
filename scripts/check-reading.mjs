// Проверяет готовность книг читалки: у каждого ли предложения есть перевод
// и сколько словоформ покрыто глоссарием.
//
//   node scripts/check-reading.mjs [slug ...]     без аргументов — все книги
//
// Читалка не падает от нехватки перевода: у абзаца просто не появляется
// кнопка ⇄, а слово не подсвечивается при наведении. Поэтому дыры нужно
// искать отдельной проверкой, глазами их не видно.
//
// Выход 1, если хоть у одной книги непереведённые предложения.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "data", "reading");

const readJson = (f, fallback) =>
  fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : fallback;

const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
      .sort();

let bad = 0;

for (const slug of slugs) {
  const book = readJson(path.join(DIR, `${slug}.json`), null);
  if (!book) {
    console.log(`${slug}: нет собранного .json`);
    bad++;
    continue;
  }
  const tr = readJson(path.join(DIR, `${slug}.translations.json`), {});
  const gl = readJson(path.join(DIR, `${slug}.glossary.json`), {});

  const sentences = new Set();
  const words = new Set();
  for (const heading of [book.title, book.subtitle, ...book.chapters.map((c) => c.title)]) {
    if (heading) sentences.add(heading);
  }
  for (const ch of book.chapters) {
    for (const b of ch.blocks) {
      if (b.kind === "v" || b.kind === "t") continue;
      for (const s of b.sent) {
        sentences.add(s.id);
        for (const seg of s.seg) for (const tk of seg.tk) if (tk.w) words.add(tk.w.toLowerCase());
      }
    }
  }

  const missing = [...sentences].filter((s) => !tr[s]);
  const noGloss = [...words].filter((w) => !gl[w]);
  const pct = (a, b) => (b ? Math.round(((b - a) / b) * 100) : 100);

  console.log(
    `${slug}: глав ${book.chapters.length}, предложений ${sentences.size}, ` +
      `перевод ${pct(missing.length, sentences.size)}%, ` +
      `глоссарий ${pct(noGloss.length, words.size)}% (${words.size - noGloss.length}/${words.size})`,
  );
  if (missing.length) {
    bad++;
    console.log(`  ✗ без перевода: ${missing.length}`);
    for (const s of missing.slice(0, 10)) console.log(`    ${s.slice(0, 90)}`);
  }
  if (noGloss.length) {
    console.log(`  · без глоссария: ${noGloss.slice(0, 15).join(", ")}${noGloss.length > 15 ? " …" : ""}`);
  }
}

process.exit(bad ? 1 : 0);
