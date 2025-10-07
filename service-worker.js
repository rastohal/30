// Simple service worker: cache essential files for offline use
const CACHE_NAME = 'foodtracker-v2-cache-v1';
const URLS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'icon.png',
  'service-worker.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // network-first for index.html (to pick up updates), cache-first for others
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);

  if(url.pathname.endsWith('index.html') || url.pathname === '/' ){
    event.respondWith(
      fetch(req).then(resp => {
        // update cache
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return resp;
      }).catch(()=> caches.match(req).then(r => r || caches.match('index.html')))
    );
  } else {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(resp => {
        // optionally cache fetched response
        return resp;
      }).catch(()=> {
        // fallback to cache for some assets
        return caches.match('index.html');
      }))
    );
  }
});
