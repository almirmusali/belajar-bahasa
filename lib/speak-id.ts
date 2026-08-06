import { audioUrl } from "./audio-url";

/**
 * Произносит индонезийскую фразу: сначала пробует студийную озвучку
 * (предгенерированный MP3 в public/audio/), при её отсутствии — системный
 * голос Web Speech.
 *
 * Возвращает функцию остановки — вызови её, если нужно прервать
 * воспроизведение (например, при уходе со страницы).
 *
 * FlashcardPlayer сюда не заходит: ему нужны промисы, три языка и
 * своя очередь озвучки, поэтому у него отдельная реализация.
 */
export function speakId(text: string): () => void {
  let audio: HTMLAudioElement | null = null;
  let stopped = false;

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
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "id-ID";
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(
      (v) => v.lang === "id-ID" || v.lang.startsWith("id"),
    );
    if (idVoice) utter.voice = idVoice;
    window.speechSynthesis.speak(utter);
  };

  // Прерываем то, что играет сейчас: иначе на быстрых тапах фразы наложатся.
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  const url = audioUrl(text, "id");
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
  };
  // Ошибка после старта — слово уже прозвучало, второй раз читать не нужно,
  // иначе пользователь услышит и MP3, и системный голос.
  el.onerror = () => {
    clear();
    if (!started) webSpeech();
  };
  el.play().catch(() => {
    clear();
    if (!started) webSpeech();
  });

  return stop;
}
