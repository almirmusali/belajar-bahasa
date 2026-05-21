import type { Locale } from "./use-locale";

type Dict = Record<string, string>;

const ru: Dict = {
  // Nav / header
  nav_lessons: "Уроки",
  nav_vocab: "Словарь",
  switch_lang_title: "Переключить язык интерфейса",

  // Home
  home_badge: "Bahasa Indonesia",
  home_title: "Индонезийский за 16 уроков",
  home_subtitle:
    "Курс по образцу «Полиглота»: короткие уроки, грамматические матрицы и устные упражнения. Подходит тем, кто начинает с нуля.",
  home_cta_lessons: "К урокам",
  home_cta_vocab: "Словарь",
  home_lesson: "Урок",
  home_soon: "Скоро",

  // Lessons
  lessons_back_all: "Все уроки",
  lessons_lesson: "Урок",
  lessons_coming_soon_title: "Урок скоро появится",
  lessons_coming_soon_subtitle:
    "Сейчас доступен только Урок 1 — структура остальных уроков уже намечена.",

  // Vocab catalog
  vocab_badge: "Словарь",
  vocab_title: "Карточки со словами",
  vocab_subtitle:
    "Quizlet-стиль: выбери набор, нажми «Авто» и слова сами листаются с озвучкой. Скорость и направление настраиваются.",
  vocab_learned_link: "Выученные слова",
  vocab_empty_title: "Нет ни одного набора",
  vocab_empty_subtitle: "Добавь папку в data/vocab/ — формат описан в README.",
  vocab_words: "слов",
  vocab_add_hint: "Хочешь добавить свой набор?",
  vocab_add_link: "Инструкция в репозитории",
  vocab_back_all: "Все наборы",

  // Learned
  learned_title: "Выученные слова",
  learned_subtitle:
    "Слова, которые ты отметил «знаю». Они исключены из автоповтора, но всегда здесь, если захочешь повторить или вернуть в учёбу.",
  learned_loading: "Загружаем прогресс…",
  learned_empty_title: "Пока пусто",
  learned_empty_subtitle:
    "Открой набор словаря и нажми «Знаю» на карточке — слово попадёт сюда.",
  learned_to_sets: "К наборам",
  learned_total: "Всего выучено:",
  learned_in: "в",
  learned_storage_note: "Прогресс хранится в этом браузере",
  learned_clear_all: "Очистить всё",
  learned_clear_set_confirm: "Сбросить прогресс «{title}»?",
  learned_clear_all_confirm: "Очистить весь прогресс «выучено»?",
  learned_words_count: "слов",
  learned_reset: "сбросить",
  learned_return: "Вернуть в учёбу",

  // Flashcard player
  fc_progress: "Прогресс:",
  fc_learned: "выучено",
  fc_side_target: "Индонезийский",
  fc_side_translation: "Перевод",
  fc_empty: "В этом наборе нет слов.",
  fc_all_done_title: "Все слова выучены!",
  fc_all_done_marked: "помечены как «знаю».",
  fc_study_again: "Изучать снова",
  fc_show_learned: "Показать выученные",
  fc_back: "Назад",
  fc_forward: "Вперёд",
  fc_auto: "Авто",
  fc_pause: "Пауза",
  fc_flip: "Перевернуть",
  fc_shuffle: "Перемешать",
  fc_know: "Знаю",
  fc_unknow: "Вернуть в учёбу",
  fc_settings_speed: "Скорость",
  fc_settings_speed_unit: "с на сторону",
  fc_settings_direction: "Направление",
  fc_settings_direction_target_first: "цель → перевод",
  fc_settings_direction_translation_first: "перевод → цель",
  fc_settings_direction_hint: "Какая сторона первой",
  fc_settings_audio: "Озвучка",
  fc_settings_audio_all: "все",
  fc_settings_audio_off: "выкл",
  fc_settings_audio_state_off: "Без авто-озвучки",
  fc_settings_audio_state: "Авто: {langs}",
  fc_settings_learned: "Выученные",
  fc_settings_learned_hidden: "Скрыты",
  fc_settings_learned_shown: "Показаны",
  fc_settings_learned_reset: "Сбросить",
  fc_kbd_hint: "пробел — переворот · ← → между карточками · P — пауза · K — знаю",
  fc_speak_target: "Произнести по-индонезийски",
  fc_speak_en: "Произнести по-английски",
  fc_speak_native: "Произнести по-русски",
  fc_study: "Изучать",
  fc_exit_study: "Выйти",

  // Install hint
  install_ios_title: "Установить на iPhone",
  install_ios_body: 'Нажми «Поделиться» в Safari, затем «На экран Домой».',
  install_android_title: "Установить приложение",
  install_android_body: "Сохрани Belajar как приложение прямо из браузера.",
  install_install: "Установить",
  install_dismiss: "Скрыть",

  // Lesson 1 (Russian-mode lessons banner — visible in ID mode)
  lessons_ru_only_notice: "Объяснения уроков пока на русском.",
};

const id: Dict = {
  nav_lessons: "Pelajaran",
  nav_vocab: "Kosakata",
  switch_lang_title: "Ganti bahasa antarmuka",

  home_badge: "Bahasa Rusia",
  home_title: "Bahasa Rusia dalam 16 pelajaran",
  home_subtitle:
    "Kursus bergaya «Polyglot»: pelajaran singkat, matriks tata bahasa, dan latihan lisan. Cocok untuk pemula dari nol.",
  home_cta_lessons: "Ke pelajaran",
  home_cta_vocab: "Kosakata",
  home_lesson: "Pelajaran",
  home_soon: "Segera",

  lessons_back_all: "Semua pelajaran",
  lessons_lesson: "Pelajaran",
  lessons_coming_soon_title: "Pelajaran akan segera hadir",
  lessons_coming_soon_subtitle:
    "Saat ini hanya Pelajaran 1 yang tersedia — struktur pelajaran lain sudah disiapkan.",

  vocab_badge: "Kosakata",
  vocab_title: "Kartu kosakata",
  vocab_subtitle:
    "Gaya Quizlet: pilih koleksi, tekan «Otomatis» dan kartu akan berganti sendiri dengan suara. Kecepatan dan arah dapat diatur.",
  vocab_learned_link: "Kata yang sudah dipelajari",
  vocab_empty_title: "Belum ada koleksi",
  vocab_empty_subtitle:
    "Tambahkan folder di data/vocab/ — format dijelaskan di README.",
  vocab_words: "kata",
  vocab_add_hint: "Ingin menambah koleksi sendiri?",
  vocab_add_link: "Petunjuk di repositori",
  vocab_back_all: "Semua koleksi",

  learned_title: "Kata yang sudah dipelajari",
  learned_subtitle:
    "Kata yang kamu tandai «Saya tahu». Kata-kata ini dikeluarkan dari pengulangan otomatis, tapi selalu ada di sini bila ingin diulang atau dikembalikan ke pembelajaran.",
  learned_loading: "Memuat progres…",
  learned_empty_title: "Masih kosong",
  learned_empty_subtitle:
    "Buka koleksi kosakata dan tekan «Saya tahu» pada kartu — kata akan masuk ke sini.",
  learned_to_sets: "Ke koleksi",
  learned_total: "Total dipelajari:",
  learned_in: "dalam",
  learned_storage_note: "Progres disimpan di peramban ini",
  learned_clear_all: "Hapus semua",
  learned_clear_set_confirm: "Atur ulang progres «{title}»?",
  learned_clear_all_confirm: "Hapus seluruh progres «sudah dipelajari»?",
  learned_words_count: "kata",
  learned_reset: "atur ulang",
  learned_return: "Kembalikan ke pembelajaran",

  fc_progress: "Progres:",
  fc_learned: "dipelajari",
  fc_side_target: "Bahasa Rusia",
  fc_side_translation: "Terjemahan",
  fc_empty: "Tidak ada kata di koleksi ini.",
  fc_all_done_title: "Semua kata sudah dipelajari!",
  fc_all_done_marked: "ditandai sebagai «saya tahu».",
  fc_study_again: "Pelajari lagi",
  fc_show_learned: "Tampilkan yang sudah dipelajari",
  fc_back: "Mundur",
  fc_forward: "Maju",
  fc_auto: "Otomatis",
  fc_pause: "Jeda",
  fc_flip: "Balik",
  fc_shuffle: "Acak",
  fc_know: "Saya tahu",
  fc_unknow: "Kembalikan",
  fc_settings_speed: "Kecepatan",
  fc_settings_speed_unit: "d per sisi",
  fc_settings_direction: "Arah",
  fc_settings_direction_target_first: "target → terjemahan",
  fc_settings_direction_translation_first: "terjemahan → target",
  fc_settings_direction_hint: "Sisi mana yang muncul lebih dulu",
  fc_settings_audio: "Suara",
  fc_settings_audio_all: "semua",
  fc_settings_audio_off: "mati",
  fc_settings_audio_state_off: "Tanpa suara otomatis",
  fc_settings_audio_state: "Otomatis: {langs}",
  fc_settings_learned: "Sudah dipelajari",
  fc_settings_learned_hidden: "Disembunyikan",
  fc_settings_learned_shown: "Ditampilkan",
  fc_settings_learned_reset: "Atur ulang",
  fc_kbd_hint:
    "spasi — balik · ← → antar kartu · P — jeda · K — saya tahu",
  fc_speak_target: "Ucapkan dalam bahasa Rusia",
  fc_speak_en: "Ucapkan dalam bahasa Inggris",
  fc_speak_native: "Ucapkan dalam bahasa Indonesia",
  fc_study: "Belajar",
  fc_exit_study: "Keluar",

  install_ios_title: "Pasang di iPhone",
  install_ios_body:
    'Tekan «Bagikan» di Safari, lalu «Tambahkan ke Layar Utama».',
  install_android_title: "Pasang aplikasi",
  install_android_body: "Simpan Belajar sebagai aplikasi langsung dari peramban.",
  install_install: "Pasang",
  install_dismiss: "Sembunyikan",

  lessons_ru_only_notice:
    "Penjelasan pelajaran masih dalam Bahasa Rusia (akan diterjemahkan).",
};

const dicts: Record<Locale, Dict> = { ru, id };

export function t(locale: Locale, key: keyof typeof ru): string {
  return (dicts[locale] && dicts[locale][key]) ?? ru[key] ?? key;
}

export function tf(
  locale: Locale,
  key: keyof typeof ru,
  vars: Record<string, string | number>,
): string {
  let s = t(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return s;
}
