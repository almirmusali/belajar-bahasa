// Проверка лексического уровня английской книги.
//
//   node scripts/check-level.mjs <slug> [--rare N]
//
// Считает по собранному <slug>.json две вещи.
//
// 1. Сколько РАЗНЫХ слов надо знать, чтобы прочитать книгу: словоформы
//    сводятся к леммам (включая неправильные: was→be, children→child,
//    knelt→kneel), дефисные сложения разбираются на части, а имена
//    собственные выносятся отдельно — их учить не нужно, они узнаются.
//    Это и есть число, которое сравнивают с «1000–2000 слов» уровня A2.
//
// 2. Какие редкие слова НЕ объяснены во врезке «New Words». Редкое слово в
//    книге допустимо, если глава его объясняет; необъяснённое редкое слово —
//    это дырка в уровне, её надо либо закрыть врезкой, либо переписать фразу.
//
// Скрипт ничего не чинит, только показывает. Правки — руками в .scratch/<книга>/.

import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2] ?? "the-marauders";
const rareIdx = process.argv.indexOf("--rare");
const rareAt = rareIdx > 0 ? Number(process.argv[rareIdx + 1]) : 2;
const book = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "reading", `${slug}.json`), "utf8"),
);

// Неправильные формы: стеммер по окончаниям их не сводит, а без них
// «слов надо знать» завышается на пару сотен.
const IRREG = {
  was: "be", were: "be", is: "be", are: "be", am: "be", been: "be", being: "be",
  had: "have", has: "have", having: "have", said: "say", went: "go", gone: "go", goes: "go",
  came: "come", took: "take", taken: "take", got: "get", knew: "know", known: "know",
  thought: "think", saw: "see", seen: "see", made: "make", told: "tell", found: "find",
  gave: "give", given: "give", felt: "feel", left: "leave", kept: "keep", stood: "stand",
  held: "hold", heard: "hear", meant: "mean", ran: "run", sat: "sit", did: "do",
  does: "do", done: "do", became: "become", brought: "bring", bought: "buy", caught: "catch",
  children: "child", men: "man", women: "woman", feet: "foot", teeth: "tooth", mice: "mouse",
  lay: "lie", lain: "lie", wrote: "write", written: "write", spoke: "speak", spoken: "speak",
  broke: "break", broken: "break", chose: "choose", chosen: "choose", fell: "fall", fallen: "fall",
  flew: "fly", flown: "fly", grew: "grow", grown: "grow", threw: "throw", thrown: "throw",
  swam: "swim", sang: "sing", rang: "ring", drank: "drink", drunk: "drink", slept: "sleep",
  wept: "weep", knelt: "kneel", tore: "tear", torn: "tear", wore: "wear", worn: "wear",
  led: "lead", bled: "bleed", fed: "feed", lost: "lose", won: "win", sent: "send",
  spent: "spend", built: "build", burnt: "burn", learnt: "learn", paid: "pay",
  laid: "lay", sold: "sell", stole: "steal", stolen: "steal", blew: "blow", blown: "blow",
  drew: "draw", drawn: "draw", rose: "rise", risen: "rise", shook: "shake", shaken: "shake",
  hung: "hang", dug: "dig", bit: "bite", bitten: "bite", forgot: "forget", forgotten: "forget",
  forgave: "forgive", forgiven: "forgive", understood: "understand", lit: "light", shone: "shine",
  swore: "swear", sworn: "swear", better: "good", best: "good", worse: "bad", worst: "bad",
  its: "it", his: "he", him: "he", her: "she", hers: "she", them: "they", their: "they",
  theirs: "they", us: "we", our: "we", me: "i", my: "i", mine: "i", your: "you", yours: "you",
};

const SUFFIXES = [
  ["ies", 3, "y"], ["ied", 3, "y"], ["ier", 3, "y"], ["iest", 4, "y"],
  ["sses", 2, ""], ["ches", 2, ""], ["shes", 2, ""], ["xes", 2, ""],
  ["ing", 3, ""], ["ed", 2, ""], ["est", 3, ""], ["er", 2, ""], ["ly", 2, ""],
  ["es", 2, ""], ["s", 1, ""],
];

function stem(w) {
  if (IRREG[w]) return IRREG[w];
  if (w.endsWith("n't")) return stem(w.slice(0, -3));
  if (w.includes("'")) {
    const head = w.split("'")[0];
    if (head) return stem(head);
  }
  for (const [suf, cut, add] of SUFFIXES) {
    if (w.length > cut + 2 && w.endsWith(suf)) {
      let base = w.slice(0, -cut) + add;
      if (/(bb|dd|gg|mm|nn|pp|rr|tt)$/.test(base)) base = base.slice(0, -1);
      return IRREG[base] ?? base;
    }
  }
  return w;
}

// ---------------------------------------------------------------- разбор книги

const counts = new Map();
const caps = new Map(); // слово → [сколько раз с заглавной, сколько со строчной]
const explained = new Set(); // всё, что объяснено во врезках «New Words»

for (const ch of book.chapters) {
  for (const b of ch.blocks) {
    if (b.kind === "v") {
      for (const item of b.items) {
        for (const part of item.id.toLowerCase().split(/[^a-z']+/)) {
          if (part) { explained.add(part); explained.add(stem(part)); }
        }
      }
      continue;
    }
    if (b.lang === "ru") continue;
    for (const s of b.sent ?? []) {
      for (const seg of s.seg) {
        for (const tk of seg.tk) {
          if (!tk.w) continue;
          const w = tk.w.toLowerCase();
          counts.set(w, (counts.get(w) ?? 0) + 1);
          const c = caps.get(w) ?? [0, 0];
          c[/^[A-Z]/.test(tk.w) ? 0 : 1]++;
          caps.set(w, c);
        }
      }
    }
  }
}

const proper = new Set();
const lemmas = new Set();
for (const w of counts.keys()) {
  const [up, low] = caps.get(w);
  for (const part of w.split(/[-']/).filter(Boolean)) {
    if (up > 0 && low === 0) proper.add(part);
    else lemmas.add(stem(part));
  }
}
for (const p of proper) lemmas.delete(p);

const rare = [...counts.entries()]
  .filter(([w, n]) => n <= rareAt)
  .filter(([w]) => !/\d/.test(w))
  .filter(([w]) => w.split(/[-']/).every((p) => !proper.has(p)))
  .filter(([w]) => !explained.has(w) && !explained.has(stem(w)))
  .map(([w, n]) => `${w}·${n}`)
  .sort();

const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(slug);
console.log(`  слов в тексте: ${total} (≈${Math.round(total / 250)} страниц)`);
console.log(`  словоформ: ${counts.size}`);
console.log(`  имён собственных: ${proper.size}`);
console.log(`  РАЗНЫХ слов надо знать: ${lemmas.size}`);
console.log(`  редких (≤${rareAt}) и не объяснённых во врезках: ${rare.length}`);
console.log("");
console.log(rare.join(" "));
