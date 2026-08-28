#!/usr/bin/env node
/**
 * Собирает сказку из отдельных частей в две вещи: книгу для сайта и список
 * промптов для генератора картинок.
 *
 *   node scripts/build-skazki.mjs ezhinka-ulya
 *
 * Читает  data/skazki/<slug>/parts/p01.json … p20.json  и  <slug>/cover.json
 * Пишет   data/skazki/<slug>.json           — книга (промпты вырезаны)
 *         data/skazki/<slug>.prompts.json   — плоский список сцен генератору
 *
 * Промпты в книгу не попадают намеренно: это по полкилобайта английского текста
 * на каждую картинку, то есть лишние сотни килобайт в статической странице,
 * которые читателю не нужны ни разу.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

const BOOKS = {
  "ezhinka-ulya": {
    title: "Ежинка Уля и Ягодная поляна",
    subtitle: "Двадцать сказок на ночь",
    description:
      "Сказка-сериал для детей 3–6 лет. Каждая часть — отдельная история на 10–15 минут " +
      "чтения вслух: у Ули случается то же, что бывает у ребёнка, она называет своё чувство " +
      "и находит выход. В конце каждой части — вопрос, который можно задать ребёнку.",
    ageHint: "3–6 лет",
  },
};

const slug = process.argv[2] || "ezhinka-ulya";
const meta = BOOKS[slug];
if (!meta) {
  console.error(`не знаю книгу «${slug}»; известные: ${Object.keys(BOOKS).join(", ")}`);
  process.exit(1);
}

const srcDir = join(REPO, "data", "skazki", slug);
const partsDir = join(srcDir, "parts");

// Считаем слова так же, как считал бы человек: по пробелам, без разметки.
const countWords = (part) =>
  part.blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

const files = existsSync(partsDir)
  ? readdirSync(partsDir).filter((f) => /^p\d+\.json$/.test(f)).sort()
  : [];

if (!files.length) {
  console.error(`в ${partsDir} нет ни одной части`);
  process.exit(1);
}

const problems = [];
const parts = [];
const scenes = [];
const seenIds = new Set();

for (const file of files) {
  const part = JSON.parse(readFileSync(join(partsDir, file), "utf8"));
  const where = `часть ${part.num} (${file})`;

  for (const field of ["num", "title", "teaser", "moral", "cliffhanger", "question", "blocks"]) {
    if (!part[field]) problems.push(`${where}: нет поля «${field}»`);
  }

  const images = part.blocks.filter((b) => b.type === "image");
  if (images.length !== 10) problems.push(`${where}: картинок ${images.length}, а нужно 10`);

  const words = countWords(part);
  // 10–15 минут вслух — это 1300–1600 слов. Ниже 1200 часть просто короткая,
  // и её лучше дописать, чем чинить потом на сайте.
  if (words < 1200) problems.push(`${where}: всего ${words} слов — коротко для 10 минут`);

  for (const img of images) {
    if (seenIds.has(img.id)) problems.push(`${where}: id ${img.id} уже занят другой картинкой`);
    seenIds.add(img.id);
    if (!img.prompt) problems.push(`${where}: у картинки ${img.file} нет промпта`);
    if (!img.alt) problems.push(`${where}: у картинки ${img.file} нет подписи alt`);
    // Сид генератора считается от id, поэтому id обязан быть уникальным по всей
    // книге — иначе две картинки молча выйдут одинаковыми.
    scenes.push({ id: img.id, file: img.file, aspect: img.aspect || "3:2", prompt: img.prompt });
  }

  parts.push({
    num: part.num,
    title: part.title,
    theme: part.theme || "",
    teaser: part.teaser,
    moral: part.moral,
    cliffhanger: part.cliffhanger,
    question: part.question,
    words,
    minutes: Math.round(words / 110), // вслух с паузами — около 110 слов в минуту
    blocks: part.blocks.map((b) =>
      b.type === "image" ? { type: "image", file: b.file, alt: b.alt } : b,
    ),
  });
}

parts.sort((a, b) => a.num - b.num);

// Обложки идут отдельным списком, потому что у них другая судьба: модель рисует
// только арт, а название кладёт поверх scripts/make-skazki-covers.py. Держать
// их в одном файле со сценами нельзя — генератор затирал бы готовую обложку с
// типографикой при каждой перерисовке.
const coversPath = join(srcDir, "covers.json");
const covers = existsSync(coversPath) ? JSON.parse(readFileSync(coversPath, "utf8")) : [];
for (const c of covers) {
  if (!c.prompt) problems.push(`обложка ${c.file}: нет промпта`);
}

const book = { slug, ...meta, parts };
writeFileSync(join(REPO, "data", "skazki", `${slug}.json`), JSON.stringify(book, null, 1));
writeFileSync(
  join(REPO, "data", "skazki", `${slug}.prompts.json`),
  JSON.stringify(scenes, null, 1),
);
writeFileSync(
  join(REPO, "data", "skazki", `${slug}.covers.prompts.json`),
  JSON.stringify(covers, null, 1),
);

const totalWords = parts.reduce((sum, p) => sum + p.words, 0);
console.log(`книга: ${parts.length} частей, ${totalWords} слов`);
console.log(`картинок к генерации: ${scenes.length} сцен + ${covers.length} обложек`);
for (const p of parts) console.log(`  ${String(p.num).padStart(2)}. ${p.title} — ${p.words} слов, ~${p.minutes} мин`);

if (problems.length) {
  console.log(`\nнадо поправить (${problems.length}):`);
  for (const p of problems) console.log(`  ! ${p}`);
  process.exit(1);
}
console.log("\nвсё сходится");
