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
 */
export function audioUrl(text: string, lang: AudioLang): string | null {
  return `/audio/${audioFilename(text, lang)}`;
}

export function audioFilename(text: string, lang: AudioLang): string {
  return `${lang}/${fnv1a(`${lang}:${text}`)}.mp3`;
}
