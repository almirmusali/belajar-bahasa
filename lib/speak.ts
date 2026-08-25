import { audioUrl, type AudioLang } from "./audio-url";

// Голос Web Speech по языку. Нужен только как запасной вариант: когда MP3
// есть, системный синтезатор не участвует вовсе.
const BCP47: Record<AudioLang, string> = {
  id: "id-ID",
  en: "en-US",
  ru: "ru-RU",
};

/**
 * Произносит фразу: сначала пробует студийную озвучку (предгенерированный
 * MP3 в public/audio/<lang>/), при её отсутствии — системный голос Web Speech.
 *
 * Язык по умолчанию индонезийский — словарь и уроки других не знают; читалка
 * передаёт язык книги, потому что «AI & Business English» английская.
 *
 * Возвращает функцию остановки — вызови её, если нужно прервать
 * воспроизведение (например, при уходе со страницы).
 *
 * opts.onEnd срабатывает, когда фраза договорена сама (не при stop()) —
 * читалке это нужно, чтобы погасить индикатор «играет».
 *
 * FlashcardPlayer сюда не заходит: ему нужны промисы, три языка и
 * своя очередь озвучки, поэтому у него отдельная реализация.
 */
export function speak(
  text: string,
  opts?: { onEnd?: () => void; lang?: AudioLang },
): () => void {
  const lang = opts?.lang ?? "id";
  let audio: HTMLAudioElement | null = null;
  let stopped = false;

  // Сообщаем о конце ровно один раз и никогда — после stop():
  // тот, кто остановил, и так знает.
  const finish = () => {
    if (stopped) return;
    stopped = true;
    opts?.onEnd?.();
  };

  const stop = () => {
    stopped = true;
    if (audio) {
      audio.pause();
      audio.src = "";
      audio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // 404 по MP3 роняет и onerror, и play().catch() — без защёлки фраза
  // произносится дважды.
  let settled = false;

  const webSpeech = () => {
    if (stopped || settled) return;
    settled = true;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      finish();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = finish;
    utter.onerror = finish;
    utter.lang = BCP47[lang];
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(
      (v) => v.lang === BCP47[lang] || v.lang.startsWith(lang),
    );
    if (match) utter.voice = match;
    window.speechSynthesis.speak(utter);
  };

  // Прерываем то, что играет сейчас: иначе на быстрых тапах фразы наложатся.
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  const url = audioUrl(text, lang);
  if (!url) {
    webSpeech();
    return stop;
  }

  const el = new Audio(url);
  audio = el;
  let started = false;
  el.onplaying = () => {
    started = true;
  };
  const clear = () => {
    if (audio === el) audio = null;
  };
  el.onended = () => {
    settled = true;
    clear();
    finish();
  };
  // Ошибка после старта — слово уже прозвучало, второй раз читать не нужно,
  // иначе пользователь услышит и MP3, и системный голос.
  el.onerror = () => {
    clear();
    if (!started) webSpeech();
    else finish();
  };
  el.play().catch(() => {
    clear();
    if (!started) webSpeech();
    else finish();
  });

  return stop;
}
