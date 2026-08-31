// Озвучка сказок голосами ElevenLabs через Voicer API (voicer.mat3u.com).
// Одна часть — один MP3 в public/skazki/<slug>/audio/pNN.mp3.
//
// Отличие от озвучки читалки (generate-audio-voicer.mjs --reading) не
// косметическое. Там каждое предложение — отдельный файл с именем-хэшем, чтобы
// читатель тапал по слову и слышал его. Здесь наоборот: сказку слушают
// целиком, лёжа в кровати, и нужен один непрерывный трек на часть.
//
// Команды:
//   node scripts/generate-audio-skazki.mjs --dry            объём и остаток квоты
//   node scripts/generate-audio-skazki.mjs sample           пробы голосов-кандидатов
//   node scripts/generate-audio-skazki.mjs --parts=1,2      озвучить части
//
// Флаги:
//   --slug=<slug>     книга (по умолчанию ezhinka-ulya)
//   --parts=1,2       какие части (по умолчанию все)
//   --voice=<id>      голос (по умолчанию VOICE ниже)
//   --voices=a,b,c    кандидаты для sample
//   --force           перезаписать готовые MP3 (нужно при смене голоса)
//
// Идемпотентен: готовый файл на диске пропускается, прогон догоняется
// перезапуском. Квота списывается в момент создания задачи, а не по факту
// озвучки, поэтому id каждой задачи сразу пишется в data/audio-tasks.jsonl —
// по нему архив можно докачать, не тратя символы заново.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnv() {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv();

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const flag = (n, d = "") => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};

const API_KEY = process.env.VOICER_API_KEY;
const API = (process.env.VOICER_BASE_URL ?? "https://voicer.mat3u.com").replace(/\/+$/, "");
const SLUG = flag("slug", "ezhinka-ulya");
const MODEL = flag("model", "eleven_multilingual_v2");

// Каталог женских голосов-кандидатов. Voicer не отдаёт список голосов — id
// уходит в ElevenLabs как есть, поэтому имена держим здесь: без них
// возвращаться к удачному варианту приходится по двадцатизначной строке.
//
// Поле `проверен` — это не про качество, а про то, отвечает ли голос на нашем
// аккаунте. У Voicer голоса пропадают: 24 августа 2026 прежний id-голос
// перестал существовать («клон не готов в БД»), и задачи с ним падали целиком.
// Все одиннадцать проверены пробами 31 августа 2026 — но проверка не вечная,
// так что новый голос сначала слушать пробой, а не гнать на нём всю книгу.
const VOICES = {
  sarah:     { id: "EXAVITQu4vr4xnSDxMaL", проверен: true,  про: "мягкий, ровный; первый кандидат, не выбран" },
  rachel:    { id: "21m00Tcm4TlvDq8ikWAM", проверен: true,  про: "спокойный, повествовательный; читает книги в читалке" },
  project:   { id: "D5RRIJYa9pFwxiSpbGbR", проверен: true,  про: "текущий русский голос проекта (словарь)" },
  ab9:       { id: "AB9XsbSA4eLG12t2myjN", проверен: true,  про: "рабочий на нашем аккаунте, тембр не слушали" },
  matilda:   { id: "XrExE9yKIg1WjnnlVkGX", проверен: true , про: "тёплый, для длинного чтения" },
  dorothy:   { id: "ThT5KcBeYPX3keUQqHPh", проверен: true , про: "британский, приятный; в библиотеке помечен как детский" },
  lily:      { id: "pFZP5JQG7iQjIQuC4Bku", проверен: true , про: "британский, негромкий" },
  emily:     { id: "LcfcDJNUP1GQjkzn1xUU", проверен: true , про: "очень спокойный, медитативный" },
  grace:     { id: "oWAxZDx7w5VEj9dCyTzz", проверен: true , про: "нежный, с придыханием" },
  charlotte: { id: "XB0fDUnXU5powFXDhCwa", проверен: true , про: "низкий, бархатный" },
  alice:     { id: "Xb7hH8MSUJpSbSDYk0k2", проверен: true , про: "британский, чётче остальных" },
};

// Пресеты подачи. Название нужно ровно для того, чтобы вернуться к удачному
// варианту: «мягкий» — это тот, что слушали в пробе 31 августа 2026.
const PRESETS = {
  plain:   { speed: 0.85, stability: 0.75, про: "обычное чтение вслух" },
  soft:    { speed: 0.8,  stability: 0.9,  про: "мягкий: медленнее и ровнее, без актёрских перепадов" },
  lullaby: { speed: 0.75, stability: 0.95, про: "колыбельный: почти шёпотный темп, под засыпание" },
};

const PRESET = flag("preset", "soft");
if (!PRESETS[PRESET]) {
  console.error(`нет пресета «${PRESET}»; есть: ${Object.keys(PRESETS).join(", ")}`);
  process.exit(1);
}

// Голос можно задать коротким именем из каталога или сырым id.
function resolveVoice(name) {
  return VOICES[name]?.id ?? name;
}
const VOICE_NAME = flag("voice", "ab9");
const VOICE = resolveVoice(VOICE_NAME);

// stability выше, чем у читалки: сказку читают ровно, без актёрских перепадов.
// speed 0.85 — заметно медленнее обычного: четырёхлетка должна успевать за
// картинкой в голове, и это же делает голос убаюкивающим.
// Флагами --speed и --stability их можно крутить, не трогая код: подбор
// «убаюкивающести» — это несколько проб подряд, а не одно верное число.
const VOICE_SETTINGS = {
  stability: Number(flag("stability", String(PRESETS[PRESET].stability))),
  similarity_boost: 0.8,
  style: 0,
  use_speaker_boost: true,
  speed: Number(flag("speed", String(PRESETS[PRESET].speed))),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const authHeaders = () => ({ Authorization: `Bearer ${API_KEY}` });

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

// Брошенную задачу обязательно отменять. Списка задач у API нет, слотов всего
// пять, и один зависший прогон блокирует всё последующее до истечения суток.
async function cancelTask(taskId) {
  try {
    await api(`/api/v1/voice/cancel/${taskId}`, { method: "POST" });
    return true;
  } catch {
    return false;
  }
}

const TASK_LOG = path.join(ROOT, "data", "audio-tasks.jsonl");
function logTask(taskId, what, extra = {}) {
  try {
    fs.appendFileSync(
      TASK_LOG,
      JSON.stringify({ taskId, skazki: what, preset: PRESET, ...extra }) + "\n",
    );
  } catch {}
}

async function createTask(text, voiceId) {
  const res = await api("/api/v1/voice/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      model_id: MODEL,
      language_code: "ru",
      voice_settings: VOICE_SETTINGS,
      // Абзацы уходят отдельными чанками и склеиваются обратно: так у Voicer
      // ровнее идёт прогресс, а между абзацами появляется естественная пауза.
      split_type: "paragraphs",
      split_output: true,
      auto_pause_enabled: false,
    }),
  });
  return res.json();
}

// Voicer держит задачу на 0% по многу минут и всё равно доезжает, поэтому
// таймауты щедрые. Занижать их дорого вдвойне: символы уже списаны, а
// брошенная задача ещё и держит слот из пяти параллельных.
const STALL_MS = Number(flag("stall-min", "15")) * 60_000;
const TASK_MS = Number(flag("task-min", "45")) * 60_000;

async function waitTask(taskId, onProgress) {
  const started = Date.now();
  let lastMove = Date.now();
  let last = -1;
  for (;;) {
    const st = await api(`/api/v1/voice/status/${taskId}`).then((r) => r.json());
    onProgress?.(st);
    if (["completed", "failed", "censored"].includes(st.status)) return st;

    // Признак движения — сделанные чанки, а не округлённый процент. На части
    // в 260 чанков один чанк это 0.4%, поэтому по процентам задача выглядит
    // «стоящей» по многу минут, хотя работает. Из-за этого прогон бросал
    // задачи, дошедшие до 98%, и символы уходили впустую.
    const moved = st.chunks_completed ?? Math.round(st.progress ?? 0);
    if (moved !== last) { last = moved; lastMove = Date.now(); }

    // В статусе pending задача ещё не начата — стоять на месте для неё
    // нормально, её ограничивает только общий таймаут.
    const stalled = st.status !== "pending" && Date.now() - lastMove > STALL_MS;
    if (stalled) {
      throw new Error(`задача ${taskId} не двигается дольше ${STALL_MS / 60_000} мин `
        + `(${st.chunks_completed}/${st.chunks_total} чанков)`);
    }
    if (Date.now() - started > TASK_MS) {
      throw new Error(`задача ${taskId} не закончилась за ${TASK_MS / 60_000} мин `
        + `(${st.chunks_completed}/${st.chunks_total} чанков)`);
    }
    await sleep(5000);
  }
}

// Voicer отдаёт ZIP с MP3 по чанкам. Склеиваем ffmpeg в один трек: слушать
// сказку — это один play, а не двадцать файлов подряд.
async function downloadAndJoin(taskId, dest) {
  const res = await api(`/api/v1/voice/download/${taskId}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dir = path.join(ROOT, ".audio-tmp", taskId);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  // ID3-тег или кадр MPEG в начале — значит пришёл готовый MP3, не архив.
  const isMp3 = buf.slice(0, 3).toString() === "ID3" || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (isMp3) {
    fs.writeFileSync(dest, buf);
  } else {
    const zip = path.join(dir, "chunks.zip");
    fs.writeFileSync(zip, buf);
    execFileSync("unzip", ["-qq", zip, "-d", dir]);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mp3")).sort();
    if (!files.length) throw new Error(`в архиве ${taskId} нет MP3`);
    const list = path.join(dir, "list.txt");
    fs.writeFileSync(list, files.map((f) => `file '${path.join(dir, f)}'`).join("\n"));
    execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", dest],
      { stdio: "pipe" });
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return dest;
}

function loadBook() {
  const file = path.join(ROOT, "data", "skazki", `${SLUG}.json`);
  if (!fs.existsSync(file)) {
    console.error(`нет книги ${file} — сначала npm run skazki:build`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// Текст части для озвучки: только проза, плюс мораль и прощание в конце —
// ровно то, что взрослый читает вслух. Крючок в следующую часть тоже входит:
// без него запись обрывается на полуслове.
function partText(part) {
  const body = part.blocks.filter((b) => b.type === "text").map((b) => b.text.trim());
  return [...body, part.moral, part.cliffhanger, "Спокойной ночи, Уля.\nСпокойной ночи и тебе."]
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n");
}

const audioPath = (num) =>
  path.join(ROOT, "public", "skazki", SLUG, "audio", `p${String(num).padStart(2, "0")}.mp3`);

async function cmdSample() {
  const book = loadBook();
  // Длина пробы — деньги: каждый символ списывается с квоты, а сравнивать
  // тембры можно и по двум фразам. --chars=50 хватает, чтобы услышать голос,
  // и в двадцать раз дешевле, чем слушать полстраницы.
  const limit = Number(flag("chars", "0"));
  let excerpt = partText(book.parts[0]).split("\n\n").slice(0, 6).join("\n\n");
  if (limit > 0) {
    // Режем по границе предложения, а не посреди слова: оборванная фраза
    // звучит как брак голоса, хотя виноват нож.
    const cut = excerpt.slice(0, limit);
    const end = Math.max(cut.lastIndexOf("!"), cut.lastIndexOf("."), cut.lastIndexOf("?"));
    excerpt = (end > 10 ? cut.slice(0, end + 1) : cut).trim();
  }
  const voices = flag("voices", [
    "EXAVITQu4vr4xnSDxMaL", // Sarah — мягкий
    "21m00Tcm4TlvDq8ikWAM", // Rachel — спокойный, читает книгу в читалке
    "D5RRIJYa9pFwxiSpbGbR", // текущий русский голос проекта
    "XrExE9yKIg1WjnnlVkGX", // Matilda — тёплый
  ].join(",")).split(",").filter(Boolean).map(resolveVoice);

  const dir = path.join(ROOT, "public", "skazki", SLUG, "audio", "_samples");
  fs.mkdirSync(dir, { recursive: true });
  console.log(`проба: ${excerpt.length} символов × ${voices.length} голосов\n`);

  for (const v of voices) {
    // Имя пробы — «голос-пресет», а не id с числами: к удачному варианту
    // возвращаются по названию, а двадцатизначную строку никто не помнит.
    const short = Object.entries(VOICES).find(([, x]) => x.id === v)?.[0] ?? v;
    const dest = path.join(dir, `${short}-${PRESET}.mp3`);
    if (fs.existsSync(dest) && !has("force")) { console.log(`  ${v}: уже есть`); continue; }
    let lastTaskId = null;
    try {
      const task = await createTask(excerpt, v);
      const id = task.task_id ?? task.id;
      lastTaskId = id;
      logTask(id, `sample ${short}`, { voice: v, dest: path.relative(ROOT, dest) });
      await waitTask(id);
      await downloadAndJoin(id, dest);
      console.log(`  ${v}: готово → ${path.relative(ROOT, dest)}`);
    } catch (e) {
      console.log(`  ${short}: не вышло — ${e.message}`);
      if (lastTaskId) {
        const ok = await cancelTask(lastTaskId);
        console.log(`      задача ${lastTaskId.slice(0, 8)} ${ok ? "отменена" : "не отменилась"}`);
      }
    }
  }
}

async function cmdGenerate() {
  const book = loadBook();
  const want = flag("parts", "")
    ? new Set(flag("parts", "").split(",").map(Number))
    : null;
  const parts = book.parts.filter((p) => !want || want.has(p.num));

  const todo = parts.filter((p) => has("force") || !fs.existsSync(audioPath(p.num)));
  const chars = todo.reduce((s, p) => s + partText(p).length, 0);
  const s = await stats().catch(() => null);

  console.log(`голос ${VOICE}, модель ${MODEL}, скорость ${VOICE_SETTINGS.speed}`);
  console.log(`частей к озвучке: ${todo.length} из ${parts.length}, ${chars} символов`);
  if (s) console.log(`квота: осталось ${s.remaining_characters}, активных задач ${s.active_tasks}`);
  if (s && chars > s.remaining_characters) {
    console.error(`\nне хватит квоты: нужно ${chars}, осталось ${s.remaining_characters}`);
    process.exit(1);
  }
  if (has("dry")) return;
  if (!todo.length) { console.log("всё уже озвучено"); return; }

  for (const p of todo) {
    const dest = audioPath(p.num);
    const text = partText(p);
    process.stdout.write(`  часть ${p.num} «${p.title}» (${text.length} симв.): `);
    try {
      const task = await createTask(text, VOICE);
      const id = task.task_id ?? task.id;
      logTask(id, `${SLUG} p${p.num}`, { voice: VOICE, dest: path.relative(ROOT, dest) });
      let shown = -1;
      await waitTask(id, (st) => {
        const pc = Math.round(st.progress ?? 0);
        if (pc !== shown && pc % 20 === 0) { process.stdout.write(`${pc}% `); shown = pc; }
      });
      await downloadAndJoin(id, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`готово, ${kb} КБ → ${path.relative(ROOT, dest)}`);
    } catch (e) {
      console.log(`ОШИБКА — ${e.message}`);
      console.log(`      символы уже списаны; забрать результат: `
        + `node scripts/generate-audio-skazki.mjs download`);
    }
  }
}

if (!API_KEY) {
  console.error("Нет VOICER_API_KEY в .env.local");
  process.exit(1);
}
function cmdVoices() {
  console.log("Голоса (Voicer не отдаёт список — каталог держим у себя):\n");
  const w = Math.max(...Object.keys(VOICES).map((k) => k.length));
  for (const [name, v] of Object.entries(VOICES)) {
    const mark = v.проверен ? "✓" : " ";
    console.log(`  ${mark} ${name.padEnd(w)}  ${v.id}  ${v.про}`);
  }
  console.log("\n  ✓ — голос отвечает на нашем аккаунте. Остальные сначала слушать пробой:");
  console.log("      npm run skazki:audio:sample -- --voices=<id> --preset=soft\n");
  console.log("Пресеты подачи:\n");
  const pw = Math.max(...Object.keys(PRESETS).map((k) => k.length));
  for (const [name, s] of Object.entries(PRESETS)) {
    console.log(`    ${name.padEnd(pw)}  скорость ${s.speed}, стабильность ${s.stability}  — ${s.про}`);
  }
  console.log("\nОтобранный вариант (31.08.2026) — он же по умолчанию:");
  console.log("    npm run skazki:audio -- --voice=ab9 --preset=soft --parts=1,2");
}

// Символы списываются при создании задачи. Если прогон прервался, платить
// второй раз незачем — результат забирается по id из журнала.
async function cmdDownload() {
  const ids = argv.slice(1).filter((a) => !a.startsWith("--"));
  const journal = fs.existsSync(TASK_LOG)
    ? fs.readFileSync(TASK_LOG, "utf8").trim().split("\n").map((l) => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean)
    : [];
  const wanted = ids.length
    ? journal.filter((e) => ids.includes(e.taskId))
    : journal.filter((e) => e.dest && !fs.existsSync(path.join(ROOT, e.dest)));

  if (!wanted.length) { console.log("нечего забирать"); return; }
  console.log(`забираю ${wanted.length} задач(и)\n`);
  for (const e of wanted) {
    const dest = path.join(ROOT, e.dest ?? `recovered-${e.taskId}.mp3`);
    process.stdout.write(`  ${e.skazki ?? e.taskId}: `);
    try {
      const st = await api(`/api/v1/voice/status/${e.taskId}`).then((r) => r.json());
      if (st.status !== "completed") {
        process.stdout.write(`${st.status} ${Math.round(st.progress ?? 0)}%, жду... `);
        await waitTask(e.taskId);
      }
      await downloadAndJoin(e.taskId, dest);
      console.log(`готово → ${path.relative(ROOT, dest)}`);
    } catch (err) {
      console.log(`не вышло — ${err.message}`);
    }
  }
}

if (argv[0] === "download") await cmdDownload();
else if (argv[0] === "voices") cmdVoices();
else await (argv[0] === "sample" ? cmdSample() : cmdGenerate());
