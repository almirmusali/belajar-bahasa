// Хэш текста (FNV-1a 32-bit). Один и тот же в Node-скрипте генерации
// и в браузере при поиске URL — поэтому имя файла детерминированно.
export function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h ^ str.charCodeAt(i), 0x01000193)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export type AudioLang = "id" | "en" | "ru";

/**
 * Возвращает URL предгенерированного MP3 из public/audio/.
 *
 * Файлы генерирует scripts/generate-audio-voicer.mjs — у каждого языка
 * свой голос ElevenLabs. Нет файла — будет 404, и плеер молча уходит
 * на системный Web Speech, так что неозвученный язык просто работает
 * как раньше.
 *
 * `voice` — голос книги (поле `voice` в её JSON): тогда файл лежит в
 * public/audio/voice/<voice>/ — их пишет scripts/generate-audio-lumean.mjs.
 * Общая папка тут не годится: имя файла — хэш текста, и одна и та же фраза
 * из словаря и из книги звучала бы одним голосом на двоих.
 */
export function audioUrl(text: string, lang: AudioLang, voice?: string): string | null {
  return `/audio/${audioFilename(text, lang, voice)}`;
}

export function audioFilename(text: string, lang: AudioLang, voice?: string): string {
  const file = `${lang}/${fnv1a(`${lang}:${text}`)}.mp3`;
  return voice ? `voice/${voice}/${file}` : file;
}

/**
 * Отдельное слово, начитанное само по себе (не вырезанное из фразы). Ключ —
 * форма в нижнем регистре: «Perahu» в начале фразы и «perahu» внутри неё
 * звучат одним файлом. Есть только у книг со своим голосом.
 */
export function wordAudioUrl(word: string, lang: AudioLang, voice: string): string {
  return `/audio/voice/${voice}/${lang}/w/${fnv1a(`${lang}:${word.toLowerCase()}`)}.mp3`;
}
