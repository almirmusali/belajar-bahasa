// Озвучка книги читалки голосом-клоном через Lumean (Cartesia sonic-3.6).
//
//   node scripts/generate-audio-lumean.mjs --reading=perahu-terakhir --dry
//   node scripts/generate-audio-lumean.mjs --reading=perahu-terakhir             # предложения + слова
//   node scripts/generate-audio-lumean.mjs --reading=perahu-terakhir --only=words --limit=5
//
// Флаги: --voice=almir (по умолчанию — голос из <!-- voice: … --> книги),
//        --only=sent|words, --limit=N (столько единиц, для пробы), --dry.
//
// Куда кладёт (читалка ищет там же, см. lib/audio-url.ts):
//   public/audio/voice/<voice>/<lang>/<fnv1a(lang:предложение)>.mp3
//   public/audio/voice/<voice>/<lang>/w/<fnv1a(lang:слово в нижнем регистре)>.mp3
//
// Как это работает. Заказ Lumean в абзацном режиме (generation_mode=paragraph)
// озвучивает каждый абзац отдельным чанком, и у чанка свой файл и свой
// paragraph_index. Поэтому одним заказом уходит пачка фраз (абзац = фраза),
// а обратно приходит по файлу на фразу — резать общую дорожку не нужно.
//
// Квота: Lumean берёт сначала токены подписки, потом баланс LUMC. Скрипт
// печатает списание с баланса (price_formatted) у каждого заказа: при живой
// подписке там 0. Id заказа пишется в data/audio-lumean-orders.jsonl сразу
// после создания, и перезапуск сначала дособирает уже оплаченные заказы, а не
// заказывает заново. Готовый файл на диске пропускается.
//
// Ключ — LUMEAN_API_KEY в .env.local или в ~/Code/biz-doc-id/.env.
// Адреса API не подбирать наугад: 404 на несуществующий путь банит IP.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio", "voice");
const LOG = path.join(ROOT, "data", "audio-lumean-orders.jsonl");
const BASE = "https://api.lumean.app/api/public";

// Голоса-клоны. Шаблоны Lumean уже заведены в кабинете (скорость 1.0 —
// как в готовых роликах автора; темп без его слова не трогаем).
const VOICES = {
  almir: {
    label: "Альмир (клон Cartesia)",
    templates: {
      id: "01a18610-71ec-7141-9ea7-65a368985045",
      ru: "01a1860b-0159-710e-b827-4473153cbc92",
    },
  },
};

const BATCH_ITEMS = 120; // абзацев в заказе
const BATCH_CHARS = 6000;
// Одновременных TTS-заказов аккаунт держит два, и их делят другие проекты —
// по умолчанию берём одну полосу, --lanes=2 если аккаунт свободен.
const LANES = Number(process.argv.find((a) => a.startsWith("--lanes="))?.slice(8) || 1);

// ---------------------------------------------------------------- флаги
const argv = process.argv.slice(2);
const flag = (name, def = null) => {
  const a = argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!a) return def;
  const v = a.split("=").slice(1).join("=");
  return v === "" ? true : v;
};
const SLUG = flag("reading");
const ONLY = flag("only");
const LIMIT = flag("limit") ? Number(flag("limit")) : Infinity;
const DRY = !!flag("dry");
if (!SLUG) {
  console.error("Нужно --reading=<книга>");
  process.exit(1);
}

function apiKey() {
  for (const f of [path.join(ROOT, ".env.local"), path.join(os.homedir(), "Code/biz-doc-id/.env")]) {
    try {
      const m = fs.readFileSync(f, "utf8").match(/^LUMEAN_API_KEY=(.+)$/m);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch {}
  }
  console.error("Нет LUMEAN_API_KEY ни в .env.local, ни в ~/Code/biz-doc-id/.env");
  process.exit(1);
}
const KEY = DRY ? null : apiKey();

// ---------------------------------------------------------------- хэш
// Тот же FNV-1a, что в lib/audio-url.ts: имя файла должно совпасть с тем,
// что посчитает браузер.
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}
const outFile = (voice, lang, kind, key) =>
  path.join(AUDIO_DIR, voice, lang, ...(kind === "word" ? ["w"] : []), `${fnv1a(`${lang}:${key}`)}.mp3`);

// ---------------------------------------------------------------- тексты
const book = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "reading", `${SLUG}.json`), "utf8"));
const VOICE = flag("voice") ?? book.voice;
if (!VOICES[VOICE]) {
  console.error(`Голос «${VOICE}» не настроен. Есть: ${Object.keys(VOICES).join(", ")}`);
  process.exit(1);
}

// Слово озвучивается в той форме, в какой чаще стоит в тексте: имена так и
// остаются с большой буквы, а «Saya» в начале фразы читается как saya.
function collect() {
  const sents = new Map();
  const words = new Map(); // ключ → { lang, forms: Map<форма, число> }
  const addWord = (raw, lang) => {
    const key = raw.toLowerCase();
    const k = `${lang}\u0000${key}`;
    if (!words.has(k)) words.set(k, { lang, key, forms: new Map() });
    const f = words.get(k).forms;
    f.set(raw, (f.get(raw) ?? 0) + 1);
  };
  for (const ch of book.chapters) {
    for (const b of ch.blocks) {
      const lang = b.lang ?? book.lang ?? "id";
      if (b.kind === "v") {
        // Врезка «Kata Baru»: слово или короткое сочетание целиком.
        for (const it of b.items) addWord(it.id.replace(/\s+/g, " ").trim(), lang);
        continue;
      }
      for (const s of b.sent ?? []) {
        if (!sents.has(`${lang}\u0000${s.id}`)) sents.set(`${lang}\u0000${s.id}`, { lang, key: s.id });
        if (lang !== (book.lang ?? "id")) continue; // русское вступление — без пословной озвучки
        for (const g of s.seg) for (const t of g.tk) if (t.w) addWord(t.w, lang);
      }
    }
  }
  const units = [];
  if (ONLY !== "words")
    for (const s of sents.values()) units.push({ kind: "sent", lang: s.lang, key: s.key, text: s.key });
  if (ONLY !== "sent")
    for (const w of words.values()) {
      const best = [...w.forms].sort((a, b) => b[1] - a[1])[0][0];
      // Капитализация со строчной: «Saya» в начале фразы не имя собственное.
      const lower = w.forms.has(w.key) ? w.key : best;
      units.push({ kind: "word", lang: w.lang, key: w.key, text: lower });
    }
  return units;
}

// Абзац = одна строка без переносов и с точкой в конце: без точки Cartesia
// подрезает короткие слова, а перенос разорвал бы фразу на два абзаца.
function ttsInput(text) {
  const flat = text.replace(/\s+/g, " ").replace(/[[\]]/g, "").trim();
  return /[.!?…»"”]$/.test(flat) ? flat : `${flat}.`;
}

// ---------------------------------------------------------------- API
let busyWaits = 0;
async function call(method, p, body) {
  let last = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    let r;
    try {
      r = await fetch(BASE + p, {
        method,
        headers: { "X-API-KEY": KEY, "Content-Type": "application/json", Accept: "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(120_000),
      });
    } catch (e) {
      // Заказ мог создаться, а ответ потеряться: повтор оплатил бы его дважды.
      if (method === "POST" && p === "/orders") throw new Error(`POST /orders: обрыв связи (${e.message}) — проверьте GET /orders`);
      await sleep(10_000 * (attempt + 1));
      continue;
    }
    const txt = await r.text();
    if (r.ok) return JSON.parse(txt);
    // Обслуживание — не сбой на секунду: ждать его ретраями бессмысленно, а
    // повтор POST /orders без ответа рискует двойной оплатой. Выходим с кодом 75,
    // обёртка (или человек) запустит заново позже — скрипт идемпотентен.
    if (/service_maintenance/.test(txt)) {
      console.log(`Lumean на обслуживании (${method} ${p}) — запустите позже`);
      process.exit(75);
    }
    // «Одновременно выполняется слишком много задач» — очередь аккаунта занята
    // (её делят и другие проекты). Заказ не создан, ждём освобождения: по
    // минуте, до двух часов, и это не считается попыткой.
    if (r.status === 429 && /\\u041e\\u0434\\u043d\\u043e\\u0432\\u0440|Одновр/.test(txt)) {
      if (++busyWaits > 120) throw new Error(`${method} ${p}: очередь Lumean занята больше двух часов`);
      if (busyWaits % 10 === 1) console.log(`  … очередь Lumean занята, жду (${busyWaits} мин)`);
      await sleep(60_000);
      attempt--;
      continue;
    }
    if (r.status === 429 || r.status >= 500) {
      if (/ip_banned/.test(txt)) throw new Error(`IP забанен Lumean: ${txt.slice(0, 300)}`);
      last = `${r.status}: ${txt.slice(0, 200)}`;
      await sleep(15_000 * (attempt + 1));
      continue;
    }
    throw new Error(`${method} ${p} → ${r.status}: ${txt.slice(0, 500)}`);
  }
  throw new Error(`${method} ${p}: не отвечает (${last})`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(storagePath, dst) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { data } = await call("POST", "/storage/url", { path: storagePath });
      const r = await fetch(data.url, { signal: AbortSignal.timeout(120_000) });
      if (!r.ok) throw new Error(`${r.status}`);
      fs.writeFileSync(dst, Buffer.from(await r.arrayBuffer()));
      return;
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(5000 * (attempt + 1));
    }
  }
}

// WAV чанка → MP3 для сайта. Тишину по краям срезаем (оставляя 40 мс), чтобы
// слово звучало сразу по тапу, и ставим фейды 10/20 мс — край файла не должен
// обрываться на ненулевом сэмпле, иначе щелчок.
function toMp3(wavs, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  const inputs = wavs.flatMap((w) => ["-i", w]);
  const concat = wavs.length > 1 ? `${wavs.map((_, i) => `[${i}:a]`).join("")}concat=n=${wavs.length}:v=0:a=1,` : "";
  const trim =
    "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.04," +
    "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.04," +
    "afade=t=in:d=0.02,areverse,afade=t=in:d=0.01";
  const tmp = `${dst}.part.mp3`;
  execFileSync("ffmpeg", [
    "-loglevel", "error", "-y", ...inputs,
    "-filter_complex", `${concat}${trim}`,
    "-ac", "1", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "96k", tmp,
  ]);
  fs.renameSync(tmp, dst);
}

function readLog() {
  if (!fs.existsSync(LOG)) return [];
  return fs.readFileSync(LOG, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}
function appendLog(rec) {
  fs.appendFileSync(LOG, JSON.stringify(rec) + "\n");
}

// Готовый заказ → по файлу на единицу. Чанки абзаца берём по порядку; если
// исходный чанк упал, а повтор прошёл — берём повтор (у него paragraph_index
// пустой, привязка через parent_item_id).
async function collectOrder(rec) {
  let o;
  for (;;) {
    o = (await call("GET", `/orders/${rec.order}`)).data;
    if (["completed", "partially_completed", "failed", "cancelled", "compensated"].includes(o.status)) break;
    await sleep(8000);
  }
  if (!["completed", "partially_completed"].includes(o.status)) {
    console.log(`  ✗ заказ ${rec.order}: ${o.status}`);
    return { ok: 0, bad: rec.units.length };
  }
  const items = (await call("GET", `/orders/${rec.order}/items`)).data;
  const byPar = new Map();
  for (const it of items) {
    if (it.item_type !== "chunk" || it.paragraph_index == null) continue;
    let use = it;
    if (it.status !== "completed") {
      use = items.find((x) => x.parent_item_id === it.id && x.status === "completed") ?? null;
    }
    if (!byPar.has(it.paragraph_index)) byPar.set(it.paragraph_index, []);
    byPar.get(it.paragraph_index).push({ idx: it.chunk_index ?? 0, item: use });
  }
  if (byPar.size !== rec.units.length) {
    // Сервис разбил текст на другое число абзацев — привязка «абзац → фраза»
    // съехала бы на всех следующих. Не угадываем, а останавливаемся.
    throw new Error(`заказ ${rec.order}: абзацев ${byPar.size}, а фраз ${rec.units.length} — разбор вручную`);
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lumean-"));
  let ok = 0, bad = 0;
  try {
    for (const [pi, chunks] of [...byPar].sort((a, b) => a[0] - b[0])) {
      const u = rec.units[pi];
      const dst = outFile(rec.voice, u.lang, u.kind, u.key);
      if (fs.existsSync(dst)) { ok++; continue; }
      chunks.sort((a, b) => a.idx - b.idx);
      if (chunks.some((c) => !c.item)) { bad++; console.log(`  ✗ не озвучено: ${u.text}`); continue; }
      const wavs = [];
      for (const [i, c] of chunks.entries()) {
        const rf = c.item.result_file;
        const p = typeof rf === "string" ? rf : rf?.path ?? rf?.file ?? rf?.url;
        if (!p) throw new Error(`заказ ${rec.order}: у чанка нет пути, result_file=${JSON.stringify(rf)}`);
        const w = path.join(tmp, `${pi}-${i}${path.extname(p) || ".wav"}`);
        await download(p, w);
        wavs.push(w);
      }
      toMp3(wavs, dst);
      ok++;
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`  ✓ заказ ${rec.order}: ${ok} файлов${bad ? `, ${bad} без звука` : ""}, с баланса ${o.price_formatted ?? "?"} LUMC, токенов ${o.tokens_spent ?? o.total_tokens ?? "?"}`);
  return { ok, bad };
}

// ---------------------------------------------------------------- main
const all = collect();
const todo = all.filter((u) => !fs.existsSync(outFile(VOICE, u.lang, u.kind, u.key)));
const pendingLogged = new Set();
const log = readLog().filter((r) => r.slug === SLUG && r.voice === VOICE);
for (const r of log) for (const u of r.units) pendingLogged.add(`${u.kind}\u0000${u.lang}\u0000${u.key}`);
const fresh = todo.filter((u) => !pendingLogged.has(`${u.kind}\u0000${u.lang}\u0000${u.key}`)).slice(0, LIMIT);

const chars = (arr) => arr.reduce((a, u) => a + ttsInput(u.text).length, 0);
console.log(
  `${book.title} · голос ${VOICES[VOICE].label}\n` +
    `всего ${all.length} (фраз ${all.filter((u) => u.kind === "sent").length}, слов ${all.filter((u) => u.kind === "word").length}), ` +
    `нет файла ${todo.length}, в заказах ${todo.length - todo.filter((u) => !pendingLogged.has(`${u.kind}\u0000${u.lang}\u0000${u.key}`)).length}, ` +
    `новых ${fresh.length} · ${chars(fresh)} символов ≈ ${Math.round(chars(fresh) * 0.6)} токенов`,
);
if (DRY) process.exit(0);

// Пачки: одинаковый язык и вид в заказе (шаблон один на заказ).
const batches = [];
for (const lang of new Set(fresh.map((u) => u.lang))) {
  for (const kind of ["sent", "word"]) {
    let cur = [], len = 0;
    for (const u of fresh.filter((x) => x.lang === lang && x.kind === kind)) {
      const n = ttsInput(u.text).length;
      if (cur.length && (cur.length >= BATCH_ITEMS || len + n > BATCH_CHARS)) {
        batches.push({ lang, units: cur });
        cur = []; len = 0;
      }
      cur.push(u); len += n;
    }
    if (cur.length) batches.push({ lang, units: cur });
  }
}

// Сначала — оплаченные заказы, файлы которых ещё не на диске.
const resume = log.filter((r) => r.units.some((u) => !fs.existsSync(outFile(r.voice, u.lang, u.kind, u.key))));
if (resume.length) console.log(`дособираю ${resume.length} прежних заказов`);

const queue = [
  ...resume.map((r) => async () => collectOrder(r)),
  ...batches.map((b, i) => async () => {
    const template = VOICES[VOICE].templates[b.lang];
    if (!template) throw new Error(`нет шаблона ${VOICE}/${b.lang}`);
    const input = b.units.map((u) => ttsInput(u.text)).join("\n\n");
    const { data } = await call("POST", "/orders", {
      template_id: template,
      input_text: input,
      name: `${SLUG} ${b.units[0].kind} ${i + 1}/${batches.length}`,
      config_override: { generation_mode: "paragraph" },
    });
    const rec = { slug: SLUG, voice: VOICE, order: data.id, created: new Date().toISOString(), units: b.units };
    appendLog(rec);
    console.log(`→ заказ ${data.id}: ${b.units.length} ${b.units[0].kind === "word" ? "слов" : "фраз"}, ${input.length} символов`);
    return collectOrder(rec);
  }),
];

let done = 0, bad = 0, failed = 0;
await Promise.all(
  Array.from({ length: LANES }, async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        const r = await job();
        done += r.ok; bad += r.bad;
      } catch (e) {
        failed++;
        console.log(`  ✗ ${e.message}`);
      }
    }
  }),
);
console.log(`готово: ${done} файлов, без звука ${bad}, упавших заказов ${failed}`);
if (failed || bad) process.exitCode = 1;
