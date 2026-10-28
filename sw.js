// 1. تعريف اسم الكاش (تم تغيير الإصدار إلى v2 لضمان التحديث)
const CACHE_NAME = 'athar-cache-v2';

// 2. الملفات الأساسية التي سيتم تخزينها فوراً (بدون روابط خارجية لتجنب مشاكل CORS)
const ASSETS_TO_CACHE = [
  '/',
  'index.html'
];

// ==========================================
// 1. حدث التثبيت (Install): تخزين الملفات الأساسية
// ==========================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // نستخدم catch لمنع فشل التثبيت بالكامل إذا كانت هناك مشكلة في ملف واحد
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('تنبيه: فشل في تخزين بعض الملفات مسبقاً:', err);
      });
    })
  );
  // تفعيل عامل الخدمة فوراً دون انتظار إغلاق الصفحة
  self.skipWaiting();
});

// ==========================================
// 2. حدث التنشيط (Activate): تنظيف الكاش القديم
// ==========================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // حذف أي كاش لا يحمل الاسم الحالي
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // السيطرة على جميع صفحات العميل فوراً
  self.clients.claim();
});

// ==========================================
// 3. حدث الجلب (Fetch): تقديم المحتوى من الكاش أو الشبكة
// ==========================================
self.addEventListener('fetch', (event) => {
  // تجاهل أي طلبات ليست من نوع http أو https (مثل chrome-extension)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا كان الملف موجوداً في الكاش، أرجعه فوراً (أسرع وأوفلاين)
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا لم يكن موجوداً، اطلبه من الشبكة
      return fetch(event.request).then((networkResponse) => {
        // تحقق من أن الاستجابة ناجحة قبل تخزينها
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // تخزين الاستجابة الجديدة في الكاش للاستخدام المستقبلي
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // ==========================================
        // خطة الطوارئ عند انقطاع الإنترنت تماماً
        // ==========================================
        if (event.request.mode === 'navigate') {
          // إذا كان المستخدم يحاول فتح صفحة، أرجع الصفحة الرئيسية
          return caches.match('/index.html');
        }
        // للصور أو الخطوط أو البيانات، أرجع استجابة فارغة لتجنب تحطيم التطبيق
        return new Response('', { status: 408, statusText: 'أنت غير متصل بالإنترنت' });
      });
    })
  );
});
