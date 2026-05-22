// Прогенерирует MP3 для каждого слова и примера в data/vocab/*/index.json
// через OpenAI TTS-1-HD и зальёт в Supabase Storage (bucket "audio").
//
// Требует переменные окружения в .env.local:
//   OPENAI_API_KEY=sk-...
//   NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   (НЕ commit в git!)
//
// Запуск: node scripts/generate-audio.mjs
//
// Идемпотентен: если файл уже в bucket — пропускает (можно перезапускать).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// Читаем .env.local
function loadEnv() {
  try {
    const env = fs.readFileSync(".env.local", "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}
loadEnv();

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OPENAI_KEY) {
  console.error("Missing OPENAI_API_KEY in .env.local");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOCAB_DIR = path.join(__dirname, "..", "data", "vocab");

// FNV-1a — должно совпадать с lib/audio-url.ts
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h ^ str.charCodeAt(i), 0x01000193)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function audioFilename(text, lang) {
  return `${lang}/${fnv1a(`${lang}:${text}`)}.mp3`;
}

// Какой голос на каком языке. У OpenAI TTS голос языко-независимый —
// модель сама определяет язык по тексту. Выбираю "alloy" — нейтральный,
// чисто звучит на всех трёх языках.
const VOICE = "alloy";
const MODEL = "tts-1-hd";

// Собираем все уникальные пары (text, lang)
function collectAllTexts() {
  const items = new Map(); // key = `${lang}:${text}`
  const folders = fs
    .readdirSync(VOCAB_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const slug of folders) {
    const file = path.join(VOCAB_DIR, slug, "index.json");
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const w of data.words ?? []) {
      if (w.id) items.set(`id:${w.id}`, { text: w.id, lang: "id" });
      if (w.en) items.set(`en:${w.en}`, { text: w.en, lang: "en" });
      if (w.ru) items.set(`ru:${w.ru}`, { text: w.ru, lang: "ru" });
      for (const ex of w.examples ?? []) {
        if (ex.id) items.set(`id:${ex.id}`, { text: ex.id, lang: "id" });
        if (ex.ru) items.set(`ru:${ex.ru}`, { text: ex.ru, lang: "ru" });
      }
    }
  }
  return [...items.values()];
}

async function fileExists(filename) {
  // Probe: GET head request на public URL (быстрее чем list)
  const url = `${SUPABASE_URL}/storage/v1/object/public/audio/${filename}`;
  const res = await fetch(url, { method: "HEAD" });
  return res.ok;
}

async function generateOne(text, lang) {
  const filename = audioFilename(text, lang);

  if (await fileExists(filename)) {
    return { skipped: true, filename };
  }

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: text,
      voice: VOICE,
      response_format: "mp3",
      speed: 0.95,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 200)}`);
  }

  const audio = await res.arrayBuffer();

  const upload = await sb.storage.from("audio").upload(filename, audio, {
    contentType: "audio/mpeg",
    upsert: true,
  });
  if (upload.error) {
    throw new Error(`Supabase upload: ${upload.error.message}`);
  }

  return { skipped: false, filename, bytes: audio.byteLength };
}

async function main() {
  const items = collectAllTexts();
  console.log(`Found ${items.length} unique (text, lang) pairs`);

  let done = 0;
  let skipped = 0;
  let generated = 0;
  let errors = 0;
  let bytesTotal = 0;
  const t0 = Date.now();

  // Маленькая задержка между запросами чтобы не упереться в rate limit
  for (const it of items) {
    try {
      const r = await generateOne(it.text, it.lang);
      done++;
      if (r.skipped) skipped++;
      else {
        generated++;
        bytesTotal += r.bytes ?? 0;
      }
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      process.stdout.write(
        `\r[${done}/${items.length}] gen=${generated} skip=${skipped} err=${errors} ${(bytesTotal / 1024 / 1024).toFixed(1)}MB ${elapsed}s   `,
      );
      if (!r.skipped) {
        // 100ms задержка после реальной генерации
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (e) {
      errors++;
      console.error(`\nFAIL ${it.lang}:${it.text.slice(0, 40)} — ${e.message}`);
      // Если rate limit — подождём подольше
      if (String(e.message).includes("429")) {
        console.log("Rate limited, waiting 30s…");
        await new Promise((r) => setTimeout(r, 30_000));
      }
    }
  }

  console.log(
    `\n\nDone: ${generated} generated, ${skipped} skipped, ${errors} errors. Total ${(bytesTotal / 1024 / 1024).toFixed(1)} MB.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
