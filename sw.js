const CACHE_NAME = 'athar-cache-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  '',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:wght@400;700&display=swap'
];

// 1. تثبيت عامل الخدمة وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. تنظيف ذاكرات التخزين المؤقت القديمة عند التحديث
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. اعتراض طلبات الشبكة لتقديم النسخة المحفوظة عند انقطاع الإنترنت
self.addEventListener('fetch', (event) => {
  // للملاحة (صفحات HTML)، استخدم الذاكرة أولاً ثم الشبكة
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(() => caches.match('/index.html'));
      })
    );
    return;
  }

  // لباقي الطلبات (مثل الخطوط)، استخدم الذاكرة أولاً
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // في حال فشل الطلب (أوفلاين)، التطبيق الأصلي يتعامل مع ذلك بالفعل عبر رسائل الخطأ الودودة
      });
    })
  );
});
