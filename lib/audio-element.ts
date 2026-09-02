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
 * Заявить систему о себе как о полноценном плеере.
 *
 * Аудиосессия по умолчанию («auto») трактуется как фоновый звук страницы:
 * подсказка навигатора не приглушает нас, а забирает звук целиком. Тип
 * `playback` — это то, чем объявляют себя музыкальные приложения; с ним чужая
 * короткая реплика чаще всего только приглушает нашу озвучку.
 *
 * API есть не везде (WebKit 16.4+), поэтому всё под try/catch.
 */
function claimPlaybackSession(): void {
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } })
      .audioSession;
    if (session) session.type = "playback";
  } catch {}
}

/**
 * Разблокировать звук. Вызывать строго из обработчика касания/клика:
 * короткий play() по тишине выдаёт элементу разрешение на дальнейшую
 * работу, в том числе в фоне.
 */
export function unlockAudio(): void {
  const a = getAudioElement();
  claimPlaybackSession();
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

// Сколько ждём, что звук вообще пойдёт после play().
const START_MS = 8000;
// Звук идёт — вот столько тишины считаем нормальной паузой между событиями
// `timeupdate`, дольше — что-то случилось.
const STALL_MS = 1500;
// Замолчали посреди фразы: так выглядит перехват звука чужим приложением
// (подсказка навигатора, звонок). Пробуем вернуть звук в течение этого окна.
const RESUME_WINDOW_MS = 60000;
// Столько же, но для случая «фраза так и не началась» на элементе, который
// вообще ещё ни разу не звучал: там вероятнее не перехват, а потерянное
// разрешение, и висеть минуту незачем.
const RESUME_WINDOW_COLD_MS = 10000;

// Элемент хоть раз реально звучал — значит, разрешение на звук у него есть.
// Тогда «play() молчит» почти всегда означает перехват, а не запрет.
let everPlayed = false;
// Как часто просим систему вернуть нам звук.
const RESUME_EVERY_MS = 600;

// Тот, кто сейчас ждёт звука, оставляет здесь способ разбудить себя: сигналы
// «сессия снова наша» и «страница вернулась на экран» приходят снаружи playUrl.
let requestResume: (() => void) | null = null;
let signalsAttached = false;

function attachResumeSignals(): void {
  if (signalsAttached || typeof window === "undefined") return;
  signalsAttached = true;
  const wake = () => requestResume?.();
  document.addEventListener("visibilitychange", wake);
  window.addEventListener("focus", wake);
  window.addEventListener("pageshow", wake);
  try {
    const session = (
      navigator as unknown as {
        audioSession?: EventTarget & { type: string };
      }
    ).audioSession;
    // Черновой AudioSession API: сюда прилетает конец перехвата — самый
    // честный сигнал «навигатор договорил, можно продолжать».
    session?.addEventListener?.("statechange", wake);
  } catch {}
}

/**
 * Проиграть один URL на общем элементе. Возвращает, чем закончилось:
 * "ended" — доиграл, "error" — файла нет или не смог, "cancelled" — прервали.
 *
 * Отдельная забота — перехват звука. Когда чужое приложение (навигатор,
 * звонок) забирает аудио, элемент просто встаёт: ни `ended`, ни `error` не
 * приходит. Раньше обещание в этот момент повисало навсегда, и вся очередь
 * озвучки замирала — со стороны это выглядело как «поиграло пару карточек и
 * встало на паузу». Теперь за звуком следит сторож: пока фраза должна
 * звучать, он повторяет play(), а если вернуть звук так и не вышло — закрывает
 * обещание, чтобы очередь пошла дальше.
 */
export function playUrl(url: string, token: () => boolean): Promise<PlayOutcome> {
  const a = getAudioElement();
  if (!a) return Promise.resolve("error");

  attachResumeSignals();
  settlePending?.("cancelled");

  return new Promise((resolve) => {
    let settled = false;
    let started = false;
    let timer = 0;
    // Когда заметили тишину. 0 — звук идёт.
    let silentSince = 0;

    const cleanup = () => {
      a.onplaying = null;
      a.onended = null;
      a.onerror = null;
      a.onpause = null;
      a.ontimeupdate = null;
      window.clearTimeout(timer);
      if (settlePending === done) settlePending = null;
      if (requestResume === wake) requestResume = null;
    };
    const done = (outcome: PlayOutcome) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(outcome === "cancelled" || token() ? outcome : "cancelled");
    };
    settlePending = done;

    const arm = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(check, ms);
    };
    // Звук слышно — сбрасываем счётчик перехвата.
    const heard = () => {
      silentSince = 0;
      arm(STALL_MS);
    };
    const wake = () => {
      if (!settled && silentSince) arm(0);
    };
    requestResume = wake;

    const check = () => {
      if (settled) return;
      if (!token()) return done("cancelled");
      if (a.ended) return done("ended");
      // Битый или отсутствующий файл виден сразу — тут не перехват.
      if (a.error) return done(started ? "ended" : "error");
      const now = Date.now();
      if (!silentSince) silentSince = now;
      const limit =
        started || everPlayed ? RESUME_WINDOW_MS : RESUME_WINDOW_COLD_MS;
      if (now - silentSince > limit) {
        // Сдаёмся. Уже звучавшую фразу вторым голосом не переспрашиваем.
        return done(started ? "ended" : "error");
      }
      a.play().catch(() => {});
      arm(RESUME_EVERY_MS);
    };

    a.onplaying = () => {
      started = true;
      everPlayed = true;
      heard();
    };
    // Пока идёт звук, `timeupdate` приходит несколько раз в секунду — это и
    // есть признак жизни, по которому сторож отодвигается.
    a.ontimeupdate = () => {
      if (started && !a.paused) heard();
    };
    a.onended = () => done("ended");
    // Сбой после старта означает, что фраза уже прозвучала — второй раз
    // читать её системным голосом не нужно.
    a.onerror = () => done(started ? "ended" : "error");
    // Внезапная пауза посреди фразы — это перехват. Проверяем сразу, не ожидая
    // сторожа. (Пауза до старта — это смена src, её пропускаем.)
    a.onpause = () => {
      if (started && !a.ended) arm(0);
    };

    a.src = url;
    arm(START_MS);
    a.play().catch(() => {
      // Отказ бывает двух видов: файла нет (тогда придёт и `error`) и система
      // не дала звук (перехват, потерянное разрешение). Первый закрываем
      // сразу, со вторым идём в сторожа — он попробует ещё.
      if (a.error) done("error");
      else arm(RESUME_EVERY_MS);
    });
  });
}

export function stopAudioElement(): void {
  const a = el;
  if (!a) return;
  settlePending?.("cancelled");
  a.onplaying = null;
  a.onended = null;
  a.onerror = null;
  a.onpause = null;
  a.ontimeupdate = null;
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
