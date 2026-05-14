const CACHE_NAME = 'fitness-tracker-v2';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).then(fetchRes => {
        if (!fetchRes || fetchRes.status !== 200) return fetchRes;
        const resClone = fetchRes.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
        return fetchRes;
      }).catch(() => {
        return caches.match('/index.html');
      });
    })
  );
});