const CACHE_NAME = 'athar-cache-v6'; // تم التحديث إلى v6
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// تثبيت Service Worker الجديد
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('تنبيه: فشل تخزين بعض الملفات:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// تنشيط Service Worker وحذف الكاش القديم فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('', { status: 408, statusText: 'أنت غير متصل بالإنترنت' });
      });
    })
  );
});
