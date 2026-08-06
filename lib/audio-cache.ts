"use client";

/**
 * Локальный кеш озвучки.
 *
 * Зачем: раньше `<audio>` получал сетевой URL и уходил за файлом ровно в тот
 * момент, когда фразу надо произнести. Дома по Wi-Fi это незаметно, а в машине
 * (сотовая сеть, сервер за Tailscale) запрос иногда не успевал или срывался —
 * и фраза просто пропадала. Плюс медиа-запросы Safari шлёт с Range-заголовком,
 * а service worker отдаёт на них целый ответ, и это тоже иногда не проигрывалось.
 *
 * Теперь файл сначала скачивается обычным fetch (его кеширует service worker,
 * см. public/sw.js), а элементу отдаётся blob: — то есть данные, которые уже
 * лежат в памяти. Сеть перестаёт участвовать в моменте воспроизведения.
 */

// Blob'ы держим в памяти ограниченно: набор целиком — это мегабайты, а
// телефону это память. Порядок вставки в Map = порядок вытеснения.
const MAX_BLOBS = 120;
const blobs = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function remember(url: string, objectUrl: string) {
  blobs.set(url, objectUrl);
  while (blobs.size > MAX_BLOBS) {
    const oldest = blobs.keys().next().value;
    if (oldest === undefined) break;
    const dead = blobs.get(oldest);
    blobs.delete(oldest);
    // Вытесняем самое давнее — то, что играло десятки карточек назад.
    if (dead) URL.revokeObjectURL(dead);
  }
}

/**
 * URL, который можно отдать `<audio>`: blob, если файл удалось скачать.
 * Если скачать не вышло, возвращается исходный адрес — пусть элемент
 * попробует сам, вдруг ответит service worker.
 */
export function getPlayableUrl(url: string): Promise<string> {
  const hit = blobs.get(url);
  if (hit) {
    // Освежаем позицию в очереди вытеснения.
    blobs.delete(url);
    blobs.set(url, hit);
    return Promise.resolve(hit);
  }

  const pending = inflight.get(url);
  if (pending) return pending;

  const task = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return url;
      const objectUrl = URL.createObjectURL(await res.blob());
      remember(url, objectUrl);
      return objectUrl;
    } catch {
      return url;
    } finally {
      inflight.delete(url);
    }
  })();
  inflight.set(url, task);
  return task;
}

/** Скачать заранее, ничего не проигрывая. Ошибки не важны: это подготовка. */
export function warm(urls: string[]): void {
  for (const url of urls) {
    if (blobs.has(url) || inflight.has(url)) continue;
    void getPlayableUrl(url);
  }
}

/**
 * Положить набор в кеш service worker'а — чтобы озвучка работала вообще без
 * сети. В память blob'ы при этом не тянем: набор целиком туда не влезет.
 */
export async function prefetchToCache(
  urls: string[],
  opts: {
    onProgress?: (done: number, total: number) => void;
    signal?: AbortSignal;
    concurrency?: number;
  } = {},
): Promise<void> {
  const { onProgress, signal, concurrency = 4 } = opts;
  const queue = [...new Set(urls)];
  const total = queue.length;
  let done = 0;

  const worker = async () => {
    for (;;) {
      if (signal?.aborted) return;
      const url = queue.shift();
      if (!url) return;
      try {
        const res = await fetch(url);
        // Тело нужно дочитать: пока оно не прочитано, service worker не
        // успевает положить ответ в кеш.
        if (res.ok) await res.arrayBuffer();
      } catch {
        // Один недокачанный файл не повод останавливать всё.
      }
      onProgress?.(++done, total);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, total) }, worker),
  );
}

/**
 * Сколько из этих файлов уже лежит в кеше service worker'а.
 * Считаем одним проходом по ключам кеша: поштучный caches.match на пол-тысячи
 * адресов заметно тормозит при открытии набора.
 */
export async function countCached(urls: string[]): Promise<number> {
  if (typeof caches === "undefined") return 0;
  const wanted = new Set(urls);
  let n = 0;
  try {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const req of await cache.keys()) {
        if (wanted.has(new URL(req.url).pathname)) n++;
      }
    }
  } catch {
    return n;
  }
  return n;
}
