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
  fc_swipe_hint: "Свайп: ← → между карточками · ↑ — знаю · ↓ — вернуть",

  // Install hint
  install_ios_title: "Установить на iPhone",
  install_ios_body: 'Нажми «Поделиться» в Safari, затем «На экран Домой».',
  install_android_title: "Установить приложение",
  install_android_body: "Сохрани Belajar как приложение прямо из браузера.",
  install_install: "Установить",
  install_dismiss: "Скрыть",

  // Lesson 1 (Russian-mode lessons banner — visible in ID mode)
  lessons_ru_only_notice: "Объяснения уроков пока на русском.",

  // Auth
  nav_login: "Войти",
  nav_account: "Профиль",
  nav_logout: "Выйти",

  auth_email: "Email",
  auth_password: "Пароль",
  auth_password_confirm: "Повторите пароль",
  auth_password_min: "Минимум 6 символов",

  auth_login_title: "Вход",
  auth_login_subtitle: "Войди по email и паролю, чтобы прогресс сохранялся между устройствами.",
  auth_login_submit: "Войти",
  auth_no_account: "Ещё нет аккаунта?",
  auth_signup_link: "Создать",

  auth_signup_title: "Регистрация",
  auth_signup_subtitle: "Создай аккаунт — прогресс будет синхронизирован на всех устройствах.",
  auth_signup_submit: "Создать аккаунт",
  auth_already_have_account: "Уже есть аккаунт?",
  auth_login_link: "Войти",

  auth_forgot: "Забыли пароль?",
  auth_forgot_title: "Восстановление пароля",
  auth_forgot_subtitle: "Введи email — пришлём ссылку для сброса пароля.",
  auth_forgot_submit: "Прислать ссылку",
  auth_forgot_sent: "Если такой email зарегистрирован, мы прислали ссылку для сброса.",

  auth_reset_title: "Новый пароль",
  auth_reset_subtitle: "Придумай новый пароль для своего аккаунта.",
  auth_reset_submit: "Сохранить пароль",
  auth_reset_done: "Пароль обновлён. Можешь входить.",

  auth_signup_check_email: "Проверь почту — мы отправили ссылку для подтверждения. После подтверждения вернись и войди.",
  auth_password_mismatch: "Пароли не совпадают",
  auth_not_configured: "Авторизация не настроена. Обратись к администратору сайта.",

  // Account
  account_title: "Личный кабинет",
  account_signed_in_as: "Вы вошли как",
  account_stats_words: "Выучено слов",
  account_stats_lessons: "Пройдено уроков",
  account_stats_sets: "Активных наборов",
  account_lesson_progress_title: "Прогресс по урокам",
  account_vocab_progress_title: "Прогресс по словарю",
  account_continue: "Продолжить",
  account_member_since: "Аккаунт создан:",
  account_local_only_warning: "Сейчас прогресс хранится только в этом браузере. Зарегистрируйся, чтобы он синхронизировался между устройствами.",
  account_sync_pending: "Синхронизируем локальный прогресс с облаком…",
  account_sync_done: "Прогресс синхронизирован",

  // Lesson progress
  lesson_mark_complete: "Пометить пройденным",
  lesson_completed: "Урок пройден",
  lesson_mark_incomplete: "Снять отметку",
  lesson_completed_on: "Пройдено",

  // Stats dashboard
  stats_title: "Статистика обучения",
  stats_today: "Сегодня",
  stats_week: "Неделя",
  stats_month: "Месяц",
  stats_cards_short: "карточек",
  stats_time_short: "времени",
  stats_no_activity: "Начни учить карточки — здесь появится твоя статистика",
  stats_last_7_days: "Последние 7 дней",
  stats_view_cards: "карточки",
  stats_view_time: "время",
  stats_h: "ч",
  stats_min: "мин",
  stats_sec: "с",
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
  fc_swipe_hint:
    "Geser: ← → antar kartu · ↑ — saya tahu · ↓ — kembalikan",

  install_ios_title: "Pasang di iPhone",
  install_ios_body:
    'Tekan «Bagikan» di Safari, lalu «Tambahkan ke Layar Utama».',
  install_android_title: "Pasang aplikasi",
  install_android_body: "Simpan Belajar sebagai aplikasi langsung dari peramban.",
  install_install: "Pasang",
  install_dismiss: "Sembunyikan",

  lessons_ru_only_notice:
    "Penjelasan pelajaran masih dalam Bahasa Rusia (akan diterjemahkan).",

  // Auth
  nav_login: "Masuk",
  nav_account: "Profil",
  nav_logout: "Keluar",

  auth_email: "Email",
  auth_password: "Kata sandi",
  auth_password_confirm: "Ulangi kata sandi",
  auth_password_min: "Minimal 6 karakter",

  auth_login_title: "Masuk",
  auth_login_subtitle: "Masuk dengan email dan kata sandi agar progres tersimpan di semua perangkat.",
  auth_login_submit: "Masuk",
  auth_no_account: "Belum punya akun?",
  auth_signup_link: "Daftar",

  auth_signup_title: "Daftar",
  auth_signup_subtitle: "Buat akun — progres akan tersinkron di semua perangkatmu.",
  auth_signup_submit: "Buat akun",
  auth_already_have_account: "Sudah punya akun?",
  auth_login_link: "Masuk",

  auth_forgot: "Lupa kata sandi?",
  auth_forgot_title: "Pemulihan kata sandi",
  auth_forgot_subtitle: "Masukkan email — kami akan mengirim tautan untuk mengatur ulang.",
  auth_forgot_submit: "Kirim tautan",
  auth_forgot_sent: "Jika email tersebut terdaftar, kami sudah mengirim tautan reset.",

  auth_reset_title: "Kata sandi baru",
  auth_reset_subtitle: "Buat kata sandi baru untuk akunmu.",
  auth_reset_submit: "Simpan kata sandi",
  auth_reset_done: "Kata sandi diperbarui. Silakan masuk.",

  auth_signup_check_email:
    "Periksa email — kami mengirim tautan konfirmasi. Setelah dikonfirmasi, kembali dan masuk.",
  auth_password_mismatch: "Kata sandi tidak cocok",
  auth_not_configured: "Autentikasi belum dikonfigurasi. Hubungi administrator.",

  // Account
  account_title: "Profil",
  account_signed_in_as: "Anda masuk sebagai",
  account_stats_words: "Kata dipelajari",
  account_stats_lessons: "Pelajaran selesai",
  account_stats_sets: "Koleksi aktif",
  account_lesson_progress_title: "Progres pelajaran",
  account_vocab_progress_title: "Progres kosakata",
  account_continue: "Lanjutkan",
  account_member_since: "Akun dibuat:",
  account_local_only_warning:
    "Saat ini progres hanya tersimpan di peramban ini. Daftar agar progres tersinkron antar perangkat.",
  account_sync_pending: "Menyinkronkan progres lokal dengan cloud…",
  account_sync_done: "Progres tersinkron",

  // Lesson progress
  lesson_mark_complete: "Tandai selesai",
  lesson_completed: "Pelajaran selesai",
  lesson_mark_incomplete: "Hapus tanda",
  lesson_completed_on: "Selesai",

  // Stats dashboard
  stats_title: "Statistik belajar",
  stats_today: "Hari ini",
  stats_week: "Minggu",
  stats_month: "Bulan",
  stats_cards_short: "kartu",
  stats_time_short: "waktu",
  stats_no_activity: "Mulai belajar kartu — statistikmu akan muncul di sini",
  stats_last_7_days: "7 hari terakhir",
  stats_view_cards: "kartu",
  stats_view_time: "waktu",
  stats_h: "j",
  stats_min: "mnt",
  stats_sec: "d",
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
