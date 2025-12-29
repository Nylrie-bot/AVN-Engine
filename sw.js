const CACHE_NAME = "avn-cache-v1";

// Pastikan semua path diawali dengan nama repository kamu
const urlsToCache = [
  "/AVN-Engine/",
  "/AVN-Engine/index.html",
  "/AVN-Engine/manifest.json",
  "/AVN-Engine/icons/icon-72x72.png",
  "/AVN-Engine/icons/icon-96x96.png",
  "/AVN-Engine/icons/icon-192x192.png",
  "/AVN-Engine/icons/icon-512x512.png"
];

// Install SW & cache file
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Membuka cache dan menambahkan aset');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate SW & clean old cache
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch cached content
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      // Kembalikan dari cache, jika tidak ada baru ambil dari internet
      return resp || fetch(event.request);
    })
  );
});
