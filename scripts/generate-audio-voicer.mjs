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
//   --chapters=1-5    только эти главы книги (только вместе с --reading)
//   --lanes=N         сколько задач параллельно (1 — для холодного голоса)
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
// Голос на книгу. У каждой книги свой рассказчик, поэтому голос привязан
// к slug, а не к языку: kabut-di-lembang читает женский голос (рассказчица —
// пожилая учительница), perahu-terakhir — свой. Нет книги в списке — берётся
// общий голос её языка из LANG_VOICES (так озвучивается ai-business-english).
// Переопределяется флагом --voice=<id>.
const READING_VOICES = {
  "kabut-di-lembang": "21m00Tcm4TlvDq8ikWAM",
  "perahu-terakhir": "52LXmmR0nGnIcDs1TL3f",
};

// --reading[=slug] переключает источник текстов со словаря на книгу читалки:
// озвучиваются предложения из data/reading/<slug>.json. Всё остальное —
// батчи, ZIP, имена файлов по хэшу — работает ровно так же.
const READING = flag("reading", has("reading") ? "kabut-di-lembang" : null);

// --chapters=1-5 (или =3, или =7-) озвучивает только часть книги. Нужно, чтобы
// не жечь квоту на весь роман сразу: сначала первые главы — послушать голос и
// решить, катить ли дальше. Фильтр идёт по номеру главы (`## 5. My Secret`),
// а не по её порядковому месту в файле: вступление и врезки частей номера не
// имеют и в диапазон не попадают никогда.
const CHAPTERS = (() => {
  const raw = flag("chapters", null);
  if (!raw) return null;
  const m = raw.match(/^(\d+)?\s*-\s*(\d+)?$|^(\d+)$/);
  if (!m) {
    console.error(`Не понимаю --chapters=${raw} (можно: 5, 1-5, 7-)`);
    process.exit(1);
  }
  if (m[3]) return { from: Number(m[3]), to: Number(m[3]) };
  return { from: m[1] ? Number(m[1]) : 1, to: m[2] ? Number(m[2]) : Infinity };
})();
if (CHAPTERS && !READING) {
  console.error("--chapters можно только вместе с --reading=<книга>");
  process.exit(1);
}

// --express переключает источник на модуль «Экспресс»: озвучиваются все
// индонезийские строки из data/express — примеры частиц, формы и примеры
// корней, материал дриллов. Язык всегда один, индонезийский.
const EXPRESS = has("express");
// Голос модуля — тот же, что читает «Kabut di Lembang»: он живой на стороне
// Voicer, а старый голос словаря (zd0hd2egR1Q6EzSLTzCp) уже мёртв.
const EXPRESS_VOICE = "21m00Tcm4TlvDq8ikWAM";

// Язык книги лежит в её .json (пишет scripts/build-reading.mjs). Читаем его
// заранее: от языка зависят и папка public/audio/<lang>, и голос по умолчанию.
function readingLang(slug) {
  const file = path.join(ROOT, "data", "reading", `${slug}.json`);
  if (!fs.existsSync(file)) return "id";
  return JSON.parse(fs.readFileSync(file, "utf8")).lang ?? "id";
}

const ALL_LANGS = ["id", "ru", "en"];
const langArg = flag("lang", null);
// У книги один язык — её собственный: перевода вслух не бывает.
const LANGS = EXPRESS
  ? ["id"]
  : READING
  ? [readingLang(READING)]
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
  voiceOverride ??
  (EXPRESS ? EXPRESS_VOICE : null) ??
  (READING ? READING_VOICES[READING] : null) ??
  LANG_VOICES[lang] ??
  null;

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

// Индонезийские строки модуля «Экспресс». Источник разнородный (частицы,
// корни, дриллы), поэтому фильтр строгий: русские формулировки, служебные
// записи аффиксов вроде «peN- + -an» и обрывки на озвучку не идут.
function isSpeakableId(text) {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 2 || t.length > 120) return false;
  if (/[\u0400-\u04FF]/.test(t)) return false;   // кириллица — это перевод
  if (!/^[A-Za-z]/.test(t)) return false;
  if (/[+…]/.test(t)) return false;               // запись аффиксов
  if (/-$/.test(t)) return false;                 // «meN-», «ter-»
  return true;
}

function collectExpressTexts() {
  const dir = path.join(ROOT, "data", "express");
  if (!fs.existsSync(dir)) {
    console.error(`Нет ${path.relative(ROOT, dir)}`);
    process.exit(1);
  }
  const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const seen = new Set();
  const out = [];
  const add = (text) => {
    if (!isSpeakableId(text)) return;
    const t = text.trim();
    if (seen.has(t)) return;
    seen.add(t);
    out.push({ text: t, lang: "id", kind: "express" });
  };

  const p = read("particles.json");
  for (const particle of p.particles) {
    for (const fn of particle.functions) for (const ex of fn.examples) add(ex.id);
    for (const e of particle.common_errors) add(e.right);
  }
  for (const c of p.chunks) add(c.id);
  for (const pair of p.minimal_pairs) for (const v of pair.variants) add(v.id);
  for (const row of p.ru_bridge_table) add(row.id);

  const r = read("roots.json");
  for (const root of r.roots) {
    for (const f of root.family) {
      add(f.form);
      add(f.example_id);
      if (f.colloquial) add(f.colloquial.split(" / ")[0]);
    }
  }
  for (const pair of [...r.register_pairs, ...r.in_pairs]) {
    add(pair.baku);
    add(pair.colloquial.split(" / ")[0]);
  }
  for (const k of r.ktsp) {
    add(k.root);
    add(k.result);
  }

  const unitsDir = path.join(dir, "units");
  for (const file of fs.readdirSync(unitsDir).filter((f) => f.endsWith(".json"))) {
    const u = JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8"));
    for (const d of u.drills) {
      add(d.audio);
      add(d.prompt);
      add(d.answer);
      for (const f of d.fields ?? []) add(f.answer);
    }
  }
  return out;
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
    if (CHAPTERS && !(ch.num >= CHAPTERS.from && ch.num <= CHAPTERS.to)) continue;
    for (const b of ch.blocks ?? []) {
      // Язык берём у блока, а не у книги: русское вступление внутри английской
      // книги читается русским голосом и лежит в public/audio/ru. Иначе оно
      // уедет в public/audio/en, куда читалка за ним не придёт, — квота в никуда.
      const lang = b.lang ?? book.lang ?? "id";
      for (const s of b.sent ?? []) {
        if (!s.id || seen.has(s.id)) continue;
        seen.add(s.id);
        out.push({ text: s.id, lang, kind: "sentence" });
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

// Опрос статуса задачи. Терминальные статусы приходят не всегда: Voicer умеет
// зависнуть в "processing" навсегда — квота при этом уже списана, а скрипт без
// таймаута ждёт вечно и не пишет ни одного файла. Поэтому два предохранителя:
// STALL_MS без единого сдвига прогресса и TASK_MS на задачу целиком. По любому
// из них задача считается провалившейся, id пишется в лог — по нему архив можно
// докачать вручную командой `download <taskId>`, не тратя символы заново.
const STALL_MS = 5 * 60_000;
const TASK_MS = 20 * 60_000;

async function waitTask(taskId, onProgress) {
  const started = Date.now();
  let lastMove = Date.now();
  let lastProgress = -1;
  for (;;) {
    const st = await api(`/api/v1/voice/status/${taskId}`).then((r) => r.json());
    onProgress?.(st);
    if (["completed", "failed", "censored"].includes(st.status)) return st;
    const p = Math.round(st.progress ?? 0);
    if (p !== lastProgress) {
      lastProgress = p;
      lastMove = Date.now();
    }
    if (Date.now() - lastMove > STALL_MS) {
      throw new Error(`задача ${taskId} стоит на ${p}% дольше ${STALL_MS / 60_000} мин`);
    }
    if (Date.now() - started > TASK_MS) {
      throw new Error(`задача ${taskId} не закончилась за ${TASK_MS / 60_000} мин`);
    }
    await sleep(5000);
  }
}

// Журнал созданных задач: task_id и тексты батча по порядку чанков. Нужен
// ровно для одного случая — задача повисла или скрипт убили, а символы уже
// списаны: по журналу `download <taskId>` разложит архив по тем же именам.
const TASK_LOG = path.join(ROOT, "data", "audio-tasks.jsonl");
function logTask(taskId, lang, batch) {
  try {
    fs.appendFileSync(
      TASK_LOG,
      JSON.stringify({ taskId, lang, texts: batch.map((i) => i.text) }) + "\n",
    );
  } catch {}
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

// Сколько задач держать в работе одновременно. По умолчанию столько, сколько
// разрешает тариф. Флаг --lanes=1 нужен для холодного голоса: клон ElevenLabs
// прогревается первым запросом, и батчи, ушедшие параллельно с ним, зависают
// на 0% навсегда — символы при этом уже списаны. Первый прогон новым голосом
// делать в одну полосу, дальше можно параллелить.
async function parallelLanes() {
  const forced = Number(flag("lanes", "0"));
  if (forced > 0) return forced;
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
  let items = EXPRESS
    ? collectExpressTexts()
    : READING
      ? collectReadingTexts(READING)
      : collectTexts(LANGS);
  if (LIMIT > 0) items = items.slice(0, LIMIT);

  for (const l of LANGS) fs.mkdirSync(path.join(AUDIO_DIR, l), { recursive: true });

  // --force нужен при смене голоса: файл называется по хэшу текста, а не
  // голоса, поэтому старую озвучку надо именно перезаписать.
  const pending = items.filter(
    (i) => FORCE || !fs.existsSync(fileFor(i.text, i.lang)),
  );
  const chars = pending.reduce((a, b) => a + ttsInput(b.text).length, 0);

  console.log(
    `Источник: ${EXPRESS ? "модуль «Экспресс»" : READING ? `книга ${READING}` : "словарь"} · языки: ${LANGS.join(", ")}${FORCE ? " · --force (перезапись)" : ""}`,
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
        `Квота: осталось ${s.remaining_characters.toLocaleString("ru")} символов (истрачено ${s.used_characters.toLocaleString("ru")} из ${s.total_characters.toLocaleString("ru")}), тариф ${s.tariff_code}, до ${s.subscription_expires_at?.slice(0, 10)}`,
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

      logTask(task.task_id, lang, batch);

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

// node scripts/generate-audio-voicer.mjs download <taskId>
// Докачивает уже оплаченную задачу и раскладывает чанки по именам из журнала.
async function cmdDownload() {
  requireKey();
  const taskId = argv.find((a) => !a.startsWith("-") && a !== "download");
  if (!taskId) {
    console.error("Нужен id задачи: download <taskId>");
    process.exit(1);
  }
  if (!fs.existsSync(TASK_LOG)) {
    console.error(`Нет журнала ${path.relative(ROOT, TASK_LOG)}`);
    process.exit(1);
  }
  const row = fs
    .readFileSync(TASK_LOG, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .find((r) => r.taskId === taskId);
  if (!row) {
    console.error(`Задачи ${taskId} нет в журнале`);
    process.exit(1);
  }
  const st = await api(`/api/v1/voice/status/${taskId}`).then((r) => r.json());
  console.log(`Статус: ${st.status}, чанков ${st.chunks_completed}/${row.texts.length}`);
  if (st.status !== "completed") {
    console.error("Задача не готова — качать нечего.");
    process.exit(1);
  }
  const { dir, files } = await downloadChunks(taskId);
  if (files.length !== row.texts.length) {
    console.error(`В архиве ${files.length} файлов, а фраз ${row.texts.length} — не раскладываю.`);
    fs.rmSync(dir, { recursive: true, force: true });
    process.exit(1);
  }
  files.forEach((f, i) => {
    const dest = fileFor(row.texts[i], row.lang);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.rmSync(dest, { force: true });
    fs.renameSync(path.join(dir, f), dest);
  });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`Разложено ${files.length} файлов.`);
}

const commands = { voices: cmdVoices, sample: cmdSample, generate: cmdGenerate, download: cmdDownload };
const run = commands[command];
if (!run) {
  console.error(`Неизвестная команда: ${command}`);
  process.exit(1);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
