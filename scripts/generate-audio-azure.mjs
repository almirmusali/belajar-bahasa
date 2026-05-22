// Прогенерирует MP3 для каждого слова через Microsoft Azure Speech (Neural voices).
// Использует нативные голоса для каждого языка — звучит как живой носитель.
//
// Требует переменные в .env.local:
//   AZURE_SPEECH_KEY=...
//   AZURE_SPEECH_REGION=westeurope   (или твой регион)
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...
//
// Запуск: node scripts/generate-audio-azure.mjs
// Идемпотентен: пропускает уже существующие в Storage файлы.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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

const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!AZURE_KEY || !AZURE_REGION) {
  console.error(
    "Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION in .env.local",
  );
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

// Карта язык → SSML locale и voice
const VOICES = {
  id: { locale: "id-ID", voice: "id-ID-GadisNeural" },
  en: { locale: "en-US", voice: "en-US-AriaNeural" },
  ru: { locale: "ru-RU", voice: "ru-RU-SvetlanaNeural" },
};

const TTS_ENDPOINT = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSSML(text, lang) {
  const { locale, voice } = VOICES[lang];
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${locale}'>
  <voice name='${voice}'>
    <prosody rate='-5%'>${escapeXml(text)}</prosody>
  </voice>
</speak>`;
}

function collectAllTexts() {
  const items = new Map();
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
    }
  }
  return [...items.values()];
}

async function fileExists(filename) {
  const url = `${SUPABASE_URL}/storage/v1/object/public/audio/${filename}`;
  const res = await fetch(url, { method: "HEAD" });
  return res.ok;
}

async function generateOne(text, lang) {
  const filename = audioFilename(text, lang);

  if (await fileExists(filename)) {
    return { skipped: true, filename };
  }

  const ssml = buildSSML(text, lang);

  const res = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_KEY,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": OUTPUT_FORMAT,
      "User-Agent": "belajar-bahasa",
    },
    body: ssml,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Azure ${res.status}: ${errText.slice(0, 200)}`);
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

const CONCURRENCY = 6;

async function main() {
  const items = collectAllTexts();
  console.log(
    `Found ${items.length} unique (text, lang) pairs · ${CONCURRENCY} parallel workers`,
  );
  console.log(`Voices: ID=${VOICES.id.voice}, EN=${VOICES.en.voice}, RU=${VOICES.ru.voice}`);

  let done = 0;
  let skipped = 0;
  let generated = 0;
  let errors = 0;
  let bytesTotal = 0;
  const t0 = Date.now();
  let nextIndex = 0;

  const renderProgress = () => {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    process.stdout.write(
      `\r[${done}/${items.length}] gen=${generated} skip=${skipped} err=${errors} ${(bytesTotal / 1024 / 1024).toFixed(1)}MB ${elapsed}s   `,
    );
  };

  const worker = async () => {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      const it = items[idx];
      try {
        const r = await generateOne(it.text, it.lang);
        if (r.skipped) skipped++;
        else {
          generated++;
          bytesTotal += r.bytes ?? 0;
        }
      } catch (e) {
        errors++;
        console.error(
          `\nFAIL ${it.lang}:${it.text.slice(0, 40)} — ${e.message}`,
        );
        if (String(e.message).includes("429")) {
          console.log("Rate limited, waiting 15s…");
          await new Promise((r) => setTimeout(r, 15_000));
        }
      } finally {
        done++;
        renderProgress();
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(
    `\n\nDone: ${generated} generated, ${skipped} skipped, ${errors} errors. Total ${(bytesTotal / 1024 / 1024).toFixed(1)} MB.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
