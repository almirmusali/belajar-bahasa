#!/usr/bin/env node
/**
 * Переводит иллюстрации сказки из PNG в WebP и удаляет исходники.
 *
 *   node scripts/webp-skazki.mjs ezhinka-ulya
 *
 * Двести картинок по 2 МБ — это 400 МБ в git и в деплое; в WebP те же двести
 * весят около 30 МБ и на глаз не отличаются. У книг читалки рядом лежат обе
 * версии, и папка одной книги занимает 88 МБ — здесь так делать нельзя,
 * картинок в четыре раза больше.
 *
 * Идемпотентен: уже сконвертированные пропускает.
 */
import { readdirSync, statSync, unlinkSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2] || "ezhinka-ulya";
const dir = join(REPO, "public", "skazki", slug);

if (!existsSync(dir)) {
  console.error(`нет папки ${dir} — картинки ещё не генерировались`);
  process.exit(1);
}

const pngs = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
if (!pngs.length) {
  console.log("PNG не осталось — всё уже в WebP");
  process.exit(0);
}

let saved = 0;
let done = 0;
for (const png of pngs) {
  const src = join(dir, png);
  const out = join(dir, png.replace(/\.png$/, ".webp"));
  const before = statSync(src).size;
  await sharp(src).webp({ quality: 82 }).toFile(out);
  const after = statSync(out).size;
  unlinkSync(src);
  saved += before - after;
  done += 1;
  console.log(`  ${png} → webp  ${Math.round(before / 1024)}K → ${Math.round(after / 1024)}K`);
}

console.log(`\nготово: ${done} картинок, освободилось ${Math.round(saved / 1024 / 1024)} МБ`);
