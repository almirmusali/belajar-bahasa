// Типы модуля «Экспресс». Файл намеренно свободен от node:fs — его импортируют
// клиентские компоненты. Чтение с диска живёт в lib/express.ts, и оно
// серверное. Ровно та же развилка, что у lib/reading-types.ts и lib/reading.ts.

export type Track = "particles" | "affixes";
export type Register = "baku" | "neutral" | "colloquial";

export type Example = {
  id: string;
  ru: string;
  scene_ru?: string;
};

export type ParticleFunction = {
  name_ru: string;
  position: "initial" | "final" | "after_topic" | "standalone" | "after_adjective" | "suffix";
  examples: Example[];
};

export type Particle = {
  id: string;
  move_ru: string;
  priority: number;
  note_ru?: string;
  bonus?: boolean;
  functions: ParticleFunction[];
  ru_bridge: string[];
  social_limits: string | null;
  common_errors: { wrong: string; right: string; why_ru: string }[];
};

export type MinimalPair = {
  base: string;
  ru: string;
  variants: { id: string; scene_ru: string }[];
};

export type ParticlesData = {
  particles: Particle[];
  ru_bridge_table: { ru: string; particle: string; id: string }[];
  chunks: { id: string; ru: string }[];
  minimal_pairs: MinimalPair[];
};

export type RootForm = {
  form: string;
  affix: string;
  pos: string;
  ru: string;
  register: Register;
  colloquial?: string;
  example_id: string;
  example_ru: string;
};

export type Root = {
  root: string;
  gloss_ru: string;
  productivity: number;
  family: RootForm[];
};

export type RootsData = {
  roots: Root[];
  register_pairs: { baku: string; colloquial: string; ru: string }[];
  in_pairs: { baku: string; colloquial: string; ru: string }[];
  men_rules: { start: string; form: string; example: string }[];
  ktsp: { root: string; result: string; note: string }[];
};

export type DrillType =
  | "particle_situation"
  | "particle_contrast"
  | "particle_ru_bridge"
  | "error_hunt"
  | "root_expand"
  | "word_strip"
  | "men_drill"
  | "register_swap"
  | "live_produce";

// Как дрилл спрашивает ответ. Тип дрилла — про содержание, mode — про
// экран: разводить их нужно, потому что register_swap встречается и
// вариантами, и вводом с клавиатуры.
export type DrillMode = "choice" | "input" | "fields" | "selfcheck";

export type DrillField = {
  label_ru: string;
  answer: string;
  accept?: string[];
};

export type Drill = {
  id: string;
  type: DrillType;
  mode: DrillMode;
  // Условие: prompt_ru — по-русски (ситуация), prompt — индонезийский материал.
  prompt_ru?: string;
  prompt?: string;
  hint_ru?: string;
  options?: string[];
  answer?: string;
  accept?: string[];
  fields?: DrillField[];
  explain_ru?: string;
  speak_aloud?: boolean;
  time_limit_sec?: number;
  audio?: string;
};

export type Unit = {
  id: string;
  track: Track;
  kind: "unit" | "exam";
  week: number;
  day: number;
  order: number;
  title_ru: string;
  subtitle_ru?: string;
  bonus?: boolean;
  theory_ru: string;
  items: string[];
  checklist: string[];
  pass_score?: number;
  drills: Drill[];
};

export const TRACK_TITLE: Record<Track, string> = {
  particles: "Частицы",
  affixes: "Аффиксы",
};

export const DRILL_TITLE: Record<DrillType, string> = {
  particle_situation: "Выбор под ситуацию",
  particle_contrast: "Минимальная пара",
  particle_ru_bridge: "Мост из русского",
  error_hunt: "Найди ошибку",
  root_expand: "Корень → семья",
  word_strip: "Разбор слова",
  men_drill: "Механика meN-",
  register_swap: "Регистр",
  live_produce: "Живой перевод",
};

// Сравнение ответа. Ученик печатает с телефона: регистр, лишние пробелы,
// точка в конце и дефис вместо пробела не должны считаться ошибкой.
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:…+]/g, " ")
    .replace(/[-‑–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrect(given: string, answer: string, accept?: string[]): boolean {
  const g = normalizeAnswer(given);
  if (!g) return false;
  return [answer, ...(accept ?? [])]
    .filter(Boolean)
    .some((a) => normalizeAnswer(a) === g);
}
