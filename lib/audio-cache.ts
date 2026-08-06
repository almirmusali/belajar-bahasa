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
 * Теперь файл сначала скачивается обычным fetch, а элементу отдаётся blob: —
 * то есть данные, которые уже лежат в памяти. Сеть перестаёт участвовать в
 * моменте воспроизведения.
 *
 * Два уровня:
 *  - «горячие» blob'ы вокруг текущей карточки, с вытеснением по давности;
 *  - закреплённый набор — то, что пользователь скачал кнопкой; не вытесняется,
 *    пока он не откроет другой набор.
 *
 * Если сайт открыт по https (или с localhost), поверх этого работает ещё и
 * кеш service worker'а — тогда озвучка переживает перезагрузку. По http
 * Cache API браузером не даётся вовсе, поэтому память — единственный уровень.
 */

const MAX_BLOBS = 120;
// Самый большой набор словаря — 177 слов на три языка, 531 файл.
const MAX_PINNED = 600;

const blobs = new Map<string, string>();
const pinned = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function lookup(url: string): string | undefined {
  const kept = pinned.get(url);
  if (kept) return kept;
  const hot = blobs.get(url);
  if (hot) {
    // Освежаем позицию в очереди вытеснения.
    blobs.delete(url);
    blobs.set(url, hot);
  }
  return hot;
}

function release(url: string, objectUrl: string) {
  // Один и тот же файл может лежать на обоих уровнях — отзываем только когда
  // его больше никто не держит, иначе оборвём то, что сейчас играет.
  if (pinned.get(url) === objectUrl || blobs.get(url) === objectUrl) return;
  URL.revokeObjectURL(objectUrl);
}

function remember(url: string, objectUrl: string, keep: boolean) {
  const store = keep ? pinned : blobs;
  const limit = keep ? MAX_PINNED : MAX_BLOBS;
  store.set(url, objectUrl);
  while (store.size > limit) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    const dead = store.get(oldest);
    store.delete(oldest);
    if (dead) release(oldest, dead);
  }
}

async function fetchBlobUrl(url: string, keep: boolean): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const objectUrl = URL.createObjectURL(await res.blob());
    remember(url, objectUrl, keep);
    return objectUrl;
  } catch {
    // Сеть не дала — пусть элемент попробует сам, вдруг ответит service worker.
    return url;
  }
}

/**
 * URL, который можно отдать `<audio>`: blob, если файл удалось скачать.
 * Если скачать не вышло, возвращается исходный адрес.
 */
export function getPlayableUrl(url: string): Promise<string> {
  const hit = lookup(url);
  if (hit) return Promise.resolve(hit);

  const pending = inflight.get(url);
  if (pending) return pending;

  const task = fetchBlobUrl(url, false).finally(() => inflight.delete(url));
  inflight.set(url, task);
  return task;
}

/**
 * Переживёт ли скачанное перезагрузку страницы. По http браузер не даёт
 * Cache API вовсе, и набор живёт только в памяти вкладки — об этом честнее
 * сказать в интерфейсе, чем обещать оффлайн навсегда.
 */
export function hasPersistentCache(): boolean {
  return typeof caches !== "undefined";
}

/** Скачать заранее, ничего не проигрывая. Ошибки не важны: это подготовка. */
export function warm(urls: string[]): void {
  for (const url of urls) {
    if (lookup(url) || inflight.has(url)) continue;
    void getPlayableUrl(url);
  }
}

/**
 * Скачать набор целиком и закрепить в памяти — чтобы озвучка не зависела от
 * сети вообще. Возвращает, сколько файлов реально готово.
 */
export async function downloadSet(
  urls: string[],
  opts: {
    onProgress?: (done: number, total: number) => void;
    signal?: AbortSignal;
    concurrency?: number;
  } = {},
): Promise<number> {
  const { onProgress, signal, concurrency = 4 } = opts;
  const wanted = new Set(urls);

  // Ждём, пока service worker возьмёт страницу под контроль: запросы, ушедшие
  // раньше, он не увидит и в кеш не положит — при первом заходе так терялась
  // часть набора, и после перезагрузки приходилось докачивать.
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch {
      // Нет service worker'а — просто качаем в память.
    }
  }

  // Прошлый набор больше не нужен — освобождаем память.
  for (const [url, objectUrl] of [...pinned]) {
    if (wanted.has(url)) continue;
    pinned.delete(url);
    release(url, objectUrl);
  }

  const queue = [...wanted];
  const total = queue.length;
  let done = 0;

  const worker = async () => {
    for (;;) {
      if (signal?.aborted) return;
      const url = queue.shift();
      if (!url) return;
      const hot = blobs.get(url);
      if (hot) {
        // Уже качали по ходу озвучки — просто переводим в закреплённые.
        blobs.delete(url);
        remember(url, hot, true);
      } else if (!pinned.has(url)) {
        await fetchBlobUrl(url, true);
      }
      onProgress?.(++done, total);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, total) }, worker),
  );
  return countReadySync(urls);
}

function countReadySync(urls: string[]): number {
  let n = 0;
  for (const url of new Set(urls)) if (lookup(url)) n++;
  return n;
}

/**
 * Сколько файлов готово играть без сети: в памяти или в кеше service worker'а.
 * Кеш обходим одним проходом по ключам — поштучный caches.match на пол-тысячи
 * адресов заметно тормозит при открытии набора.
 */
export async function countReady(urls: string[]): Promise<number> {
  const wanted = new Set(urls);
  const ready = new Set<string>();
  for (const url of wanted) if (lookup(url)) ready.add(url);

  if (typeof caches === "undefined") return ready.size;
  try {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const req of await cache.keys()) {
        const path = new URL(req.url).pathname;
        if (wanted.has(path)) ready.add(path);
      }
    }
  } catch {
    return ready.size;
  }
  return ready.size;
}
