// Переводит книгу для читалки: предложения целиком и каждую словоформу.
// Переводчик — сам Claude Code в headless-режиме (`claude -p`), то есть
// работает по подписке и не требует никакого API-ключа.
//
//   node scripts/translate-reading.mjs [slug] [флаги]
//
// Пишет два файла рядом с книгой:
//   <slug>.translations.json  — { "предложение на индонезийском": "перевод" }
//   <slug>.glossary.json      — { "словоформа": { ru, lemma? } }
//
// Ключ перевода — сам текст предложения, а не индекс. Поэтому скрипт
// идемпотентен: его можно прерывать и запускать снова, уже переведённое
// пропускается, а перепарсивание книги не обесценивает работу.
//
// Промпт зависит от книги: индонезийский разговорный роман и английский
// бизнес-ридер требуют разного тона и разных правил с терминами — см. PROMPTS.
//
// Флаги:
//   --only=sentences|words   переводить только одно из двух
//   --batch=N                предложений в задаче (по умолчанию 40)
//   --words-batch=N          словоформ в задаче (по умолчанию 80)
//   --jobs=N                 сколько задач параллельно (по умолчанию 4)
//   --limit=N                взять не больше N непереведённых (для пробы)
//   --model=<id>             модель для claude -p (по умолчанию sonnet)
//   --retry=N                попыток на задачу (по умолчанию 2)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "data", "reading");

const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith("-")) ?? "kabut-di-lembang";
const flag = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const ONLY = flag("only", null);
const BATCH = Number(flag("batch", "40"));
const WORDS_BATCH = Number(flag("words-batch", "80"));
const JOBS = Number(flag("jobs", "4"));
const LIMIT = Number(flag("limit", "0"));
const MODEL = flag("model", "sonnet");
const RETRY = Number(flag("retry", "2"));

const bookFile = path.join(DIR, `${slug}.json`);
const wordsFile = path.join(DIR, `${slug}.words.json`);
if (!fs.existsSync(bookFile)) {
  console.error(`Нет ${path.relative(ROOT, bookFile)} — сначала node scripts/build-reading.mjs`);
  process.exit(1);
}
const book = JSON.parse(fs.readFileSync(bookFile, "utf8"));
const wordList = JSON.parse(fs.readFileSync(wordsFile, "utf8"));

// Язык книги кладёт build-reading.mjs; у старых JSON поля нет — индонезийский.
const LANG = book.lang ?? "id";

const trFile = path.join(DIR, `${slug}.translations.json`);
const glFile = path.join(DIR, `${slug}.glossary.json`);
const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {});
const translations = readJson(trFile);
const glossary = readJson(glFile);

// Пишем на диск после каждой задачи: прерывание не теряет работу.
// Через временный файл — иначе Ctrl-C посреди записи оставит битый JSON.
function save(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1));
  fs.renameSync(tmp, file);
}

// ------------------------------------------------------------- claude -p

function claude(prompt, input) {
  return new Promise((resolve, reject) => {
    const proc = spawn("claude", ["-p", "--model", MODEL, prompt], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d));
    proc.stderr.on("data", (d) => (err += d));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`claude exit ${code}: ${err.slice(0, 300)}`));
      resolve(out);
    });
    proc.stdin.end(input);
  });
}

// Модель иногда оборачивает ответ в ```json — вытаскиваем массив как есть.
function parseArray(raw) {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error(`не JSON: ${text.slice(0, 200)}`);
  return JSON.parse(text.slice(start, end + 1));
}

// Пул воркеров: claude -p держит ответ десятки секунд, последовательный
// проход по сотне задач — это часы.
async function runPool(tasks, worker) {
  let next = 0;
  let done = 0;
  const render = () =>
    process.stdout.write(`\r  ${done}/${tasks.length} задач${" ".repeat(10)}`);
  render();
  await Promise.all(
    Array.from({ length: Math.min(JOBS, tasks.length) }, async () => {
      while (next < tasks.length) {
        const task = tasks[next++];
        try {
          await worker(task);
        } catch (e) {
          process.stdout.write(`\n  ✗ ${String(e.message).slice(0, 160)}\n`);
        }
        done++;
        render();
      }
    }),
  );
  console.log();
}

// ------------------------------------------------------------ предложения

// Промпт-исключение: «The Marauders» — не деловой ридер, а фанфик-роман,
// у него свой тон и словарь мира Гарри Поттера. Выбирается по слагу в PROMPTS.
const MARAUDERS_SENT_PROMPT = `Ты переводишь на русский язык роман, написанный простым английским (уровень A2) для изучающих язык.

На вход придёт JSON-массив: [{"i": число, "t": "предложение"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод"}] — по одному объекту на каждый вход, в том же порядке. Ничего кроме JSON.

Правила перевода:
- Это художественная проза: рассказчик — Римус Люпин, вспоминает юность и погибших друзей. Тон сдержанный, тёплый, без пафоса. Переводи живым, естественным русским.
- Предложения в оригинале короткие — сохраняй эту простоту, не украшай и не усложняй.
- Имена передавай устоявшейся русской транслитерацией мира Гарри Поттера: James → Джеймс, Sirius → Сириус, Remus → Римус, Peter → Питер, Lily → Лили, Snape → Снейп, Dumbledore → Дамблдор, Voldemort → Волдеморт, Hogwarts → Хогвартс, Gryffindor → Гриффиндор, Slytherin → Слизерин, McGonagall → Макгонагалл, Hagrid → Хагрид, Godric's Hollow → Годрикова Впадина, Marauders → Мародёры, Wormtail → Хвост, Padfoot → Бродяга, Prongs → Сохатый, Moony → Лунатик, Death Eaters → Пожиратели смерти, Order of the Phoenix → Орден Феникса, Azkaban → Азкабан, Muggle → магл.
- Одно входное предложение — ровно одно выходное. Не объединяй и не дроби.
- Не добавляй пояснений, сносок и кавычек-ёлочек вокруг всего перевода.`;

// «The Greater Good» — исповедь Дамблдора от первого лица, B1–B2;
// свой тон (сдержанный, самоироничный старик) и свой именник эпохи Гриндевальда.
const GREATER_GOOD_SENT_PROMPT = `Ты переводишь на русский язык роман, написанный простым английским (уровень B1–B2) для изучающих язык.

На вход придёт JSON-массив: [{"i": число, "t": "предложение"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод"}] — по одному объекту на каждый вход, в том же порядке. Ничего кроме JSON.

Правила перевода:
- Это художественная проза: рассказчик — старый Альбус Дамблдор, в последний год жизни пишет исповедь о юности, Геллерте Гриндевальде и погибшей сестре. Тон сдержанный, точный, с тихой самоиронией, без пафоса и без жалости к себе. Переводи живым, естественным русским.
- Предложения в оригинале простые — сохраняй эту простоту, не украшай и не усложняй. Короткие рубленые фразы («She was fourteen. She was dead.») оставляй такими же короткими.
- Имена и реалии передавай устоявшейся русской традицией мира Гарри Поттера: Albus → Альбус, Dumbledore → Дамблдор, Gellert → Геллерт, Grindelwald → Гриндевальд, Ariana → Ариана, Aberforth → Аберфорт, Kendra → Кендра, Percival → Персиваль, Bathilda Bagshot → Батильда Бэгшот, Elphias Doge → Элфиас Дож, Godric's Hollow → Годрикова Впадина, Mould-on-the-Wold → Молд-он-те-Волд, Hogwarts → Хогвартс, Hogsmeade → Хогсмид, Hog's Head → «Кабанья голова», Azkaban → Азкабан, Nurmengard → Нурменгард, Durmstrang → Дурмстранг, Muggle → магл, Squib → сквиб, Ministry of Magic → Министерство магии, Wizengamot → Визенгамот, Statute of Secrecy → Статут о секретности, Deathly Hallows → Дары Смерти, Elder Wand → Бузинная палочка, Resurrection Stone → Воскрешающий камень, Invisibility Cloak → Мантия-невидимка, Peverell → Певерелл, Ignotus → Игнотус, Mirror of Erised → зеркало Еиналеж, Fawkes → Фоукс, Tom Riddle → Том Реддл, Voldemort → Волдеморт, Harry Potter → Гарри Поттер, Snape → Снейп, Gaunt → Мракс, Horcrux → крестраж, Cruciatus → Круциатус, Order of Merlin → орден Мерлина, for the greater good → ради общего блага.
- Одно входное предложение — ровно одно выходное. Не объединяй и не дроби.
- Не добавляй пояснений, сносок и кавычек-ёлочек вокруг всего перевода.`;

const GREATER_GOOD_WORD_PROMPT = `Ты составляешь словарь к английскому роману (простой английский, уровень B1–B2) для русскоязычного читателя.

На вход придёт JSON-массив: [{"i": число, "w": "словоформа", "ex": "предложение из книги с этим словом"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод", "lemma": "словарная форма"}] — по объекту на каждый вход. Ничего кроме JSON.

Правила:
- "ru" — короткий перевод именно этой словоформы в этом контексте: одно-три слова, без пояснений в скобках. Если у слова есть второе частое значение, дай его через запятую.
- Переводи форму, а не только корень: ran → «бежал», friends → «друзья», couldn't → «не мог».
- "lemma" — словарная (базовая) форма: ran → run, friends → friend, better → good, was/were → be, i'm → I am. Если форма и есть базовая, повтори её же.
- Имена людей (Albus, Gellert, Ariana, Aberforth, Kendra, Percival, Bathilda, Doge, Harry и т.п.): ru = «имя», lemma = сама форма. Топонимы: ru = «Хогвартс (школа)», «Нурменгард (тюрьма)» и т.п.
- Слова волшебного мира переводи по устоявшейся русской традиции Гарри Поттера: wand → «волшебная палочка», Muggle → «магл», Squib → «сквиб», spell → «заклинание», curse → «проклятие, заклятие», Hallows → «Дары (Смерти)», phoenix → «феникс».`;

const FOUNDERS_SENT_PROMPT = `Ты переводишь на русский язык роман «The Founders» — историю четырёх основателей Хогвартса, написанную простым английским (уровень B1) для изучающих язык.

На вход придёт JSON-массив: [{"i": число, "t": "предложение"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод"}] — по одному объекту на каждый вход, в том же порядке. Ничего кроме JSON.

Правила перевода:
- Это художественная проза: рассказчик — Распределяющая шляпа, мудрая и чуть ироничная, вспоминает основателей через тысячу лет. Тон тёплый, сдержанный, без пафоса. Переводи живым, естественным русским.
- Предложения в оригинале умеренно простые — сохраняй эту ясность, не украшай и не усложняй. Обращение «little reader» → «маленький читатель», «little friend» → «маленький друг».
- Имена и реалии передавай устоявшейся русской традицией мира Гарри Поттера (перевод Росмэн): Godric Gryffindor → Годрик Гриффиндор, Salazar Slytherin → Салазар Слизерин, Rowena Ravenclaw → Ровена Когтевран, Helga Hufflepuff → Хельга Пуффендуй, Hogwarts → Хогвартс, Muggle → магл, Muggle-born → маглорождённый, Sorting Hat → Распределяющая шляпа, Sorting → Распределение, Chamber of Secrets → Тайная комната, Forbidden Forest → Запретный лес, Parseltongue → змеиный язык, house-elf → домовой эльф, diadem → диадема, Grey Lady → Серая Дама, Bloody Baron → Кровавый Барон, Godric's Hollow → Годрикова Впадина, Hogsmeade → Хогсмид, Great Hall → Большой зал, basilisk → василиск, Ragnuk → Рагнук, Book of Admittance → Книга допуска. Названия домов: Gryffindor → Гриффиндор, Slytherin → Слизерин, Ravenclaw → Когтевран, Hufflepuff → Пуффендуй.
- Прочие имена транслитерируй: Mara → Мара, Edith → Эдит, Helena → Хелена, Maeve → Мейв, Brann → Бранн, Aldous → Олдос, Torvus → Торвус, Pim → Пим, the Baron → Барон.
- Одно входное предложение — ровно одно выходное. Не объединяй и не дроби.
- Не добавляй пояснений, сносок и кавычек-ёлочек вокруг всего перевода.`;

const ID_SENT_PROMPT = `Ты переводишь индонезийский детективный роман на русский язык.

На вход придёт JSON-массив: [{"i": число, "t": "предложение"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод"}] — по одному объекту на каждый вход, в том же порядке. Ничего кроме JSON.

Правила перевода:
- Это разговорный индонезийский (nggak, udah, gue, lo, banget, sih, dong, kok, deh). Переводи живым разговорным русским, а не книжным.
- Частицы sih/dong/kok/deh/nih/tuh/kan передавай русскими средствами (же, ну, а, -то, ведь), а не выбрасывай.
- Сохраняй тон повествования: рассказчица — пожилая учительница, говорит просто и сдержанно.
- Имена (Laras, Hendra, Sinta, Dimas, Ratna, Yuni, Asep, Bambang, Rio, Bayu, Ningsih) и топонимы (Lembang, Bandung, Jakarta, Ciumbuleuit) передавай транслитерацией.
- Обращения Bu / Pak / Mbak / Mas переводи как «госпожа/тётя Ларас», «господин/дядя Хендра» по контексту, либо оставляй «Бу Ларас», «Пак Хендра» — выбирай естественное.
- Одно входное предложение — ровно одно выходное. Не объединяй и не дроби.
- Не добавляй пояснений, сносок и кавычек-ёлочек вокруг всего перевода.`;

const EN_SENT_PROMPT = `Ты переводишь на русский язык учебную книгу «AI & Business English» — деловой английский для русскоязычных предпринимателей, уровень B1–B2.

На вход придёт JSON-массив: [{"i": число, "t": "предложение"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод"}] — по одному объекту на каждый вход, в том же порядке. Ничего кроме JSON.

Правила перевода:
- Регистр — деловой, но живой: так пишут в блогах стартапов и рассылках, а не в учебнике по экономике. «Ты», а не «вы»: книга обращается к одному читателю-основателю.
- Термины, которые в русской деловой речи давно не переводят, оставляй латиницей: product-market fit, MVP, churn, runway, MRR, ARR, CAC, LTV, pivot, roadmap, onboarding, pipeline, CRM, A/B-тест. Общеупотребимое переводи по-русски: revenue → выручка, profit → прибыль, margin → маржа, lead → лид, funnel → воронка.
- Если в предложении термин выделен как ключевой, перевод должен его сохранить, а не заменить синонимом: читатель сверяет текст с таблицей Key Vocabulary.
- Английские цитаты-поговорки («garbage in, garbage out», «ship it») переводи и оставляй оригинал в скобках, если без него теряется смысл фразы.
- Одно входное предложение — ровно одно выходное. Не объединяй и не дроби.
- Кавычки-ёлочки внутри перевода уместны, но не оборачивай ими весь перевод целиком.
- Не добавляй пояснений и сносок.`;

// Приложение книги — двухколоночный глоссарий автора (English | Русский).
// Отдаём его модели как справочник терминов: иначе churn в одной главе
// станет «оттоком», а в другой «текучестью». Таблицы из трёх колонок
// (разбор частиц в индонезийских книгах) не подходят и не берутся.
function appendixTerms(md) {
  const rows = (md ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && l.endsWith("|"))
    .map((l) => l.slice(1, -1).split("|").map((c) => c.trim()))
    .filter((cells) => cells.length === 2 && !/^-+$/.test(cells[0]));
  return rows.slice(1).filter(([a, b]) => a && b);
}

const TERMS = appendixTerms(book.appendix);
const TERMS_HINT = TERMS.length
  ? `\n\nСловарь терминов книги — переводи их именно так:\n${TERMS.map(([en, ru]) => `${en} — ${ru}`).join("\n")}`
  : "";

// Предложение, уже написанное по-русски: во вступительной главе английского
// ридера половина текста — обращение к читателю на русском. Переводить его
// некуда, а без перевода читалка просто не рисует у абзаца кнопку ⇄.
//
// Порог с запасом (втрое больше кириллицы, чем латиницы): смешанные фразы
// вроде «Rewrite in professional English: «просмотры стали…»» переводить надо —
// там английская половина и есть задание.
const isRussian = (s) => {
  const cyr = (s.match(/[А-Яа-яЁё]/g) ?? []).length;
  const lat = (s.match(/[A-Za-z]/g) ?? []).length;
  return cyr > lat * 3;
};

function collectSentences() {
  const seen = new Set();
  const out = [];

  // Название книги, подзаголовок и названия глав переводятся тем же
  // механизмом, что и проза: ключ — сам текст. Читалка потом показывает
  // перевод под оригиналом, поэтому оглавление читается с ходу.
  for (const heading of [
    book.title,
    book.subtitle,
    ...book.chapters.map((c) => c.title),
  ]) {
    if (!heading || seen.has(heading) || isRussian(heading)) continue;
    seen.add(heading);
    out.push({ t: heading, chapter: "названия глав" });
  }

  for (const ch of book.chapters) {
    for (const b of ch.blocks) {
      for (const s of b.sent ?? []) {
        if (seen.has(s.id) || isRussian(s.id)) continue;
        seen.add(s.id);
        out.push({ t: s.id, chapter: `${ch.num ? `${ch.num}. ` : ""}${ch.title}` });
      }
    }
  }
  return out;
}

async function translateSentences() {
  let pending = collectSentences().filter((s) => !translations[s.t]);
  if (LIMIT > 0) pending = pending.slice(0, LIMIT);
  console.log(`Предложения: ${pending.length} непереведённых`);
  if (!pending.length) return;

  // Батч не смешивает главы — так у модели есть связный контекст.
  const batches = [];
  for (let i = 0; i < pending.length; ) {
    const chapter = pending[i].chapter;
    const group = [];
    while (i < pending.length && pending[i].chapter === chapter && group.length < BATCH) {
      group.push(pending[i++]);
    }
    batches.push({ chapter, items: group });
  }
  console.log(`  ${batches.length} задач по ≤${BATCH}, параллельно ${JOBS}`);

  await runPool(batches, async ({ chapter, items }) => {
    const input = JSON.stringify(items.map((s, i) => ({ i, t: s.t })));
    const prompt =
      chapter === "названия глав"
        ? `${PROMPTS.sent}${TERMS_HINT}\n\nЭто НАЗВАНИЯ книги и её глав. Переводи их как заголовки: коротко, без точки в конце, сохраняя интригу оригинала.`
        : `${PROMPTS.sent}${TERMS_HINT}\n\nЭто подряд идущие предложения из главы «${chapter}».`;
    for (let attempt = 1; attempt <= RETRY; attempt++) {
      try {
        const rows = parseArray(await claude(prompt, input));
        let got = 0;
        for (const row of rows) {
          const src = items[row?.i];
          if (!src || typeof row.ru !== "string" || !row.ru.trim()) continue;
          translations[src.t] = row.ru.trim();
          got++;
        }
        if (got === 0) throw new Error("пустой ответ");
        save(trFile, translations);
        return;
      } catch (e) {
        if (attempt === RETRY) throw e;
      }
    }
  });
}

// ------------------------------------------------------------- словоформы

const MARAUDERS_WORD_PROMPT = `Ты составляешь словарь к английскому роману (простой английский, уровень A2) для русскоязычного читателя.

На вход придёт JSON-массив: [{"i": число, "w": "словоформа", "ex": "предложение из книги с этим словом"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод", "lemma": "словарная форма"}] — по объекту на каждый вход. Ничего кроме JSON.

Правила:
- "ru" — короткий перевод именно этой словоформы в этом контексте: одно-три слова, без пояснений в скобках. Если у слова есть второе частое значение, дай его через запятую.
- Переводи форму, а не только корень: ran → «бежал», friends → «друзья», couldn't → «не мог».
- "lemma" — словарная (базовая) форма: ran → run, friends → friend, better → good, was/were → be, i'm → I am. Если форма и есть базовая, повтори её же.
- Имена людей (James, Sirius, Remus, Peter, Lily, Snape, Dumbledore и т.п.): ru = «имя», lemma = сама форма. Топонимы: ru = «Хогвартс (школа)», «Лондон (город)» и т.п.
- Слова волшебного мира переводи по устоявшейся русской традиции Гарри Поттера: wand → «волшебная палочка», Muggle → «магл», werewolf → «оборотень», spell → «заклинание», Death Eater → «Пожиратель смерти».`;

const FOUNDERS_WORD_PROMPT = `Ты составляешь словарь к английскому роману об основателях Хогвартса (уровень B1) для русскоязычного читателя.

На вход придёт JSON-массив: [{"i": число, "w": "словоформа", "ex": "предложение из книги с этим словом"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод", "lemma": "словарная форма"}] — по объекту на каждый вход. Ничего кроме JSON.

Правила:
- "ru" — короткий перевод именно этой словоформы в этом контексте: одно-три слова, без пояснений в скобках. Если у слова есть второе частое значение, дай его через запятую.
- Переводи форму, а не только корень: ran → «бежал», friends → «друзья», couldn't → «не мог».
- "lemma" — словарная (базовая) форма: ran → run, friends → friend, better → good, was/were → be, i'm → I am. Если форма и есть базовая, повтори её же.
- Имена людей (Godric, Salazar, Rowena, Helga, Edith, Helena, Mara, Maeve, Brann, Aldous, Torvus, Pim, Ragnuk): ru = «имя», lemma = сама форма. Топонимы: ru = «Хогвартс (школа)», «Хогсмид (деревня)» и т.п.
- Слова волшебного мира переводи по русской традиции Гарри Поттера (Росмэн): wand → «волшебная палочка», Muggle → «магл», spell → «заклинание», Sorting → «Распределение», house-elf → «домовой эльф», goblin → «гоблин», centaur → «кентавр», basilisk → «василиск», diadem → «диадема», ghost → «привидение». Названия домов: Gryffindor → «Гриффиндор», Slytherin → «Слизерин», Ravenclaw → «Когтевран», Hufflepuff → «Пуффендуй».`;

const ID_WORD_PROMPT = `Ты составляешь словарь к индонезийскому роману для русскоязычного читателя.

На вход придёт JSON-массив: [{"i": число, "w": "словоформа", "ex": "предложение из книги с этим словом"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод", "lemma": "словарная форма"}] — по объекту на каждый вход. Ничего кроме JSON.

Правила:
- "ru" — короткий перевод именно этой словоформы в этом контексте: одно-три слова, без пояснений в скобках. Если у слова есть второе частое значение, дай его через запятую.
- Переводи форму, а не только корень: rumahnya → «его дом», dibakar → «сожжён», ngeliatin → «разглядывать».
- "lemma" — словарная (базовая) форма: rumahnya → rumah, dibakar → bakar, ngeliatin → lihat. Если форма и есть базовая, повтори её же.
- Разговорные формы: nggak → «не, нет», udah → «уже», banget → «очень», gue → «я», lo → «ты».
- Частицы (sih, dong, kok, deh, nih, tuh, kan, lah, aja, ya) объясняй функцией: «же (смягчает вопрос)», «ну же (просьба)», «-то, а (удивление)».
- Сунданские слова (punten, mangga, atuh, teh, mah, euy, pisan, kumaha) помечай так: «извините (сунд.)».
- Имена людей: ru = «имя», lemma = сама форма. Топонимы: ru = «Лембанг (город)» и т.п.
- Английские вкрапления (WhatsApp, meeting) переводи как есть.`;

const EN_WORD_PROMPT = `Ты составляешь словарь к книге на деловом английском для русскоязычного предпринимателя уровня B1–B2.

На вход придёт JSON-массив: [{"i": число, "w": "словоформа", "ex": "предложение из книги с этим словом"}].
Верни СТРОГО JSON-массив [{"i": число, "ru": "перевод", "lemma": "словарная форма"}] — по объекту на каждый вход. Ничего кроме JSON.

Правила:
- "ru" — короткий перевод именно этой словоформы в этом контексте: одно-три слова, без пояснений в скобках. Если у слова есть второе частое значение, дай его через запятую.
- Переводи форму, а не только корень: hallucinates → «выдумывает», shipped → «выпустил», onboarding → «онбординг, ввод в работу», metrics → «метрики».
- "lemma" — словарная форма: hallucinates → hallucinate, shipped → ship, metrics → metric, better → good. Если форма и есть словарная, повтори её же.
- Деловые термины давай так, как их правда говорят по-русски: churn → «отток», runway → «запас денег, runway», lead → «лид», margin → «маржа», moat → «защитное преимущество».
- Служебные слова (the, of, that, will, would) объясняй функцией коротко: «определённый артикль», «бы (сослагательное)».
- Аббревиатуры (LLM, MVP, CAC, KPI) расшифровывай по-русски одним-двумя словами.
- Имена собственные и названия компаний: ru = само название, lemma = сама форма.`;

// Промпт зависит от языка книги: тон, термины и правила разные.
// «The Marauders» — вторая английская книга, но роман, а не деловой ридер:
// у него собственная пара промптов, выбираемая по слагу.
const PROMPTS =
  LANG === "en"
    ? slug === "the-marauders"
      ? { sent: MARAUDERS_SENT_PROMPT, words: MARAUDERS_WORD_PROMPT }
      : slug === "the-greater-good"
        ? { sent: GREATER_GOOD_SENT_PROMPT, words: GREATER_GOOD_WORD_PROMPT }
        : slug === "hogwarts-founders"
          ? { sent: FOUNDERS_SENT_PROMPT, words: FOUNDERS_WORD_PROMPT }
          : { sent: EN_SENT_PROMPT, words: EN_WORD_PROMPT }
    : { sent: ID_SENT_PROMPT, words: ID_WORD_PROMPT };

function wordExamples() {
  // Для каждой формы — самое короткое предложение книги, где она есть:
  // короткое даёт модели контекст, не съедая контекстное окно.
  const best = new Map();
  for (const ch of book.chapters) {
    for (const b of ch.blocks) {
      for (const s of b.sent ?? []) {
        for (const seg of s.seg) {
          for (const tk of seg.tk) {
            if (!tk.w) continue;
            const key = tk.w.toLowerCase();
            const cur = best.get(key);
            if (!cur || s.id.length < cur.length) best.set(key, s.id);
          }
        }
      }
    }
  }
  return best;
}

async function translateWords() {
  const examples = wordExamples();
  let pending = wordList.map((x) => x.w).filter((w) => !glossary[w]);
  if (LIMIT > 0) pending = pending.slice(0, LIMIT);
  console.log(`Словоформы: ${pending.length} непереведённых`);
  if (!pending.length) return;

  const batches = [];
  for (let i = 0; i < pending.length; i += WORDS_BATCH) {
    batches.push(pending.slice(i, i + WORDS_BATCH));
  }
  console.log(`  ${batches.length} задач по ≤${WORDS_BATCH}, параллельно ${JOBS}`);

  await runPool(batches, async (batch) => {
    const input = JSON.stringify(
      batch.map((w, i) => ({ i, w, ex: examples.get(w) ?? "" })),
    );
    for (let attempt = 1; attempt <= RETRY; attempt++) {
      try {
        const rows = parseArray(await claude(`${PROMPTS.words}${TERMS_HINT}`, input));
        let got = 0;
        for (const row of rows) {
          const w = batch[row?.i];
          if (!w || typeof row.ru !== "string" || !row.ru.trim()) continue;
          const lemma = typeof row.lemma === "string" ? row.lemma.trim().toLowerCase() : "";
          glossary[w] = lemma && lemma !== w ? { ru: row.ru.trim(), lemma } : { ru: row.ru.trim() };
          got++;
        }
        if (got === 0) throw new Error("пустой ответ");
        save(glFile, glossary);
        return;
      } catch (e) {
        if (attempt === RETRY) throw e;
      }
    }
  });
}

// ------------------------------------------------------------------- запуск

const t0 = Date.now();
if (ONLY !== "words") await translateSentences();
if (ONLY !== "sentences") await translateWords();

const totalSent = new Set(collectSentences().map((s) => s.t)).size;
console.log(
  `\nГотово за ${Math.round((Date.now() - t0) / 1000)} c` +
    `\n  предложений переведено: ${Object.keys(translations).length} из ${totalSent}` +
    `\n  словоформ в глоссарии: ${Object.keys(glossary).length} из ${wordList.length}`,
);
