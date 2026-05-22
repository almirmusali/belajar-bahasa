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
 * Возвращает URL предгенерированного MP3 в Supabase Storage.
 * Если файла нет — будет 404, и плеер сделает fallback на Web Speech.
 *
 * Временно отключено: возвращает null — плеер использует только Web Speech API
 * (системные голоса iOS/Android/macOS). Чтобы включить обратно,
 * раскомментируй блок ниже и убедись что файлы есть в Storage.
 */
export function audioUrl(_text: string, _lang: AudioLang): string | null {
  return null;

  // const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // if (!base) return null;
  // const filename = `${_lang}/${fnv1a(`${_lang}:${_text}`)}.mp3`;
  // return `${base}/storage/v1/object/public/audio/${filename}`;
}

export function audioFilename(text: string, lang: AudioLang): string {
  return `${lang}/${fnv1a(`${lang}:${text}`)}.mp3`;
}
