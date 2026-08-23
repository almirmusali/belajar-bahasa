// Озвучка словаря голосами ElevenLabs через Voicer API (voicer.mat3u.com).
// MP3 кладутся в public/audio/<lang>/ и отдаются самим Next.js — Supabase не нужен.
//
// Требует в .env.local:
//   VOICER_API_KEY=...
//
// Команды:
//   node scripts/generate-audio-voicer.mjs voices     — какие голоса на каких языках
//   node scripts/generate-audio-voicer.mjs sample     — начитать демо
//   node scripts/generate-audio-voicer.mjs --dry      — объём и остаток квоты
//   node scripts/generate-audio-voicer.mjs            — озвучить (языки из --lang)
//
// Флаги:
//   --lang=id,ru,en   какие языки озвучивать (по умолчанию все настроенные)
//   --voice=<id>      переопределить голос (только вместе с одним --lang)
//   --force           перезаписать уже озвученное (нужно при смене голоса)
//   --examples        озвучить ещё и фразы-примеры
//   --model=<id> --batch=N --limit=N --dry
//
// Идемпотентен: готовый файл на диске пропускается, можно прерывать и добирать.
//
// Как это работает. У Voicer асинхронное API: POST задачу → опрос статуса →
// скачивание. Ключевой приём — split_type "paragraphs" + split_output: текст
// из N абзацев возвращается ZIP-архивом из N отдельных MP3 (0000.mp3, 0001.mp3…)
// в том же порядке. Поэтому одним запросом уходит целый батч фраз, а не одна:
// 1262 слова — это 13 задач вместо 1262.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

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

const API_KEY = process.env.VOICER_API_KEY;
const API = (process.env.VOICER_BASE_URL ?? "https://voicer.mat3u.com").replace(
  /\/+$/,
  "",
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const VOCAB_DIR = path.join(ROOT, "data", "vocab");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const SAMPLE_DIR = path.join(AUDIO_DIR, "_samples");
const TMP_DIR = path.join(ROOT, ".audio-tmp");

// Голос на каждый язык — выбраны вручную по демо-нарезкам (команда `sample`).
// null = язык пока не озвучиваем: плеер сам сходит на системный Web Speech.
// 24 августа 2026: прежний id-голос zd0hd2egR1Q6EzSLTzCp на стороне Voicer
// перестал существовать («клон не готов в БД»), задачи с ним падают целиком.
// Заменён на 21m00Tcm4TlvDq8ikWAM — спокойный женский голос, он же читает
// книгу в читалке. Сравнить кандидатов: npm run audio:sample -- --lang=id
// --voice=<id>; рабочие на сегодня — 21m00Tcm4TlvDq8ikWAM,
// AB9XsbSA4eLG12t2myjN, EXAVITQu4vr4xnSDxMaL, ErXwobaYiN019PkySvjV.
const LANG_VOICES = {
  id: "21m00Tcm4TlvDq8ikWAM",
  ru: "D5RRIJYa9pFwxiSpbGbR",
  en: "uYXf8XasLslADfZ2MB4u",
};

// Фразы для демо на каждом языке — по ним сравниваются голоса-кандидаты.
const SAMPLE_TEXTS = {
  id: [
    "Selamat pagi",
    "Terima kasih banyak",
    "Berapa harganya?",
    "Saya belum mengerti, tolong ulangi.",
    "Dia sedang bekerja di kantor pusat.",
  ],
  ru: [
    "Доброе утро",
    "Большое спасибо",
    "Сколько это стоит?",
    "Я пока не понимаю, повтори пожалуйста.",
    "Он работает в главном офисе.",
  ],
  en: [
    "Good morning",
    "Thank you very much",
    "How much does it cost?",
    "I do not understand yet, please repeat.",
    "He is working at the head office.",
  ],
};

// ---------------------------------------------------------------- аргументы

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith("-")) ?? "generate";
const flag = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = (name) => argv.includes(`--${name}`);

// eleven_multilingual_v2 — лучшее качество из стабильных моделей.
// turbo/flash быстрее и дешевле, но для словаря важна дикция, не задержка.
const MODEL = flag("model", "eleven_multilingual_v2");
// Сотня фраз на задачу: сервер молотит чанки примерно с постоянной скоростью,
// так что размер батча не меняет общее время — зато мелкие батчи дают
// понятный прогресс и при сбое теряется меньше.
const BATCH = Number(flag("batch", "100"));
const LIMIT = Number(flag("limit", "0"));
const WITH_EXAMPLES = has("examples");
const DRY = has("dry");
const FORCE = has("force");
// Ограничить одним набором (папка в data/vocab) — например чтобы посмотреть
// на озвучку примеров в одном наборе, прежде чем катить на все.
const ONLY_SET = flag("set", null);
// --reading[=slug] переключает источник текстов со словаря на книгу читалки:
// озвучиваются предложения из data/reading/<slug>.json. Всё остальное —
// батчи, ZIP, имена файлов по хэшу — работает ровно так же.
const READING = flag("reading", has("reading") ? "kabut-di-lembang" : null);

const ALL_LANGS = ["id", "ru", "en"];
const langArg = flag("lang", null);
// Книга на индонезийском — русского и английского перевода вслух не бывает.
const LANGS = READING
  ? ["id"]
  : langArg
    ? langArg.split(",").map((s) => s.trim())
    : ALL_LANGS.filter((l) => LANG_VOICES[l]);

for (const l of LANGS) {
  if (!ALL_LANGS.includes(l)) {
    console.error(`Неизвестный язык: ${l} (можно: ${ALL_LANGS.join(", ")})`);
    process.exit(1);
  }
}

// --voice переопределяет голос — но только когда язык один, иначе непонятно,
// какому из них голос назначать.
const voiceOverride = flag("voice", null);
if (voiceOverride && LANGS.length !== 1) {
  console.error("--voice можно только вместе с одним --lang=<язык>");
  process.exit(1);
}
const voiceFor = (lang) =>
  voiceOverride ?? LANG_VOICES[lang] ?? null;

// Под словарь: высокая стабильность (одинаковая подача на всех словах),
// style 0 (без интонационной отсебятины), чуть медленнее нормы.
const VOICE_SETTINGS = {
  stability: 0.6,
  similarity_boost: 0.85,
  style: 0,
  use_speaker_boost: true,
  speed: 0.9,
};

// ---------------------------------------------------------------- вокабуляр

// FNV-1a — должно совпадать с lib/audio-url.ts, иначе фронт не найдёт файл.
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h ^ str.charCodeAt(i), 0x01000193)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const fileFor = (text, lang) =>
  path.join(AUDIO_DIR, lang, `${fnv1a(`${lang}:${text}`)}.mp3`);

// Собирает уникальные фразы по языкам. Внутри языка дубли схлопываются:
// одно и то же слово встречается в разных наборах, озвучивать дважды не нужно.
function collectTexts(langs) {
  const seen = new Map(); // `${lang}:${text}` -> {text, lang, kind}
  const folders = fs
    .readdirSync(VOCAB_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !ONLY_SET || name === ONLY_SET);

  if (ONLY_SET && !folders.length) {
    console.error(`Нет набора «${ONLY_SET}» в data/vocab`);
    process.exit(1);
  }

  const add = (text, lang, kind) => {
    if (!text || !langs.includes(lang)) return;
    const key = `${lang}:${text}`;
    if (!seen.has(key)) seen.set(key, { text, lang, kind });
  };

  for (const slug of folders) {
    const file = path.join(VOCAB_DIR, slug, "index.json");
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const w of data.words ?? []) {
      add(w.id, "id", "word");
      add(w.ru, "ru", "word");
      add(w.en, "en", "word");
      if (!WITH_EXAMPLES) continue;
      for (const ex of w.examples ?? []) {
        // У примеров есть только индонезийский и русский.
        add(ex.id, "id", "example");
        add(ex.ru, "ru", "example");
      }
    }
  }
  return [...seen.values()];
}

// Предложения книги для читалки: те же ключи, что у переводов, — сам текст.
// Дубли схлопываются, повторяющаяся реплика озвучивается один раз.
function collectReadingTexts(slug) {
  const file = path.join(ROOT, "data", "reading", `${slug}.json`);
  if (!fs.existsSync(file)) {
    console.error(`Нет ${path.relative(ROOT, file)} — сначала node scripts/build-reading.mjs`);
    process.exit(1);
  }
  const book = JSON.parse(fs.readFileSync(file, "utf8"));
  const seen = new Set();
  const out = [];
  for (const ch of book.chapters ?? []) {
    for (const b of ch.blocks ?? []) {
      for (const s of b.sent ?? []) {
        if (!s.id || seen.has(s.id)) continue;
        seen.add(s.id);
        out.push({ text: s.id, lang: "id", kind: "sentence" });
      }
    }
  }
  return out;
}

// Что уходит в TTS. Два требования:
//  1) без внутренних переносов — иначе одна фраза распадётся на два абзаца
//     и вся привязка «индекс чанка → фраза» съедет;
//  2) с терминальной точкой — короткие слова модель иначе подрезает.
// На имя файла это не влияет: хэш считается от исходного текста.
function ttsInput(text) {
  const flat = text.replace(/\s+/g, " ").trim();
  return /[.!?…]$/.test(flat) ? flat : `${flat}.`;
}

// ---------------------------------------------------------------- API

function requireKey() {
  if (!API_KEY) {
    console.error("Нет VOICER_API_KEY в .env.local");
    process.exit(1);
  }
}

const authHeaders = () => ({ Authorization: `Bearer ${API_KEY}` });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(pathname, init = {}) {
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${pathname} → ${res.status}: ${body.slice(0, 300)}`);
  }
  return res;
}

const stats = () => api("/api/v1/user/stats").then((r) => r.json());

async function createTask(texts, voiceId, lang) {
  const res = await api("/api/v1/voice/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: texts.map(ttsInput).join("\n\n"),
      voice_id: voiceId,
      model_id: MODEL,
      language_code: lang,
      voice_settings: VOICE_SETTINGS,
      split_type: "paragraphs",
      split_output: true, // ZIP: один MP3 на абзац
      auto_pause_enabled: false,
    }),
  });
  return res.json();
}

async function waitTask(taskId, onProgress) {
  for (;;) {
    const st = await api(`/api/v1/voice/status/${taskId}`).then((r) => r.json());
    onProgress?.(st);
    if (["completed", "failed", "censored"].includes(st.status)) return st;
    await sleep(5000);
  }
}

// ZIP распаковываем системным unzip: тянуть зависимость ради одного архива
// не стоит, а unzip есть и в macOS, и в CI-образах.
async function downloadChunks(taskId) {
  const res = await api(`/api/v1/voice/download/${taskId}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dir = path.join(TMP_DIR, taskId);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const zip = path.join(dir, "chunks.zip");
  fs.writeFileSync(zip, buf);
  execFileSync("unzip", ["-qq", zip, "-d", dir]);
  fs.rmSync(zip);
  return {
    dir,
    files: fs.readdirSync(dir).filter((f) => f.endsWith(".mp3")).sort(),
  };
}

async function parallelLanes() {
  try {
    const s = await stats();
    return Math.max(1, s.tariff?.max_parallel_tasks ?? 5);
  } catch {
    return 5;
  }
}

// ---------------------------------------------------------------- команды

async function cmdVoices() {
  console.log(
    "\nУ Voicer нет эндпоинта со списком голосов — voice_id уходит в ElevenLabs как есть.",
  );
  console.log("Настроено в LANG_VOICES (scripts/generate-audio-voicer.mjs):\n");
  for (const l of ALL_LANGS) {
    const v = LANG_VOICES[l];
    console.log(`  ${l}  ${v ?? "— не задан, останется системный Web Speech"}`);
  }
  console.log(
    "\nПослушать кандидата: npm run audio:sample -- --lang=<язык> --voice=<voice_id>",
  );
}

async function cmdSample() {
  requireKey();
  fs.mkdirSync(SAMPLE_DIR, { recursive: true });

  const jobs = LANGS.map((lang) => ({
    lang,
    voice: voiceFor(lang),
  })).filter((j) => {
    if (!j.voice) console.error(`${j.lang}: голос не задан — пропускаю`);
    return j.voice;
  });
  if (!jobs.length) return;

  const lanes = await parallelLanes();
  for (let i = 0; i < jobs.length; i += lanes) {
    const group = jobs.slice(i, i + lanes);
    const started = [];
    for (const j of group) {
      try {
        const t = await createTask(SAMPLE_TEXTS[j.lang], j.voice, j.lang);
        started.push({ ...j, taskId: t.task_id });
        console.log(`  → ${j.lang} / ${j.voice}: задача ${t.task_id.slice(0, 8)}`);
      } catch (e) {
        console.error(`  ✗ ${j.lang}: ${e.message}`);
      }
    }
    // Волна дожидается своих задач — иначе следующая упрётся в лимит 429.
    for (const t of started) {
      const st = await waitTask(t.taskId);
      if (st.status === "failed") {
        console.error(`✗ ${t.lang}: ${st.error_message}`);
        continue;
      }
      const { dir, files } = await downloadChunks(t.taskId);
      files.forEach((f, n) => {
        fs.renameSync(
          path.join(dir, f),
          path.join(SAMPLE_DIR, `${t.lang}-${t.voice}-${n + 1}.mp3`),
        );
      });
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✓ ${t.lang}: ${files.length} файлов`);
    }
  }

  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log(`\nСэмплы: ${path.relative(ROOT, SAMPLE_DIR)} (папка в .gitignore)`);
}

async function cmdGenerate() {
  let items = READING ? collectReadingTexts(READING) : collectTexts(LANGS);
  if (LIMIT > 0) items = items.slice(0, LIMIT);

  for (const l of LANGS) fs.mkdirSync(path.join(AUDIO_DIR, l), { recursive: true });

  // --force нужен при смене голоса: файл называется по хэшу текста, а не
  // голоса, поэтому старую озвучку надо именно перезаписать.
  const pending = items.filter(
    (i) => FORCE || !fs.existsSync(fileFor(i.text, i.lang)),
  );
  const chars = pending.reduce((a, b) => a + ttsInput(b.text).length, 0);

  console.log(
    `Источник: ${READING ? `книга ${READING}` : "словарь"} · языки: ${LANGS.join(", ")}${FORCE ? " · --force (перезапись)" : ""}`,
  );
  for (const l of LANGS) {
    const all = items.filter((i) => i.lang === l);
    const todo = pending.filter((i) => i.lang === l);
    const voice = voiceFor(l);
    console.log(
      `  ${l}: ${todo.length} из ${all.length} фраз, ${todo.reduce((a, b) => a + ttsInput(b.text).length, 0).toLocaleString("ru")} символов · голос ${voice ?? "НЕ ЗАДАН"}`,
    );
  }
  console.log(`Модель: ${MODEL}`);

  const missingVoice = LANGS.filter((l) => !voiceFor(l));
  if (missingVoice.length) {
    console.error(
      `\nНет голоса для: ${missingVoice.join(", ")} — задай в LANG_VOICES или через --voice`,
    );
    if (!DRY) process.exit(1);
  }

  if (API_KEY) {
    try {
      const s = await stats();
      console.log(
        `Квота: ${s.remaining_characters.toLocaleString("ru")} из ${s.total_characters.toLocaleString("ru")}, тариф ${s.tariff_code}, до ${s.subscription_expires_at?.slice(0, 10)}`,
      );
      if (chars > s.remaining_characters) {
        console.error("\nНе хватает квоты — прерываю.");
        process.exit(1);
      }
    } catch (e) {
      console.error(`Не смог прочитать квоту: ${e.message}`);
    }
  }

  if (DRY) return console.log("\n--dry: ничего не генерирую.");
  if (!pending.length) return console.log("Всё уже озвучено.");
  requireKey();

  // Батчи не смешивают языки: голос и language_code задаются на задачу.
  const batches = [];
  for (const lang of LANGS) {
    const forLang = pending.filter((i) => i.lang === lang);
    for (let i = 0; i < forLang.length; i += BATCH) {
      batches.push({ lang, items: forLang.slice(i, i + BATCH) });
    }
  }
  console.log(`\n${batches.length} задач по ≤${BATCH} фраз`);

  let ok = 0,
    failed = 0,
    bytes = 0;
  const state = new Map();

  // Задачи идут параллельно: сервер долго молотит один батч (сотня чанков —
  // это десятки минут), последовательный проход упирался бы в часы.
  // Больше max_parallel_tasks пускать нельзя — API отвечает 429.
  const lanes = await parallelLanes();
  console.log(`Параллельно: ${lanes} задач\n`);

  const render = () => {
    process.stdout.write(
      `\r${[...state.entries()].map(([l, s]) => `${l}${s}`).join(" ")}${" ".repeat(8)}`,
    );
  };

  const processBatch = async ({ lang, items: batch }, label) => {
    state.set(label, "…");
    try {
      let task;
      // 429 = все слоты заняты (например, чужим запуском). Ждём слот, не падаем.
      for (;;) {
        try {
          task = await createTask(
            batch.map((i) => i.text),
            voiceFor(lang),
            lang,
          );
          break;
        } catch (e) {
          if (!String(e.message).includes("429")) throw e;
          state.set(label, "◷");
          render();
          await sleep(30_000);
        }
      }

      // Расхождение числа чанков и числа фраз ломает привязку «индекс → фраза».
      // Лучше пропустить батч, чем разложить озвучку по чужим именам.
      if (task.chunks_count !== batch.length) {
        state.set(label, `✗чанков ${task.chunks_count}≠${batch.length}`);
        failed += batch.length;
        return;
      }

      const st = await waitTask(task.task_id, (s) => {
        state.set(label, `${Math.round(s.progress ?? 0)}%`);
        render();
      });

      if (st.status === "failed") {
        state.set(label, `✗${st.error_message ?? "failed"}`);
        failed += batch.length;
        return;
      }
      // censored — часть чанков заблокирована, состав ZIP уже не совпадает
      // с батчем по индексам. Раскладывать наугад нельзя.
      if (st.chunks_completed !== batch.length) {
        state.set(label, `✗${st.chunks_completed}/${batch.length} ${st.status}`);
        failed += batch.length;
        return;
      }

      const { dir, files } = await downloadChunks(task.task_id);
      if (files.length !== batch.length) {
        state.set(label, `✗архив ${files.length}≠${batch.length}`);
        failed += batch.length;
        fs.rmSync(dir, { recursive: true, force: true });
        return;
      }

      files.forEach((f, i) => {
        const dest = fileFor(batch[i].text, lang);
        fs.rmSync(dest, { force: true });
        fs.renameSync(path.join(dir, f), dest);
        bytes += fs.statSync(dest).size;
      });
      fs.rmSync(dir, { recursive: true, force: true });
      ok += batch.length;
      state.set(label, "✓");
    } catch (e) {
      state.set(label, `✗${e.message.slice(0, 40)}`);
      failed += batch.length;
    } finally {
      render();
    }
  };

  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(lanes, batches.length) }, async () => {
      while (next < batches.length) {
        const i = next++;
        await processBatch(batches[i], `[${i + 1}/${batches.length}${batches[i].lang === LANGS[0] && LANGS.length === 1 ? "" : ":" + batches[i].lang}]`);
      }
    }),
  );
  console.log();

  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log(
    `\nГотово: ${ok} озвучено, ${failed} не вышло, ${(bytes / 1024 / 1024).toFixed(1)} MB`,
  );
  if (failed) console.log("Перезапусти скрипт — недостающее доберётся.");
}

const commands = { voices: cmdVoices, sample: cmdSample, generate: cmdGenerate };
const run = commands[command];
if (!run) {
  console.error(`Неизвестная команда: ${command}`);
  process.exit(1);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
