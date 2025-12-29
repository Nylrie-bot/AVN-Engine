const CACHE_NAME = 'avn-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // tambahkan CSS/JS tambahan jika ada
];

// Install Service Worker dan cache file statis
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate SW & hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch handler: cache first, network fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});

// Push notification
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'Angkringan VN', body: 'VN Baru Tersedia!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png'
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsList => {
      if (clientsList.length > 0) {
        clientsList[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});

// Auto-update cache untuk VN baru (menggunakan API fetch feed)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-vn-updates') {
    event.waitUntil(updateVNCache());
  }
});

async function updateVNCache() {
  try {
    const res = await fetch('https://angkringanvisualnovel.blogspot.com/feeds/posts/default?alt=json');
    const data = await res.json();
    const newPosts = data.feed.entry || [];
    const newLinks = newPosts.map(p => p.link.find(l => l.rel === 'alternate').href);

    const cache = await caches.open(CACHE_NAME);
    for (const link of newLinks) {
      if (!(await cache.match(link))) {
        // fetch & cache VN baru
        const resp = await fetch(link);
        cache.put(link, resp.clone());
        // push notification untuk VN baru
        self.registration.showNotification('Angkringan VN', {
          body: 'VN Baru Tersedia!',
          icon: '/icons/icon-192x192.png'
        });
      }
    }
  } catch (err) {
    console.error('Gagal update VN:', err);
  }
}
