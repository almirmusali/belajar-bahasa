// Service worker для offline-режима PWA.
// Стратегии:
//  - HTML / navigation: network-first → cache fallback
//    Это значит свежие страницы при онлайне, и кеш когда нет сети.
//  - Статика (JS, CSS, изображения): cache-first → network fallback
//    Закешированные ассеты грузятся мгновенно, новые ходят за сетью.
//  - Чужой origin (Supabase, OpenAI и т.п.): не вмешиваемся.

const VERSION = "v5";
const CACHE = `belajar-${VERSION}`;

// Маршруты, которые предзагружаются сразу при установке SW —
// чтобы при первом оффлайне базовые экраны открывались без сети.
const SHELL = [
  "/",
  "/vocab",
  "/vocab/learned",
  "/account",
  "/login",
  "/signup",
  "/lessons/1",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled(
          SHELL.map((url) =>
            fetch(url, { cache: "reload" })
              .then((res) => (res.ok ? cache.put(url, res) : undefined))
              .catch(() => undefined),
          ),
        ),
      ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Только наш origin — чужие домены (Supabase Storage, OpenAI) не трогаем
  if (url.origin !== self.location.origin) return;

  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // Network-first для HTML: свежие версии быстро доезжают, фоллбек на кеш оффлайн
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match("/")),
        ),
    );
    return;
  }

  // Cache-first для всех остальных ресурсов (JS/CSS/изображения)
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached),
    ),
  );
});

// Сообщение от клиента — мгновенно активировать новую версию SW
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
