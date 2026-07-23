// MultitaskCoder — Service Worker
// Minimal "app shell" cache so the static site keeps working offline / on
// repeat visits. Bump CACHE_NAME whenever any cached file changes so old
// clients pick up the new version instead of a stale cache.

const CACHE_NAME = 'multitaskcoder-v1';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './assets/icons/favicon.ico',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './pages/theory.html',
  './pages/typing.html',
  './pages/typing.js',
  './pages/debugger.html',
  './pages/debugger.js',
  './pages/quizzes.html',
  './pages/quizzes.js',
  './pages/analytics.html',
  './pages/analytics.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Cache-first for same-origin GET requests, falling back to the network
// and then to whatever is already cached if the network is unavailable.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
