"use client";

// Сбор событий читалки. События копятся в очереди и уходят пачкой на
// /api/track: раз в десять секунд — обычным fetch, а при уходе со страницы —
// через sendBeacon, единственный способ ничего не потерять при закрытии
// вкладки.
//
// Особый случай — событие, рождённое уже во время ухода (обработчики pagehide
// других модулей досылают хвосты: незасчитанные секунды, последнюю позицию).
// Наш собственный beacon к этому моменту мог уже улететь, поэтому track(),
// вызванный на скрытой странице, не ждёт таймера, а шлёт немедленно. Порядок
// подписки на pagehide перестаёт иметь значение.
//
// Личность: user_id клиент о себе не сообщает — его сервер берёт из
// Supabase-сессии в cookies (самоназванному id верить нельзя). Клиент шлёт
// только anon_id — случайный UUID из localStorage, общий для всех событий
// этого браузера. По нему сервер склеивает анонимную историю с аккаунтом
// после логина.

const ANON_KEY = "belajar:anon:v1";
const FLUSH_MS = 10_000;
const QUEUE_MAX = 200;

export type TrackType =
  | "chapter_open"
  | "word_lookup"
  | "par_translate"
  | "show_all"
  | "read_progress"
  | "read_time";

type QueuedEvent = {
  type: TrackType;
  book: string;
  chapter: number;
  meta: Record<string, unknown>;
};

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let installed = false;

function anonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    // Приватный режим без localStorage: события уйдут без анонимной личности.
    return "no-storage";
  }
}

function send(useBeacon: boolean) {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const body = JSON.stringify({ anon_id: anonId(), events: batch });

  if (useBeacon && typeof navigator.sendBeacon === "function") {
    const ok = navigator.sendBeacon(
      "/api/track",
      new Blob([body], { type: "application/json" }),
    );
    if (!ok) queue = batch.concat(queue).slice(0, QUEUE_MAX);
    return;
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    // Пачка доживает, даже если fetch стартовал за миг до навигации.
    keepalive: true,
  }).catch(() => {
    queue = batch.concat(queue).slice(0, QUEUE_MAX);
  });
}

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("pagehide", () => send(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") send(true);
  });
}

export function track(
  type: TrackType,
  book: string,
  chapter: number,
  meta: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  install();
  queue.push({ type, book, chapter, meta });
  if (queue.length > QUEUE_MAX) queue = queue.slice(-QUEUE_MAX);

  if (document.visibilityState === "hidden") {
    send(true);
    return;
  }
  if (!timer) timer = setTimeout(() => send(false), FLUSH_MS);
}
