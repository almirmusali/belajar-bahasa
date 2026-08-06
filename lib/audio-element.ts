"use client";

/**
 * Один переиспользуемый <audio> на всё приложение.
 *
 * Зачем так, а не `new Audio(url)` на каждую фразу: iOS выдаёт разрешение
 * проигрывать звук конкретному элементу — после того как его запустили в ответ
 * на касание. У этого элемента разрешение сохраняется, и он продолжает играть,
 * когда пользователь уходит в другое приложение или гасит экран. Новый элемент,
 * созданный уже в фоне, играть не начнёт: жеста не было.
 *
 * Поэтому источник подменяется у одного и того же элемента, а очередь фраз
 * двигается по событию `ended` — таймеры в фоне iOS придушивает, а события
 * медиа-элемента приходят.
 */

let el: HTMLAudioElement | null = null;

export function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (el) return el;
  el = document.createElement("audio");
  el.preload = "auto";
  // Чтобы iOS не пытался открыть нативный плеер поверх страницы.
  el.setAttribute("playsinline", "");
  el.style.display = "none";
  document.body.appendChild(el);
  return el;
}

/**
 * Разблокировать звук. Вызывать строго из обработчика касания/клика:
 * короткий play() по тишине выдаёт элементу разрешение на дальнейшую
 * работу, в том числе в фоне.
 */
export function unlockAudio(): void {
  const a = getAudioElement();
  if (!a || a.dataset.unlocked === "1") return;
  a.dataset.unlocked = "1";
  a.src = SILENCE_URL;
  a.play().catch(() => {
    // Не удалось — просто попробуем в следующий раз.
    delete a.dataset.unlocked;
  });
}

// Секунда тишины. Используется и для разблокировки, и как пауза между
// карточками в фоне: пауза, сделанная звуком, не зависит от таймеров.
export const SILENCE_URL = "/audio/silence-1s.mp3";

export type PlayOutcome = "ended" | "error" | "cancelled";

// Незавершённое воспроизведение на общем элементе. Элемент один, поэтому
// новый playUrl забирает его себе — и обязан закрыть предыдущее обещание.
// Иначе тот, кто его ждёт, зависает навсегда: обработчики перезаписаны и
// событий он уже не получит.
let settlePending: ((outcome: PlayOutcome) => void) | null = null;

/**
 * Проиграть один URL на общем элементе. Возвращает, чем закончилось:
 * "ended" — доиграл, "error" — файла нет или не смог, "cancelled" — прервали.
 */
export function playUrl(url: string, token: () => boolean): Promise<PlayOutcome> {
  const a = getAudioElement();
  if (!a) return Promise.resolve("error");

  settlePending?.("cancelled");

  return new Promise((resolve) => {
    let settled = false;
    let started = false;

    const cleanup = () => {
      a.onplaying = null;
      a.onended = null;
      a.onerror = null;
      if (settlePending === done) settlePending = null;
    };
    const done = (outcome: PlayOutcome) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(outcome === "cancelled" || token() ? outcome : "cancelled");
    };
    settlePending = done;

    a.onplaying = () => {
      started = true;
    };
    a.onended = () => done("ended");
    // Сбой после старта означает, что фраза уже прозвучала — второй раз
    // читать её системным голосом не нужно.
    a.onerror = () => done(started ? "ended" : "error");

    a.src = url;
    a.play().catch(() => done(started ? "ended" : "error"));
  });
}

export function stopAudioElement(): void {
  const a = el;
  if (!a) return;
  settlePending?.("cancelled");
  a.onplaying = null;
  a.onended = null;
  a.onerror = null;
  a.pause();
  // src не чистим: пустой src у общего элемента на iOS роняет разрешение,
  // и следующий play() уже в фоне не сработает.
}

/** Данные для экрана блокировки и системных кнопок. */
export function setMediaSessionMetadata(title: string, artist: string): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: "Belajar Bahasa",
      artwork: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  } catch {}
}

type Handlers = Partial<
  Record<"play" | "pause" | "nexttrack" | "previoustrack", () => void>
>;

/** Кнопки на экране блокировки и в наушниках. */
export function setMediaSessionHandlers(handlers: Handlers): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  for (const [action, fn] of Object.entries(handlers)) {
    try {
      navigator.mediaSession.setActionHandler(
        action as MediaSessionAction,
        fn ?? null,
      );
    } catch {}
  }
}

export function setMediaSessionPlaying(playing: boolean): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  } catch {}
}
