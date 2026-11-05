// BLOCK DRIVE 150 — offline app-shell cache
// Upgrade CACHE_NAME when releasing a new version.
const CACHE_NAME = 'block-drive-150-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(names => Promise.all(names.filter(n => n.startsWith('block-drive-150-') && n !== CACHE_NAME).map(n => caches.delete(n)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // offline first for our own app files; no network needed once installed
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response.ok && url.pathname.startsWith(new URL(self.registration.scope).pathname)) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request,copy));
      }
      return response;
    }).catch(() => {
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      return Response.error();
    });
  }));
});
