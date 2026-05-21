// Разбивает data/vocab/top-1000/index.json на тематические наборы.
// Также удаляет старые личные наборы personal-pronouns и numbers-1-20,
// поскольку их содержимое попадает в более полные новые наборы.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOCAB_DIR = path.join(__dirname, "..", "data", "vocab");

const source = path.join(VOCAB_DIR, "top-1000", "index.json");
const data = JSON.parse(fs.readFileSync(source, "utf8"));
const words = data.words;

// Каждая категория задаётся ID первого слова. Слайс берётся до начала следующей.
const cats = [
  {
    slug: "phrases-courtesy",
    first: "halo",
    title: "Приветствия и фразы вежливости",
    title_id: "Salam dan frasa kesopanan",
    description: "Здороваемся, благодарим, извиняемся, прощаемся",
    description_id: "Sapaan, terima kasih, permintaan maaf, perpisahan",
  },
  {
    slug: "pronouns",
    first: "saya",
    title: "Местоимения",
    title_id: "Kata ganti",
    description: "Я, ты, он/она, мы, вы, они и формальные варианты",
    description_id: "Saya, kamu, dia, kami, kalian, mereka dan bentuk formal",
  },
  {
    slug: "question-words",
    first: "apa",
    title: "Вопросительные слова",
    title_id: "Kata tanya",
    description: "Что, кто, где, когда, почему, как, сколько",
    description_id: "Apa, siapa, di mana, kapan, mengapa, bagaimana, berapa",
  },
  {
    slug: "demonstratives",
    first: "ini",
    title: "Указательные слова",
    title_id: "Kata penunjuk",
    description: "Это / то, здесь / там, вот так",
    description_id: "Ini / itu, sini / sana, begini / begitu",
  },
  {
    slug: "grammar-particles",
    first: "tidak",
    title: "Грамматические маркеры",
    title_id: "Penanda tata bahasa",
    description: "Отрицание, время, модальность: tidak, sudah, akan, harus…",
    description_id: "Negasi, waktu, modalitas: tidak, sudah, akan, harus…",
  },
  {
    slug: "prepositions",
    first: "di",
    title: "Предлоги",
    title_id: "Kata depan",
    description: "В, на, к, от, с, для, без, между…",
    description_id: "Di, ke, dari, dengan, untuk, tanpa, antara…",
  },
  {
    slug: "conjunctions",
    first: "dan",
    title: "Союзы",
    title_id: "Kata sambung",
    description: "И, или, но, потому что, если, когда, после…",
    description_id: "Dan, atau, tapi, karena, kalau, ketika, setelah…",
  },
  {
    slug: "yes-no",
    first: "ya",
    title: "Утверждение и оценка",
    title_id: "Penegasan dan penilaian",
    description: "Да, нет, верно, неправильно, конечно, возможно",
    description_id: "Ya, tidak, benar, salah, tentu, mungkin",
  },
  {
    slug: "numbers",
    first: "nol",
    title: "Числа",
    title_id: "Angka",
    description: "От 0 до миллиарда, порядковые, дроби",
    description_id: "Dari 0 sampai miliar, bilangan tingkat, pecahan",
  },
  {
    slug: "time",
    first: "waktu",
    title: "Время",
    title_id: "Waktu",
    description:
      "Час, минута, день, неделя, месяц, год, утром / вечером, частота",
    description_id: "Jam, menit, hari, minggu, bulan, tahun, frekuensi",
  },
  {
    slug: "calendar",
    first: "Senin",
    title: "Дни и месяцы",
    title_id: "Hari dan bulan",
    description: "Дни недели, названия месяцев, сезоны",
    description_id: "Hari, bulan, musim",
  },
  {
    slug: "family-people",
    first: "keluarga",
    title: "Семья и люди",
    title_id: "Keluarga dan orang",
    description: "Члены семьи, возраст, имя, отношения, друзья",
    description_id: "Anggota keluarga, usia, nama, hubungan, teman",
  },
  {
    slug: "body",
    first: "tubuh",
    title: "Тело",
    title_id: "Tubuh",
    description: "Части тела от головы до ног, органы",
    description_id: "Bagian tubuh dari kepala sampai kaki, organ",
  },
  {
    slug: "health",
    first: "sehat",
    title: "Здоровье",
    title_id: "Kesehatan",
    description: "Здоровье и недомогание, лекарства, состояния",
    description_id: "Sehat dan sakit, obat, keadaan",
  },
  {
    slug: "house",
    first: "rumah",
    title: "Дом и быт",
    title_id: "Rumah dan perlengkapan",
    description: "Комнаты, мебель, кухонная утварь, бытовые предметы",
    description_id: "Ruangan, perabot, peralatan dapur, barang sehari-hari",
  },
  {
    slug: "food-drinks",
    first: "makanan",
    title: "Еда и напитки",
    title_id: "Makanan dan minuman",
    description: "Базовая еда, мясо, специи, индонезийские блюда, напитки",
    description_id:
      "Makanan dasar, daging, bumbu, masakan Indonesia, minuman",
  },
  {
    slug: "fruits-veg",
    first: "apel",
    title: "Фрукты и овощи",
    title_id: "Buah dan sayur",
    description: "Сезонные фрукты, овощи, специи",
    description_id: "Buah musiman, sayuran, rempah",
  },
  {
    slug: "clothes",
    first: "pakaian",
    title: "Одежда",
    title_id: "Pakaian",
    description: "Базовый гардероб, обувь, аксессуары",
    description_id: "Pakaian dasar, alas kaki, aksesori",
  },
  {
    slug: "animals",
    first: "binatang",
    title: "Животные",
    title_id: "Hewan",
    description: "Домашние, дикие, морские, насекомые",
    description_id: "Hewan peliharaan, liar, laut, serangga",
  },
  {
    slug: "nature",
    first: "alam",
    title: "Природа и погода",
    title_id: "Alam dan cuaca",
    description: "Небо, ландшафт, погодные явления, растения",
    description_id: "Langit, lanskap, cuaca, tumbuhan",
  },
  {
    slug: "places",
    first: "kota",
    title: "Город и места",
    title_id: "Kota dan tempat",
    description: "Город, инфраструктура, заведения, страны",
    description_id: "Kota, infrastruktur, fasilitas, negara",
  },
  {
    slug: "transport",
    first: "kendaraan",
    title: "Транспорт",
    title_id: "Transportasi",
    description: "Автомобиль, общественный транспорт, путешествия",
    description_id: "Mobil, transportasi umum, perjalanan",
  },
  {
    slug: "work",
    first: "pekerjaan",
    title: "Работа и профессии",
    title_id: "Pekerjaan dan profesi",
    description: "Работа, должности, профессии, рабочие отношения",
    description_id: "Pekerjaan, jabatan, profesi, hubungan kerja",
  },
  {
    slug: "money",
    first: "uang",
    title: "Деньги",
    title_id: "Uang",
    description: "Валюты, банк, цены, бухгалтерия",
    description_id: "Mata uang, bank, harga, keuangan",
  },
  {
    slug: "education",
    first: "pendidikan",
    title: "Учёба и язык",
    title_id: "Pendidikan dan bahasa",
    description: "Школа, учебники, экзамены, лингвистика",
    description_id: "Sekolah, buku, ujian, bahasa",
  },
  {
    slug: "colors",
    first: "warna",
    title: "Цвета",
    title_id: "Warna",
    description: "Основные и оттенки",
    description_id: "Warna dasar dan nuansa",
  },
  {
    slug: "verbs",
    first: "pergi",
    title: "Глаголы",
    title_id: "Kata kerja",
    description:
      "~180 базовых глаголов: движение, действие, чувства, речь, мышление",
    description_id:
      "~180 kata kerja dasar: gerakan, tindakan, perasaan, ucapan, pikiran",
  },
  {
    slug: "adjectives",
    first: "bagus",
    title: "Прилагательные",
    title_id: "Kata sifat",
    description: "Размер, оценка, характер, чувства, состояние",
    description_id: "Ukuran, penilaian, sifat, perasaan, keadaan",
  },
  {
    slug: "adverbs",
    first: "sangat",
    title: "Наречия и сравнения",
    title_id: "Kata keterangan",
    description: "Степень, частота, сравнение, способ",
    description_id: "Derajat, frekuensi, perbandingan, cara",
  },
  {
    slug: "tech",
    first: "internet",
    title: "Технологии и медиа",
    title_id: "Teknologi dan media",
    description: "Интернет, гаджеты, контент",
    description_id: "Internet, gawai, konten",
  },
  {
    slug: "religion-holidays",
    first: "agama",
    title: "Религия и праздники",
    title_id: "Agama dan hari raya",
    description: "Религии, традиции, праздники",
    description_id: "Agama, tradisi, perayaan",
  },
  {
    slug: "abstract",
    first: "pertanyaan",
    title: "Абстрактные понятия",
    title_id: "Konsep abstrak",
    description: "Идеи, цели, опыт, изменения, жизнь",
    description_id: "Ide, tujuan, pengalaman, perubahan, kehidupan",
  },
  {
    slug: "phrases-conversation",
    first: "siapa namamu",
    title: "Разговорные фразы",
    title_id: "Frasa percakapan",
    description: "Готовые фразы для общения: вопросы, мнения, реакции",
    description_id: "Frasa siap pakai: pertanyaan, pendapat, reaksi",
  },
];

// Находим границы по первому слову каждой категории
const boundaries = cats.map((c) => {
  const idx = words.findIndex((w) => w.id === c.first);
  if (idx === -1) {
    throw new Error(`Boundary word "${c.first}" not found in top-1000`);
  }
  return idx;
});
boundaries.push(words.length);

// Проверяем, что границы идут по возрастанию
for (let i = 1; i < boundaries.length; i++) {
  if (boundaries[i] <= boundaries[i - 1]) {
    throw new Error(
      `Boundary order violated at ${cats[i - 1].slug} → ${cats[i]?.slug ?? "end"}`,
    );
  }
}

let totalCovered = 0;
for (let i = 0; i < cats.length; i++) {
  const slice = words.slice(boundaries[i], boundaries[i + 1]);
  totalCovered += slice.length;
  const cat = cats[i];
  const outDir = path.join(VOCAB_DIR, cat.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "index.json"),
    JSON.stringify(
      {
        title: cat.title,
        title_id: cat.title_id,
        description: cat.description,
        description_id: cat.description_id,
        words: slice,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`✓ ${cat.slug.padEnd(22)} ${String(slice.length).padStart(4)} слов`);
}

console.log(`\nTotal split: ${totalCovered} of ${words.length}`);
if (totalCovered !== words.length) {
  console.warn(`!! Some words were not covered: ${words.length - totalCovered}`);
}

// Удаляем старые наборы, которые полностью покрыты новыми
for (const old of ["top-1000", "personal-pronouns", "numbers-1-20"]) {
  const p = path.join(VOCAB_DIR, old);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true });
    console.log(`✗ removed data/vocab/${old}/`);
  }
}
