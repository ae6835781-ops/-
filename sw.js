// ====== كود التحديث التلقائي للـ Service Worker ======
if ('serviceWorker' in navigator) {
  // تسجيل Service Worker
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('تم تسجيل Service Worker:', registration.scope);
      
      // التحقق من وجود تحديثات كل ساعة
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // كل ساعة
      
      // الاستماع للتحديثات
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // يوجد تحديث جديد - اسأل المستخدم
            if (confirm('🎉 يوجد تحديث جديد للتطبيق! هل تريد التحديث الآن؟')) {
              newWorker.postMessage({ action: 'skipWaiting' });
              window.location.reload();
            }
          }
        });
      });
    })
    .catch(error => {
      console.log('فشل تسجيل Service Worker:', error);
    });
  
  // الاستماع لرسائل من Service Worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.action === 'reload') {
      window.location.reload();
    }
  });
}
// ==================================================
