// Заполняет глоссарий новой книги из уже переведённых книг на том же языке
// и из её собственных врезок «Kata Baru».
//
//   node scripts/seed-glossary.mjs <slug>
//
// Глоссарий — это перевод по наведению на слово: { "словоформа": { ru } }.
// Ключ в нём — словоформа в нижнем регистре, а не лемма, поэтому глоссарии
// двух индонезийских книг пересекаются почти целиком: «saya», «nggak»,
// «bilang» в новой книге значат ровно то же, что в старой. Переводить их
// заново нечего — берём готовое.
//
// Уже имеющиеся записи книги не трогаем: ручной перевод точнее заимствованного.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "data", "reading");

const slug = process.argv[2];
if (!slug) {
  console.error("Укажи slug: node scripts/seed-glossary.mjs <slug>");
  process.exit(1);
}

const readJson = (f, fallback) =>
  fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : fallback;

const book = readJson(path.join(DIR, `${slug}.json`), null);
if (!book) {
  console.error(`Нет data/reading/${slug}.json — сначала node scripts/build-reading.mjs ${slug}`);
  process.exit(1);
}

// Доноры — книги того же языка, кроме самой заполняемой.
const donors = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".glossary.json"))
  .map((f) => f.replace(/\.glossary\.json$/, ""))
  .filter((s) => s !== slug)
  .filter((s) => (readJson(path.join(DIR, `${s}.json`), null)?.lang ?? "id") === (book.lang ?? "id"));

const pool = {};
for (const donor of donors) {
  for (const [w, entry] of Object.entries(readJson(path.join(DIR, `${donor}.glossary.json`), {}))) {
    if (!pool[w]) pool[w] = entry;
  }
}

const glFile = path.join(DIR, `${slug}.glossary.json`);
const glossary = readJson(glFile, {});
const before = Object.keys(glossary).length;

// Врезка «Kata Baru» — словарик автора именно к этой книге, он точнее
// заимствований, поэтому кладётся поверх пула.
let fromBox = 0;
for (const ch of book.chapters) {
  for (const b of ch.blocks) {
    if (b.kind !== "v") continue;
    for (const item of b.items) {
      const key = item.id.toLowerCase().trim();
      if (!/^[a-zà-ÿ][a-zà-ÿ'-]*$/i.test(key) || glossary[key]) continue;
      glossary[key] = { ru: item.ru };
      fromBox++;
    }
  }
}

// Словоформы книги — только они, чужой словарь целиком тащить незачем.
const words = new Set();
for (const ch of book.chapters) {
  for (const b of ch.blocks) {
    if (b.kind === "v" || b.kind === "t") continue;
    for (const s of b.sent) {
      for (const seg of s.seg) for (const tk of seg.tk) if (tk.w) words.add(tk.w.toLowerCase());
    }
  }
}

let fromPool = 0;
for (const w of words) {
  if (glossary[w] || !pool[w]) continue;
  glossary[w] = pool[w];
  fromPool++;
}

fs.writeFileSync(glFile, JSON.stringify(glossary, null, 1));

const covered = [...words].filter((w) => glossary[w]).length;
console.log(`data/reading/${slug}.glossary.json`);
console.log(`  доноры: ${donors.join(", ") || "нет"}`);
console.log(`  было ${before}, из врезок +${fromBox}, из доноров +${fromPool}`);
console.log(`  покрытие словоформ книги: ${covered}/${words.size}`);
const rest = [...words].filter((w) => !glossary[w]);
if (rest.length) {
  fs.writeFileSync(
    path.join(DIR, `${slug}.glossary-todo.json`),
    JSON.stringify(rest.sort(), null, 1),
  );
  console.log(`  осталось ${rest.length} → data/reading/${slug}.glossary-todo.json`);
}
