export type Lesson = {
  id: number;
  title: string;
  subtitle: string;
  topics: string[];
  available: boolean;
};

export const lessons: Lesson[] = [
  {
    id: 1,
    title: "Приветствие и знакомство",
    subtitle: "Здороваемся, представляемся, говорим кто мы",
    topics: ["Приветствия", "Местоимения", "Конструкция «Saya …»", "Прощание"],
    available: true,
  },
  {
    id: 2,
    title: "Отрицание и вопрос",
    subtitle: "tidak vs bukan, вопросительные предложения",
    topics: ["tidak", "bukan", "apakah", "Интонация"],
    available: false,
  },
  {
    id: 3,
    title: "Существительные",
    subtitle: "Множественное число, ini / itu, артикли",
    topics: ["Удвоение", "ini / itu", "sebuah / seorang"],
    available: false,
  },
  {
    id: 4,
    title: "Прилагательные",
    subtitle: "Порядок слов, степени сравнения",
    topics: ["Порядок слов", "sangat / sekali", "Сравнение"],
    available: false,
  },
  {
    id: 5,
    title: "Глаголы — настоящее",
    subtitle: "Базовое употребление без спряжения",
    topics: ["Частые глаголы", "Порядок слов", "Без спряжения"],
    available: false,
  },
  {
    id: 6,
    title: "Прошедшее время",
    subtitle: "sudah, telah, pernah, belum",
    topics: ["sudah", "telah", "pernah", "belum"],
    available: false,
  },
  {
    id: 7,
    title: "Будущее и намерение",
    subtitle: "akan, mau, ingin, hendak",
    topics: ["akan", "mau", "ingin"],
    available: false,
  },
  {
    id: 8,
    title: "Длительное и привычное действие",
    subtitle: "sedang, masih, selalu, kadang-kadang",
    topics: ["sedang", "masih", "Наречия частоты"],
    available: false,
  },
  {
    id: 9,
    title: "Притяжательные конструкции",
    subtitle: "Суффиксы -ku, -mu, -nya",
    topics: ["-ku", "-mu", "-nya", "N + saya"],
    available: false,
  },
  {
    id: 10,
    title: "Префикс me-",
    subtitle: "Главное правило словообразования глаголов",
    topics: ["me- / mem- / men- / meng-", "Корни"],
    available: false,
  },
  {
    id: 11,
    title: "Префиксы ber- и ter-",
    subtitle: "Состояние, случайное действие, превосходная степень",
    topics: ["ber-", "ter-"],
    available: false,
  },
  {
    id: 12,
    title: "Числа, время, даты",
    subtitle: "Счёт, часы, дни недели, месяцы",
    topics: ["Числа", "Часы", "Дни недели", "Месяцы"],
    available: false,
  },
  {
    id: 13,
    title: "Вопросительные слова",
    subtitle: "apa, siapa, di mana, kapan, berapa, mengapa",
    topics: ["apa / siapa", "di mana / kapan", "berapa", "bagaimana"],
    available: false,
  },
  {
    id: 14,
    title: "Сложные предложения",
    subtitle: "Союзы yang, karena, kalau, walaupun, supaya",
    topics: ["yang", "karena", "kalau", "walaupun"],
    available: false,
  },
  {
    id: 15,
    title: "Повелительное наклонение",
    subtitle: "Просьбы, запреты, вежливые формы",
    topics: ["tolong", "silakan", "jangan", "Вежливость"],
    available: false,
  },
  {
    id: 16,
    title: "Разговорный язык",
    subtitle: "Сленг, обращения, типичные обороты",
    topics: ["gue / lo", "Междометия", "Обращения"],
    available: false,
  },
];

export function getLesson(id: number): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}
