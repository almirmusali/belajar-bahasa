#!/usr/bin/env node
// Генерация иллюстраций книги через Gemini (Nano Banana).
//
//   node scripts/generate-illustrations.mjs <slug> [--only 3,4,5] [--model <id>]
//
// Читает data/reading/illustrations/<slug>.prompts.json:
//   [{ "id": 3, "file": "ch-3", "prompt": "..." }, ...]
// Кладёт public/reading/<slug>/<file>.png (обложка — public/reading/<slug>.png).
// Идемпотентен: существующие файлы пропускает, упавшие можно догнать перезапуском.
//
// Нужен GEMINI_API_KEY с биллингом (у бесплатного тарифа лимит image-моделей 0).

import fs from "node:fs";
import path from "node:path";

const API_KEY = process.env.GEMINI_API_KEY;
const slug = process.argv[2];
if (!API_KEY || !slug) {
  console.error("Использование: GEMINI_API_KEY=... node scripts/generate-illustrations.mjs <slug>");
  process.exit(1);
}

const args = process.argv.slice(3);
const only = args.includes("--only")
  ? new Set(args[args.indexOf("--only") + 1].split(",").map(Number))
  : null;
const model = args.includes("--model")
  ? args[args.indexOf("--model") + 1]
  : "gemini-3.1-flash-image";

const promptsFile = path.join("data", "reading", "illustrations", `${slug}.prompts.json`);
const scenes = JSON.parse(fs.readFileSync(promptsFile, "utf8"));
const outDir = path.join("public", "reading", slug);
fs.mkdirSync(outDir, { recursive: true });

async function generate(scene) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: scene.prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: scene.aspect ?? "3:2" },
        },
      }),
    },
  );
  if (res.status === 429) return { retry: true };
  if (!res.ok) throw new Error(`${scene.file}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error(`${scene.file}: в ответе нет картинки: ${JSON.stringify(data).slice(0, 200)}`);
  return { bytes: Buffer.from(part.inlineData.data, "base64") };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let done = 0;
for (const scene of scenes) {
  if (only && !only.has(scene.id)) continue;
  const out = scene.cover
    ? path.join("public", "reading", `${slug}.png`)
    : path.join(outDir, `${scene.file}.png`);
  if (fs.existsSync(out)) {
    console.log(`— ${scene.file}: уже есть, пропуск`);
    continue;
  }
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await generate(scene);
      if (r.retry) {
        if (attempt > 5) throw new Error(`${scene.file}: 429 пять раз подряд, сдаюсь`);
        console.log(`… ${scene.file}: 429, жду 30с (попытка ${attempt})`);
        await sleep(30_000);
        continue;
      }
      fs.writeFileSync(out, r.bytes);
      console.log(`✓ ${scene.file} → ${out} (${(r.bytes.length / 1024).toFixed(0)}K)`);
      done++;
      break;
    } catch (e) {
      if (attempt >= 3) throw e;
      console.log(`… ${scene.file}: ${e.message}, повтор`);
      await sleep(5_000);
    }
  }
}
console.log(`Готово: ${done} новых.`);
