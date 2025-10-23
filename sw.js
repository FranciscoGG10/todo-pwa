const CACHE_NAME = 'todo-pwa-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            if (event.request.method === 'GET' && response && response.status === 200) {
              try { cache.put(event.request, response.clone()); } catch(e){ }
            }
            return response;
          });
        })
        .catch(() => {
          if (event.request.destination === 'image') {
            return caches.match('./icons/icon-192.png');
          }
        });
    })
  );
});
