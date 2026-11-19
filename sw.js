const CACHE_NAME = 'athar-final-v8';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// تثبيت: حفظ كل الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// تنشيط: حذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

// ⭐⭐⭐ الحل الجذري هنا: الكاش أولاً للتنقل ⭐⭐⭐
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // إذا كان طلب تنقل (فتح التطبيق من الأيقونة)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => {
        // أعد index.html من الكاش فوراً (حتى لو الإنترنت موجود)
        return cached || fetch(request);
      })
    );
    return;
  }

  // لباقي الطلبات: الكاش أولاً، ثم الشبكة
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
